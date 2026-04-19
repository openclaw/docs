---
read_when:
    - الإجابة عن الأسئلة الشائعة المتعلقة بالإعداد أو التثبيت أو الإعداد الأولي أو دعم وقت التشغيل
    - فرز المشكلات التي أبلغ عنها المستخدمون قبل إجراء تصحيح أعمق للأخطاء
summary: الأسئلة الشائعة حول إعداد OpenClaw وتكوينه واستخدامه
title: الأسئلة الشائعة
x-i18n:
    generated_at: "2026-04-19T07:16:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: f569fb0412797314a11c41a1bbfa14f5892d2d368544fa67800823a6457000e6
    source_path: help/faq.md
    workflow: 15
---

# الأسئلة الشائعة

إجابات سريعة بالإضافة إلى استكشاف أخطاء أعمق لبيئات الإعداد الواقعية (التطوير المحلي، VPS، تعدد الوكلاء، OAuth/مفاتيح API، والتحويل التلقائي بين النماذج عند الفشل). لتشخيصات وقت التشغيل، راجع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). وللاطلاع على مرجع التكوين الكامل، راجع [التكوين](/ar/gateway/configuration).

## أول 60 ثانية إذا كان هناك شيء معطل

1. **الحالة السريعة (أول فحص)**

   ```bash
   openclaw status
   ```

   ملخص محلي سريع: نظام التشغيل + التحديث، إمكانية الوصول إلى Gateway/الخدمة، الوكلاء/الجلسات، تكوين المزوّد + مشكلات وقت التشغيل (عندما يكون Gateway قابلاً للوصول).

2. **تقرير قابل للمشاركة (آمن للمشاركة)**

   ```bash
   openclaw status --all
   ```

   تشخيص للقراءة فقط مع ذيل السجل (مع إخفاء الرموز المميزة).

3. **حالة العملية الخدمية + المنفذ**

   ```bash
   openclaw gateway status
   ```

   يعرض وقت تشغيل المشرف مقابل إمكانية الوصول إلى RPC، وعنوان URL المستهدف للفحص، وأي تكوين يُرجَّح أن الخدمة استخدمته.

4. **فحوصات متعمقة**

   ```bash
   openclaw status --deep
   ```

   يُجري فحصًا حيًا لصحة Gateway، بما في ذلك فحوصات القنوات عندما تكون مدعومة
   (يتطلب Gateway قابلاً للوصول). راجع [الصحة](/ar/gateway/health).

5. **تتبّع أحدث سجل**

   ```bash
   openclaw logs --follow
   ```

   إذا كان RPC متوقفًا، فارجع إلى:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   سجلات الملفات منفصلة عن سجلات الخدمة؛ راجع [التسجيل](/ar/logging) و[استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

6. **شغّل Doctor (الإصلاحات)**

   ```bash
   openclaw doctor
   ```

   يُصلح/يُرحّل التكوين/الحالة ويُجري فحوصات الصحة. راجع [Doctor](/ar/gateway/doctor).

7. **لقطة لحالة Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # يعرض عنوان URL المستهدف + مسار التكوين عند حدوث أخطاء
   ```

   يطلب من Gateway قيد التشغيل لقطة كاملة للحالة (عبر WS فقط). راجع [الصحة](/ar/gateway/health).

## البدء السريع والإعداد عند أول تشغيل

<AccordionGroup>
  <Accordion title="أنا عالق، ما أسرع طريقة للخروج من هذا المأزق؟">
    استخدم وكيل AI محلي يمكنه **رؤية جهازك**. هذا أكثر فعالية بكثير من السؤال
    في Discord، لأن معظم حالات "أنا عالق" تكون **مشكلات تكوين أو بيئة محلية**
    لا يستطيع المساعدون عن بُعد فحصها.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    تستطيع هذه الأدوات قراءة المستودع، وتشغيل الأوامر، وفحص السجلات، والمساعدة في إصلاح
    الإعداد على مستوى جهازك (PATH، الخدمات، الأذونات، ملفات المصادقة). امنحها **النسخة المصدرية الكاملة**
    عبر تثبيت hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يثبّت هذا OpenClaw **من نسخة git محلية**، بحيث يمكن للوكيل قراءة الشيفرة + الوثائق
    والاستدلال على الإصدار الدقيق الذي تستخدمه. يمكنك دائمًا العودة إلى الإصدار المستقر لاحقًا
    عبر إعادة تشغيل المُثبّت من دون `--install-method git`.

    نصيحة: اطلب من الوكيل **التخطيط للإصلاح والإشراف عليه** (خطوة بخطوة)، ثم تنفيذ
    الأوامر الضرورية فقط. هذا يُبقي التغييرات صغيرة وأسهل للمراجعة.

    إذا اكتشفت خللًا حقيقيًا أو إصلاحًا، فيُرجى فتح issue على GitHub أو إرسال PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    ابدأ بهذه الأوامر (وشارك المخرجات عند طلب المساعدة):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    ما الذي تفعله:

    - `openclaw status`: لقطة سريعة لصحة Gateway/الوكيل + التكوين الأساسي.
    - `openclaw models status`: يفحص مصادقة المزوّد + توفر النماذج.
    - `openclaw doctor`: يتحقق من مشكلات التكوين/الحالة الشائعة ويُصلحها.

    فحوصات CLI أخرى مفيدة: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    حلقة تصحيح سريعة: [أول 60 ثانية إذا كان هناك شيء معطل](#أول-60-ثانية-إذا-كان-هناك-شيء-معطل).
    وثائق التثبيت: [التثبيت](/ar/install)، [علامات المُثبّت](/ar/install/installer)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="Heartbeat يستمر في التخطي. ما معنى أسباب التخطي؟">
    أسباب تخطي Heartbeat الشائعة:

    - `quiet-hours`: خارج نافذة الساعات النشطة المكوّنة
    - `empty-heartbeat-file`: الملف `HEARTBEAT.md` موجود لكنه يحتوي فقط على هيكل فارغ/عناوين فقط
    - `no-tasks-due`: وضع المهام في `HEARTBEAT.md` نشط ولكن لم يحن موعد أي من فترات المهام بعد
    - `alerts-disabled`: كل إظهار Heartbeat معطّل (`showOk` و`showAlerts` و`useIndicator` كلها معطلة)

    في وضع المهام، لا يتم تقديم الطوابع الزمنية للاستحقاق إلا بعد اكتمال
    تشغيل Heartbeat فعلي. عمليات التشغيل المتخطاة لا تضع علامة على المهام على أنها مكتملة.

    الوثائق: [Heartbeat](/ar/gateway/heartbeat)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="الطريقة الموصى بها لتثبيت OpenClaw وإعداده">
    يوصي المستودع بالتشغيل من المصدر واستخدام الإعداد الأولي:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    يمكن للمعالج أيضًا بناء أصول واجهة المستخدم تلقائيًا. بعد الإعداد الأولي، عادةً ما تقوم بتشغيل Gateway على المنفذ **18789**.

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

  <Accordion title="كيف أفتح لوحة التحكم بعد الإعداد الأولي؟">
    يفتح المعالج متصفحك بعنوان URL نظيف للوحة التحكم (من دون رمز مميز) مباشرةً بعد الإعداد الأولي، كما يطبع الرابط أيضًا في الملخص. أبقِ علامة التبويب تلك مفتوحة؛ وإذا لم تُفتح تلقائيًا، فانسخ/ألصق عنوان URL المطبوع على الجهاز نفسه.
  </Accordion>

  <Accordion title="كيف أصادق على لوحة التحكم على localhost مقابل الوصول عن بُعد؟">
    **Localhost (الجهاز نفسه):**

    - افتح `http://127.0.0.1:18789/`.
    - إذا طلبت مصادقة shared-secret، فألصق الرمز المميز أو كلمة المرور المكوّنة في إعدادات Control UI.
    - مصدر الرمز المميز: `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
    - مصدر كلمة المرور: `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
    - إذا لم يتم تكوين shared secret بعد، فأنشئ رمزًا مميزًا باستخدام `openclaw doctor --generate-gateway-token`.

    **ليس على localhost:**

    - **Tailscale Serve** (موصى به): أبقِ الربط على loopback، وشغّل `openclaw gateway --tailscale serve`، ثم افتح `https://<magicdns>/`. إذا كانت `gateway.auth.allowTailscale` تساوي `true`، فإن ترويسات الهوية تفي بمصادقة Control UI/WebSocket (من دون لصق shared secret، مع افتراض موثوقية مضيف Gateway)؛ أما واجهات HTTP API فما تزال تتطلب مصادقة shared-secret إلا إذا استخدمت عمدًا `none` لإدخال خاص أو مصادقة HTTP عبر trusted-proxy. تتم مَسْلسلة محاولات مصادقة Serve المتزامنة السيئة من العميل نفسه قبل أن يسجل محدِّد المصادقة الفاشلة هذه المحاولات، لذلك قد تُظهر إعادة المحاولة السيئة الثانية بالفعل الرسالة `retry later`.
    - **ربط Tailnet**: شغّل `openclaw gateway --bind tailnet --token "<token>"` (أو كوّن مصادقة كلمة المرور)، وافتح `http://<tailscale-ip>:18789/`، ثم ألصق shared secret المطابق في إعدادات لوحة التحكم.
    - **وكيل عكسي مدرك للهوية**: أبقِ Gateway خلف trusted proxy غير مربوط بـ loopback، واضبط `gateway.auth.mode: "trusted-proxy"`، ثم افتح عنوان URL الخاص بالوكيل.
    - **نفق SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`. تظل مصادقة shared-secret مطبقة عبر النفق؛ ألصق الرمز المميز أو كلمة المرور المكوّنة إذا طُلِب منك ذلك.

    راجع [لوحة التحكم](/web/dashboard) و[أسطح الويب](/web) لمعرفة أوضاع الربط وتفاصيل المصادقة.

  </Accordion>

  <Accordion title="لماذا يوجد إعدادان مختلفان لموافقات exec في موافقات الدردشة؟">
    إنهما يتحكمان في طبقتين مختلفتين:

    - `approvals.exec`: يمرر مطالبات الموافقة إلى وجهات الدردشة
    - `channels.<channel>.execApprovals`: يجعل تلك القناة تعمل كعميل موافقة أصلي لموافقات exec

    ما تزال سياسة exec الخاصة بالمضيف هي بوابة الموافقة الفعلية. يتحكم تكوين الدردشة فقط في مكان ظهور
    مطالبات الموافقة وكيفية تمكّن الأشخاص من الرد عليها.

    في معظم الإعدادات **لا** تحتاج إلى كليهما:

    - إذا كانت الدردشة تدعم الأوامر والردود بالفعل، فإن `/approve` في الدردشة نفسها يعمل عبر المسار المشترك.
    - إذا كانت هناك قناة أصلية مدعومة تستطيع استنتاج الموافقين بأمان، فإن OpenClaw يفعّل الآن تلقائيًا الموافقات الأصلية المعتمدة على الرسائل الخاصة أولًا عندما تكون `channels.<channel>.execApprovals.enabled` غير معيّنة أو تساوي `"auto"`.
    - عندما تتوفر بطاقات/أزرار الموافقة الأصلية، تكون واجهة المستخدم الأصلية تلك هي المسار الأساسي؛ ويجب ألا يضمّن الوكيل أمر `/approve` يدويًا إلا إذا كانت نتيجة الأداة تشير إلى أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.
    - استخدم `approvals.exec` فقط عندما يجب أيضًا تمرير المطالبات إلى دردشات أخرى أو غرف عمليات صريحة.
    - استخدم `channels.<channel>.execApprovals.target: "channel"` أو `"both"` فقط عندما تريد صراحةً نشر مطالبات الموافقة مرة أخرى في الغرفة/الموضوع الأصلي.
    - موافقات Plugin منفصلة مرة أخرى: فهي تستخدم `/approve` في الدردشة نفسها افتراضيًا، مع تمرير اختياري عبر `approvals.plugin`، وفقط بعض القنوات الأصلية تُبقي معالجة الموافقة الأصلية الخاصة بـ plugin فوق ذلك.

    النسخة المختصرة: التمرير مخصص للتوجيه، وتكوين العميل الأصلي مخصص لتجربة استخدام أغنى خاصة بالقناة.
    راجع [موافقات Exec](/ar/tools/exec-approvals).

  </Accordion>

  <Accordion title="ما بيئة التشغيل التي أحتاجها؟">
    Node **>= 22** مطلوب. يُوصى باستخدام `pnpm`. لا يُوصى باستخدام Bun مع Gateway.
  </Accordion>

  <Accordion title="هل يعمل على Raspberry Pi؟">
    نعم. Gateway خفيف - تشير الوثائق إلى أن **512MB-1GB من الذاكرة RAM** و**نواة واحدة** ونحو **500MB**
    من المساحة التخزينية تكفي للاستخدام الشخصي، كما تشير إلى أن **Raspberry Pi 4 يمكنه تشغيله**.

    إذا كنت تريد هامشًا إضافيًا (للسجلات والوسائط والخدمات الأخرى)، فإن **2GB موصى بها**، لكنها
    ليست حدًا أدنى صارمًا.

    نصيحة: يمكن لجهاز Pi/VPS صغير استضافة Gateway، ويمكنك إقران **nodes** على حاسوبك المحمول/هاتفك من أجل
    الشاشة/الكاميرا/اللوحة المحلية أو تنفيذ الأوامر. راجع [Nodes](/ar/nodes).

  </Accordion>

  <Accordion title="هل توجد نصائح لتثبيت Raspberry Pi؟">
    باختصار: نعم، يعمل، لكن توقّع بعض الزوايا الخشنة.

    - استخدم نظام تشغيل **64-bit** واحتفظ بإصدار Node >= 22.
    - فضّل تثبيت **hackable (git)** حتى تتمكن من رؤية السجلات والتحديث بسرعة.
    - ابدأ من دون قنوات/Skills، ثم أضفها واحدة تلو الأخرى.
    - إذا واجهت مشكلات غريبة في الملفات الثنائية، فعادةً ما تكون مشكلة **توافق ARM**.

    الوثائق: [Linux](/ar/platforms/linux)، [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="إنه عالق عند wake up my friend / الإعداد الأولي لا يكتمل. ماذا الآن؟">
    تعتمد تلك الشاشة على إمكانية الوصول إلى Gateway ومصادقته. كما أن TUI يرسل أيضًا
    "Wake up, my friend!" تلقائيًا عند أول اكتمال للإعداد. إذا رأيت هذا السطر **من دون رد**
    وظلت الرموز المميزة عند 0، فهذا يعني أن الوكيل لم يعمل أبدًا.

    1. أعد تشغيل Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. افحص الحالة + المصادقة:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. إذا ظل عالقًا، فشغّل:

    ```bash
    openclaw doctor
    ```

    إذا كان Gateway بعيدًا، فتأكد من أن اتصال النفق/Tailscale قائم وأن واجهة المستخدم
    موجهة إلى Gateway الصحيح. راجع [الوصول عن بُعد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="هل يمكنني ترحيل إعدادي إلى جهاز جديد (Mac mini) من دون إعادة تنفيذ الإعداد الأولي؟">
    نعم. انسخ **دليل الحالة** و**مساحة العمل**، ثم شغّل Doctor مرة واحدة. يحافظ هذا
    على الروبوت الخاص بك "كما هو تمامًا" (الذاكرة، وسجل الجلسات، والمصادقة، وحالة
    القناة) طالما أنك تنسخ **كلا** الموقعين:

    1. ثبّت OpenClaw على الجهاز الجديد.
    2. انسخ `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`) من الجهاز القديم.
    3. انسخ مساحة العمل الخاصة بك (الافتراضي: `~/.openclaw/workspace`).
    4. شغّل `openclaw doctor` وأعد تشغيل خدمة Gateway.

    يحافظ ذلك على التكوين، وملفات تعريف المصادقة، وبيانات اعتماد WhatsApp، والجلسات، والذاكرة. إذا كنت في
    الوضع البعيد، فتذكّر أن مضيف Gateway هو من يملك مخزن الجلسات ومساحة العمل.

    **مهم:** إذا كنت تلتزم/تدفع مساحة العمل الخاصة بك فقط إلى GitHub، فأنت تنشئ نسخة
    احتياطية من **الذاكرة + ملفات التمهيد**، ولكن **ليس** من سجل الجلسات أو المصادقة. هذه العناصر
    موجودة ضمن `~/.openclaw/` (على سبيل المثال `~/.openclaw/agents/<agentId>/sessions/`).

    ذو صلة: [الترحيل](/ar/install/migrating)، [أين توجد الأشياء على القرص](#where-things-live-on-disk)،
    [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [Doctor](/ar/gateway/doctor)،
    [الوضع البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين يمكنني معرفة الجديد في أحدث إصدار؟">
    تحقق من سجل التغييرات على GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    أحدث الإدخالات تكون في الأعلى. إذا كان القسم العلوي مميزًا بأنه **Unreleased**، فالقسم التالي المؤرخ
    هو أحدث إصدار تم شحنه. تُجمَّع الإدخالات ضمن **Highlights** و**Changes** و
    **Fixes** (بالإضافة إلى أقسام الوثائق/الأقسام الأخرى عند الحاجة).

  </Accordion>

  <Accordion title="يتعذر الوصول إلى docs.openclaw.ai (خطأ SSL)">
    تقوم بعض اتصالات Comcast/Xfinity بحظر `docs.openclaw.ai` بشكل غير صحيح عبر Xfinity
    Advanced Security. عطّلها أو أضف `docs.openclaw.ai` إلى قائمة السماح، ثم أعد المحاولة.
    يُرجى مساعدتنا في رفع الحظر عنه عبر الإبلاغ هنا: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    إذا كنت لا تزال غير قادر على الوصول إلى الموقع، فالوثائق معكوسة على GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="الفرق بين stable وbeta">
    إن **Stable** و**beta** هما **npm dist-tags**، وليسا سطرين منفصلين من الشيفرة:

    - `latest` = stable
    - `beta` = إصدار مبكر للاختبار

    عادةً، يصل الإصدار المستقر إلى **beta** أولًا، ثم تنقل خطوة
    ترقية صريحة الإصدار نفسه إلى `latest`. ويمكن للمشرفين أيضًا
    النشر مباشرة إلى `latest` عند الحاجة. لهذا السبب يمكن أن يشير beta وstable
    إلى **الإصدار نفسه** بعد الترقية.

    لمعرفة ما الذي تغيّر:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    للاطلاع على أوامر التثبيت المختصرة والفرق بين beta وdev، راجع الأكورديون أدناه.

  </Accordion>

  <Accordion title="كيف أُثبت الإصدار beta وما الفرق بين beta وdev؟">
    **Beta** هو npm dist-tag `beta` (وقد يطابق `latest` بعد الترقية).
    **Dev** هو الرأس المتحرك للفرع `main` (git)؛ وعند نشره يستخدم npm dist-tag `dev`.

    أوامر مختصرة (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مُثبّت Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    مزيد من التفاصيل: [قنوات التطوير](/ar/install/development-channels) و[علامات المُثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أجرّب أحدث الأجزاء؟">
    خياران:

    1. **قناة Dev (نسخة git محلية):**

    ```bash
    openclaw update --channel dev
    ```

    هذا يبدّل إلى الفرع `main` ويحدّث من المصدر.

    2. **تثبيت Hackable (من موقع المُثبّت):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يمنحك ذلك مستودعًا محليًا يمكنك تعديله، ثم تحديثه عبر git.

    إذا كنت تفضل نسخة محلية نظيفة يدويًا، فاستخدم:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    الوثائق: [التحديث](/cli/update)، [قنوات التطوير](/ar/install/development-channels)،
    [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="كم يستغرق التثبيت والإعداد الأولي عادةً؟">
    دليل تقريبي:

    - **التثبيت:** من 2 إلى 5 دقائق
    - **الإعداد الأولي:** من 5 إلى 15 دقيقة بحسب عدد القنوات/النماذج التي تكوّنها

    إذا بدا أنه عالق، فاستخدم [المُثبّت عالق؟](#quick-start-and-first-run-setup)
    وحلقة التصحيح السريعة في [أنا عالق](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="المُثبّت عالق؟ كيف أحصل على مزيد من التفاصيل؟">
    أعد تشغيل المُثبّت مع **مخرجات تفصيلية**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    تثبيت Beta مع مخرجات تفصيلية:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    لتثبيت hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    المكافئ في Windows (PowerShell):

    ```powershell
    # لا يحتوي install.ps1 على علامة -Verbose مخصصة حتى الآن.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    مزيد من الخيارات: [علامات المُثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="يقول تثبيت Windows إن git غير موجود أو إن openclaw غير معروف">
    هناك مشكلتان شائعتان في Windows:

    **1) خطأ npm spawn git / git غير موجود**

    - ثبّت **Git for Windows** وتأكد من أن `git` موجود في PATH.
    - أغلق PowerShell وأعد فتحه، ثم أعد تشغيل المُثبّت.

    **2) openclaw غير معروف بعد التثبيت**

    - مجلد npm global bin غير موجود في PATH.
    - تحقق من المسار:

      ```powershell
      npm config get prefix
      ```

    - أضف ذلك الدليل إلى PATH الخاص بالمستخدم (لا حاجة إلى اللاحقة `\bin` في Windows؛ ففي معظم الأنظمة يكون `%AppData%\npm`).
    - أغلق PowerShell وأعد فتحه بعد تحديث PATH.

    إذا كنت تريد أكثر إعداد سلاسة على Windows، فاستخدم **WSL2** بدلًا من Windows الأصلي.
    الوثائق: [Windows](/ar/platforms/windows).

  </Accordion>

  <Accordion title="يعرض خرج exec في Windows نصًا صينيًا مشوهًا - ماذا يجب أن أفعل؟">
    يكون السبب عادةً عدم تطابق صفحة ترميز وحدة التحكم في بيئات Windows الأصلية.

    الأعراض:

    - يُعرض خرج `system.run`/`exec` للنص الصيني على شكل محارف مشوهة
    - يبدو الأمر نفسه صحيحًا في ملف تعريف طرفية آخر

    حل بديل سريع في PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    ثم أعد تشغيل Gateway وأعد محاولة تنفيذ الأمر:

    ```powershell
    openclaw gateway restart
    ```

    إذا كنت لا تزال قادرًا على إعادة ظهور هذه المشكلة في أحدث OpenClaw، فتابعها/أبلِغ عنها في:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="لم تُجب الوثائق عن سؤالي - كيف أحصل على إجابة أفضل؟">
    استخدم **تثبيت hackable (git)** حتى تكون لديك الشيفرة المصدرية الكاملة والوثائق محليًا، ثم اسأل
    الروبوت الخاص بك (أو Claude/Codex) _من ذلك المجلد_ حتى يتمكن من قراءة المستودع والإجابة بدقة.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مزيد من التفاصيل: [التثبيت](/ar/install) و[علامات المُثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أُثبت OpenClaw على Linux؟">
    الإجابة المختصرة: اتبع دليل Linux، ثم شغّل الإعداد الأولي.

    - المسار السريع لـ Linux + تثبيت الخدمة: [Linux](/ar/platforms/linux).
    - الشرح الكامل: [البدء](/ar/start/getting-started).
    - المُثبّت + التحديثات: [التثبيت والتحديثات](/ar/install/updating).

  </Accordion>

  <Accordion title="كيف أُثبت OpenClaw على VPS؟">
    يعمل أي VPS بنظام Linux. ثبّت على الخادم، ثم استخدم SSH/Tailscale للوصول إلى Gateway.

    الأدلة: [exe.dev](/ar/install/exe-dev)، [Hetzner](/ar/install/hetzner)، [Fly.io](/ar/install/fly).
    الوصول عن بُعد: [Gateway البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين توجد أدلة التثبيت على السحابة/VPS؟">
    نحتفظ **بمركز استضافة** يضم المزوّدين الشائعين. اختر أحدهم واتبع الدليل:

    - [استضافة VPS](/ar/vps) (جميع المزوّدين في مكان واحد)
    - [Fly.io](/ar/install/fly)
    - [Hetzner](/ar/install/hetzner)
    - [exe.dev](/ar/install/exe-dev)

    كيفية عمله في السحابة: يتم تشغيل **Gateway على الخادم**، وتصل إليه
    من حاسوبك المحمول/هاتفك عبر Control UI (أو Tailscale/SSH). وتوجد حالتك + مساحة عملك
    على الخادم، لذا تعامل مع المضيف على أنه مصدر الحقيقة وخذ له نسخًا احتياطية.

    يمكنك إقران **nodes** (Mac/iOS/Android/headless) مع Gateway السحابي هذا للوصول إلى
    الشاشة/الكاميرا/اللوحة المحلية أو تشغيل الأوامر على حاسوبك المحمول مع الإبقاء على
    Gateway في السحابة.

    المركز: [المنصات](/ar/platforms). الوصول عن بُعد: [Gateway البعيد](/ar/gateway/remote).
    Nodes: [Nodes](/ar/nodes)، [CLI لـ Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني أن أطلب من OpenClaw أن يحدّث نفسه؟">
    الإجابة المختصرة: **ممكن، لكنه غير موصى به**. يمكن لتدفق التحديث أن يعيد تشغيل
    Gateway (ما يؤدي إلى إسقاط الجلسة النشطة)، وقد يحتاج إلى نسخة git محلية نظيفة،
    وقد يطلب تأكيدًا. والأكثر أمانًا: تشغيل التحديثات من صدفة الأوامر بصفتك المشغّل.

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

    الوثائق: [التحديث](/cli/update)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="ماذا يفعل الإعداد الأولي فعليًا؟">
    `openclaw onboard` هو مسار الإعداد الموصى به. في **الوضع المحلي**، يوجّهك خلال:

    - **إعداد النموذج/المصادقة** (OAuth للمزوّد، مفاتيح API، Anthropic setup-token، بالإضافة إلى خيارات النماذج المحلية مثل LM Studio)
    - موقع **مساحة العمل** + ملفات التمهيد
    - **إعدادات Gateway** (الربط/المنفذ/المصادقة/tailscale)
    - **القنوات** (WhatsApp وTelegram وDiscord وMattermost وSignal وiMessage، بالإضافة إلى Plugins القنوات المضمّنة مثل QQ Bot)
    - **تثبيت العملية الخدمية** (LaunchAgent على macOS؛ ووحدة مستخدم systemd على Linux/WSL2)
    - **فحوصات الصحة** واختيار **Skills**

    كما أنه يحذّر أيضًا إذا كان النموذج الذي قمت بتكوينه غير معروف أو يفتقد المصادقة.

  </Accordion>

  <Accordion title="هل أحتاج إلى اشتراك Claude أو OpenAI لتشغيل هذا؟">
    لا. يمكنك تشغيل OpenClaw باستخدام **مفاتيح API** (Anthropic/OpenAI/وغيرها) أو باستخدام
    **نماذج محلية فقط** بحيث تبقى بياناتك على جهازك. الاشتراكات (Claude
    Pro/Max أو OpenAI Codex) هي وسائل اختيارية لمصادقة هؤلاء المزوّدين.

    بالنسبة إلى Anthropic في OpenClaw، فالتقسيم العملي هو:

    - **مفتاح Anthropic API**: فوترة Anthropic API العادية
    - **مصادقة Claude CLI / اشتراك Claude داخل OpenClaw**: أخبرنا موظفو Anthropic
      أن هذا الاستخدام مسموح به مرة أخرى، ويتعامل OpenClaw مع استخدام `claude -p`
      على أنه معتمد لهذا التكامل ما لم تنشر Anthropic
      سياسة جديدة

    بالنسبة إلى مضيفي Gateway طويلة العمر، تبقى مفاتيح Anthropic API الإعداد
    الأكثر قابلية للتنبؤ. كما أن OpenAI Codex OAuth مدعوم صراحةً للأدوات
    الخارجية مثل OpenClaw.

    يدعم OpenClaw أيضًا خيارات أخرى مستضافة على نمط الاشتراك بما في ذلك
    **Qwen Cloud Coding Plan** و**MiniMax Coding Plan** و
    **Z.AI / GLM Coding Plan**.

    الوثائق: [Anthropic](/ar/providers/anthropic)، [OpenAI](/ar/providers/openai)،
    [Qwen Cloud](/ar/providers/qwen)،
    [MiniMax](/ar/providers/minimax)، [GLM Models](/ar/providers/glm)،
    [النماذج المحلية](/ar/gateway/local-models)، [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام اشتراك Claude Max من دون مفتاح API؟">
    نعم.

    أخبرنا موظفو Anthropic أن استخدام Claude CLI على نمط OpenClaw مسموح به مرة أخرى، لذلك
    يتعامل OpenClaw مع مصادقة اشتراك Claude واستخدام `claude -p` على أنهما معتمدان
    لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. وإذا كنت تريد
    الإعداد الأكثر قابلية للتنبؤ على جانب الخادم، فاستخدم مفتاح Anthropic API بدلًا من ذلك.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك Claude (Claude Pro أو Max)؟">
    نعم.

    أخبرنا موظفو Anthropic أن هذا الاستخدام مسموح به مرة أخرى، لذلك يتعامل OpenClaw
    مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل
    ما لم تنشر Anthropic سياسة جديدة.

    ما يزال Anthropic setup-token متاحًا كمسار رمز مميز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
    أما لأحمال العمل الإنتاجية أو متعددة المستخدمين، فتبقى
    مصادقة مفتاح Anthropic API الخيار الأكثر أمانًا وقابلية للتنبؤ. وإذا كنت تريد خيارات أخرى مستضافة
    على نمط الاشتراك في OpenClaw، فراجع [OpenAI](/ar/providers/openai)، و[Qwen / Model
    Cloud](/ar/providers/qwen)، و[MiniMax](/ar/providers/minimax)، و[GLM
    Models](/ar/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="لماذا أرى HTTP 429 rate_limit_error من Anthropic؟">
هذا يعني أن **حصة Anthropic / حد المعدل** لديك قد استُنفِد خلال النافذة الحالية. إذا كنت
تستخدم **Claude CLI**، فانتظر حتى تُعاد تهيئة النافذة أو قم بترقية خطتك. وإذا كنت
تستخدم **مفتاح Anthropic API**، فتحقق من Anthropic Console
لمعرفة الاستخدام/الفوترة وارفع الحدود عند الحاجة.

    إذا كانت الرسالة تحديدًا:
    `Extra usage is required for long context requests`، فهذا يعني أن الطلب يحاول استخدام
    النسخة التجريبية من سياق Anthropic ذي 1M (`context1m: true`). ولا يعمل ذلك إلا عندما تكون
    بيانات اعتمادك مؤهلة لفوترة السياق الطويل (فوترة مفتاح API أو
    مسار Claude-login في OpenClaw مع تمكين Extra Usage).

    نصيحة: اضبط **نموذجًا احتياطيًا** حتى يتمكن OpenClaw من مواصلة الرد بينما يكون أحد المزوّدين مقيّدًا بالمعدل.
    راجع [النماذج](/cli/models)، و[OAuth](/ar/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ar/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="هل AWS Bedrock مدعوم؟">
    نعم. يحتوي OpenClaw على مزوّد **Amazon Bedrock (Converse)** مضمّن. عند وجود مؤشرات بيئة AWS، يمكن لـ OpenClaw اكتشاف كتالوج Bedrock للبث/النص تلقائيًا ودمجه كمزوّد ضمني باسم `amazon-bedrock`؛ وإلا فيمكنك تمكين `plugins.entries.amazon-bedrock.config.discovery.enabled` صراحةً أو إضافة إدخال مزوّد يدوي. راجع [Amazon Bedrock](/ar/providers/bedrock) و[مزودو النماذج](/ar/providers/models). وإذا كنت تفضّل تدفقًا مُدارًا للمفاتيح، فما يزال الوكيل المتوافق مع OpenAI أمام Bedrock خيارًا صالحًا.
  </Accordion>

  <Accordion title="كيف تعمل مصادقة Codex؟">
    يدعم OpenClaw **OpenAI Code (Codex)** عبر OAuth (تسجيل الدخول إلى ChatGPT). يمكن للإعداد الأولي تشغيل تدفق OAuth وسيضبط النموذج الافتراضي إلى `openai-codex/gpt-5.4` عند الاقتضاء. راجع [مزودو النماذج](/ar/concepts/model-providers) و[الإعداد الأولي (CLI)](/ar/start/wizard).
  </Accordion>

  <Accordion title="لماذا لا يؤدي ChatGPT GPT-5.4 إلى فتح openai/gpt-5.4 في OpenClaw؟">
    يتعامل OpenClaw مع المسارين على نحو منفصل:

    - `openai-codex/gpt-5.4` = OAuth الخاص بـ ChatGPT/Codex
    - `openai/gpt-5.4` = OpenAI Platform API المباشر

    في OpenClaw، يتم توصيل تسجيل الدخول إلى ChatGPT/Codex بالمسار `openai-codex/*`،
    وليس بمسار `openai/*` المباشر. إذا كنت تريد مسار API المباشر في
    OpenClaw، فاضبط `OPENAI_API_KEY` (أو تكوين مزود OpenAI المكافئ).
    وإذا كنت تريد تسجيل الدخول إلى ChatGPT/Codex في OpenClaw، فاستخدم `openai-codex/*`.

  </Accordion>

  <Accordion title="لماذا قد تختلف حدود Codex OAuth عن ChatGPT على الويب؟">
    يستخدم `openai-codex/*` مسار Codex OAuth، وتدير OpenAI نوافذ الحصة القابلة للاستخدام فيه
    وتعتمد على الخطة. وعمليًا، قد تختلف تلك الحدود عن
    تجربة موقع/تطبيق ChatGPT، حتى عندما يكون كلاهما مرتبطًا بالحساب نفسه.

    يمكن لـ OpenClaw عرض نوافذ الاستخدام/الحصة المرئية حاليًا للمزوّد في
    `openclaw models status`، لكنه لا يخترع ولا يطبّع استحقاقات ChatGPT على الويب
    إلى وصول مباشر لـ API. وإذا كنت تريد مسار الفوترة/الحدود المباشر في OpenAI Platform،
    فاستخدم `openai/*` مع مفتاح API.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك OpenAI (Codex OAuth)؟">
    نعم. يدعم OpenClaw بالكامل **OAuth لاشتراك OpenAI Code (Codex)**.
    تسمح OpenAI صراحةً باستخدام اشتراك OAuth في الأدوات/سير العمل الخارجية
    مثل OpenClaw. ويمكن للإعداد الأولي تشغيل تدفق OAuth نيابةً عنك.

    راجع [OAuth](/ar/concepts/oauth)، و[مزودو النماذج](/ar/concepts/model-providers)، و[الإعداد الأولي (CLI)](/ar/start/wizard).

  </Accordion>

  <Accordion title="كيف أُعِد Gemini CLI OAuth؟">
    يستخدم Gemini CLI **تدفق مصادقة Plugin**، وليس client id أو secret داخل `openclaw.json`.

    الخطوات:

    1. ثبّت Gemini CLI محليًا بحيث يكون `gemini` موجودًا في `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. فعّل Plugin: `openclaw plugins enable google`
    3. سجّل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. النموذج الافتراضي بعد تسجيل الدخول: `google-gemini-cli/gemini-3-flash-preview`
    5. إذا فشلت الطلبات، فاضبط `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway

    يخزّن هذا رموز OAuth المميزة في ملفات تعريف المصادقة على مضيف Gateway. التفاصيل: [مزودو النماذج](/ar/concepts/model-providers).

  </Accordion>

  <Accordion title="هل النموذج المحلي مناسب للدردشات العادية؟">
    عادةً لا. يحتاج OpenClaw إلى سياق كبير + أمان قوي؛ فالبطاقات الصغيرة تقطع المحتوى وتسرّب. وإذا كان لا بد، فشغّل **أكبر** بنية نموذج يمكنك تشغيلها محليًا (LM Studio) وراجع [/gateway/local-models](/ar/gateway/local-models). النماذج الأصغر/المكمّمة تزيد من خطر حقن المطالبات - راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="كيف أحافظ على حركة مرور النماذج المستضافة ضمن منطقة محددة؟">
    اختر نقاط نهاية مثبتة على منطقة معينة. يوفّر OpenRouter خيارات مستضافة في الولايات المتحدة لـ MiniMax وKimi وGLM؛ اختر النسخة المستضافة في الولايات المتحدة للحفاظ على البيانات داخل المنطقة. ولا يزال بإمكانك إدراج Anthropic/OpenAI إلى جانب هذه الخيارات باستخدام `models.mode: "merge"` بحيث تبقى النماذج الاحتياطية متاحة مع احترام المزوّد المقيّد بالمنطقة الذي اخترته.
  </Accordion>

  <Accordion title="هل يجب أن أشتري Mac Mini لتثبيت هذا؟">
    لا. يعمل OpenClaw على macOS أو Linux (وWindows عبر WSL2). جهاز Mac mini اختياري - فبعض الأشخاص
    يشترونه كمضيف يعمل دائمًا، لكن VPS صغيرًا أو خادمًا منزليًا أو جهازًا من فئة Raspberry Pi يعمل أيضًا.

    أنت تحتاج إلى Mac فقط **للأدوات الحصرية لـ macOS**. وبالنسبة إلى iMessage، استخدم [BlueBubbles](/ar/channels/bluebubbles) (موصى به) - يعمل خادم BlueBubbles على أي Mac، بينما يمكن أن يعمل Gateway على Linux أو في مكان آخر. وإذا كنت تريد أدوات أخرى حصرية لـ macOS، فشغّل Gateway على Mac أو اقترن مع Node لنظام macOS.

    الوثائق: [BlueBubbles](/ar/channels/bluebubbles)، [Nodes](/ar/nodes)، [الوضع البعيد على Mac](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل أحتاج إلى Mac mini لدعم iMessage؟">
    تحتاج إلى **أي جهاز macOS** مسجّل الدخول إلى Messages. ولا **يلزم** أن يكون Mac mini -
    فأي Mac يعمل. **استخدم [BlueBubbles](/ar/channels/bluebubbles)** (موصى به) مع iMessage - يعمل خادم BlueBubbles على macOS، بينما يمكن أن يعمل Gateway على Linux أو في مكان آخر.

    إعدادات شائعة:

    - شغّل Gateway على Linux/VPS، وشغّل خادم BlueBubbles على أي Mac مسجّل الدخول إلى Messages.
    - شغّل كل شيء على جهاز Mac إذا كنت تريد أبسط إعداد على جهاز واحد.

    الوثائق: [BlueBubbles](/ar/channels/bluebubbles)، [Nodes](/ar/nodes)،
    [الوضع البعيد على Mac](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="إذا اشتريت Mac mini لتشغيل OpenClaw، فهل يمكنني ربطه بـ MacBook Pro الخاص بي؟">
    نعم. يمكن لـ **Mac mini تشغيل Gateway**، ويمكن لـ MacBook Pro الاتصال به بوصفه
    **Node** (جهازًا مرافقًا). لا تقوم Nodes بتشغيل Gateway - بل توفّر
    إمكانات إضافية مثل الشاشة/الكاميرا/اللوحة و`system.run` على ذلك الجهاز.

    نمط شائع:

    - Gateway على جهاز Mac mini (يعمل دائمًا).
    - يشغّل MacBook Pro تطبيق macOS أو مضيف Node ويقترن مع Gateway.
    - استخدم `openclaw nodes status` / `openclaw nodes list` لرؤيته.

    الوثائق: [Nodes](/ar/nodes)، [CLI لـ Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني استخدام Bun؟">
    لا يُوصى باستخدام Bun. نرى أخطاء وقت تشغيل، خاصةً مع WhatsApp وTelegram.
    استخدم **Node** من أجل Gateways مستقرة.

    إذا كنت لا تزال ترغب في التجربة مع Bun، فافعل ذلك على Gateway غير إنتاجية
    ومن دون WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: ما الذي يوضع في allowFrom؟">
    `channels.telegram.allowFrom` هو **معرّف مستخدم Telegram البشري** (رقمي). وليس اسم مستخدم البوت.

    يقبل الإعداد الأولي إدخال `@username` ويحوّله إلى معرّف رقمي، لكن تفويض OpenClaw يستخدم المعرفات الرقمية فقط.

    الطريقة الأكثر أمانًا (من دون بوت تابع لجهة خارجية):

    - أرسل رسالة خاصة إلى البوت، ثم شغّل `openclaw logs --follow` واقرأ `from.id`.

    Bot API الرسمي:

    - أرسل رسالة خاصة إلى البوت، ثم استدعِ `https://api.telegram.org/bot<bot_token>/getUpdates` واقرأ `message.from.id`.

    جهة خارجية (خصوصية أقل):

    - أرسل رسالة خاصة إلى `@userinfobot` أو `@getidsbot`.

    راجع [/channels/telegram](/ar/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="هل يمكن لعدة أشخاص استخدام رقم WhatsApp واحد مع نُسخ OpenClaw مختلفة؟">
    نعم، عبر **التوجيه متعدد الوكلاء**. اربط **الرسائل الخاصة** في WhatsApp لكل مرسل (النظير `kind: "direct"`، والمرسل E.164 مثل `+15551234567`) بـ `agentId` مختلف، بحيث يحصل كل شخص على مساحة العمل الخاصة به ومخزن الجلسات الخاص به. وتظل الردود صادرة من **حساب WhatsApp نفسه**، كما يبقى التحكم في الوصول إلى الرسائل الخاصة (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) عامًا على مستوى حساب WhatsApp كله. راجع [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent) و[WhatsApp](/ar/channels/whatsapp).
  </Accordion>

  <Accordion title='هل يمكنني تشغيل وكيل "دردشة سريعة" ووكيل "Opus للبرمجة"؟'>
    نعم. استخدم التوجيه متعدد الوكلاء: امنح كل وكيل نموذجه الافتراضي الخاص، ثم اربط المسارات الواردة (حساب المزوّد أو نظراء محددون) بكل وكيل. يوجد مثال للتكوين في [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent). راجع أيضًا [النماذج](/ar/concepts/models) و[التكوين](/ar/gateway/configuration).
  </Accordion>

  <Accordion title="هل يعمل Homebrew على Linux؟">
    نعم. يدعم Homebrew نظام Linux (Linuxbrew). إعداد سريع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    إذا كنت تشغّل OpenClaw عبر systemd، فتأكد من أن PATH الخاص بالخدمة يتضمن `/home/linuxbrew/.linuxbrew/bin` (أو بادئة brew الخاصة بك) حتى تُحل الأدوات المثبتة عبر `brew` في الصدف غير التفاعلية.
    كما تُضيف الإصدارات الحديثة أيضًا أدلة صناديق المستخدم الشائعة مسبقًا في خدمات Linux systemd (على سبيل المثال `~/.local/bin` و`~/.npm-global/bin` و`~/.local/share/pnpm` و`~/.bun/bin`) وتحترم `PNPM_HOME` و`NPM_CONFIG_PREFIX` و`BUN_INSTALL` و`VOLTA_HOME` و`ASDF_DATA_DIR` و`NVM_DIR` و`FNM_DIR` عند ضبطها.

  </Accordion>

  <Accordion title="ما الفرق بين تثبيت git القابل للتعديل وتثبيت npm؟">
    - **تثبيت git القابل للتعديل:** نسخة مصدرية كاملة، قابلة للتعديل، وهي الأفضل للمساهمين.
      تقوم بتشغيل عمليات البناء محليًا ويمكنك تعديل الشيفرة/الوثائق.
    - **تثبيت npm:** تثبيت CLI عام، من دون مستودع، وهو الأفضل لمن يريد "تشغيله فقط".
      تأتي التحديثات من npm dist-tags.

    الوثائق: [البدء](/ar/start/getting-started)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="هل يمكنني التبديل بين تثبيتات npm وgit لاحقًا؟">
    نعم. ثبّت النمط الآخر، ثم شغّل Doctor حتى تشير خدمة Gateway إلى نقطة الدخول الجديدة.
    هذا **لا يحذف بياناتك** - بل يغيّر فقط تثبيت شيفرة OpenClaw. وتبقى حالتك
    (`~/.openclaw`) ومساحة عملك (`~/.openclaw/workspace`) من دون تغيير.

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

    يكتشف Doctor عدم تطابق نقطة دخول خدمة Gateway ويعرض إعادة كتابة تكوين الخدمة ليتطابق مع التثبيت الحالي (استخدم `--repair` في الأتمتة).

    نصائح النسخ الاحتياطي: راجع [استراتيجية النسخ الاحتياطي](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="هل ينبغي أن أشغّل Gateway على حاسوبي المحمول أم على VPS؟">
    الإجابة المختصرة: **إذا كنت تريد موثوقية على مدار الساعة طوال أيام الأسبوع، فاستخدم VPS**. وإذا كنت تريد
    أقل قدر من الاحتكاك وكنت موافقًا على السكون/إعادة التشغيل، فشغّله محليًا.

    **الحاسوب المحمول (Gateway محلية)**

    - **الإيجابيات:** لا توجد تكلفة خادم، وصول مباشر إلى الملفات المحلية، نافذة متصفح مرئية.
    - **السلبيات:** السكون/انقطاع الشبكة = انقطاعات اتصال، تحديثات/إعادات تشغيل نظام التشغيل تسبب انقطاعًا، ويجب أن يبقى الجهاز مستيقظًا.

    **VPS / السحابة**

    - **الإيجابيات:** يعمل دائمًا، شبكة مستقرة، لا توجد مشكلات سكون الحاسوب المحمول، أسهل في الإبقاء عليه قيد التشغيل.
    - **السلبيات:** غالبًا يعمل من دون واجهة (استخدم لقطات الشاشة)، وصول إلى الملفات عن بُعد فقط، ويجب عليك استخدام SSH للتحديثات.

    **ملاحظة خاصة بـ OpenClaw:** تعمل WhatsApp وTelegram وSlack وMattermost وDiscord جميعها بشكل جيد من VPS. والمفاضلة الحقيقية الوحيدة هي **متصفح headless** مقابل نافذة مرئية. راجع [المتصفح](/ar/tools/browser).

    **الخيار الافتراضي الموصى به:** VPS إذا كنت قد واجهت سابقًا انقطاعات في Gateway. أما التشغيل المحلي فهو ممتاز عندما تكون تستخدم جهاز Mac بنشاط وتريد الوصول إلى الملفات المحلية أو أتمتة واجهة المستخدم مع متصفح مرئي.

  </Accordion>

  <Accordion title="ما مدى أهمية تشغيل OpenClaw على جهاز مخصص؟">
    ليس مطلوبًا، لكنه **موصى به من أجل الموثوقية والعزل**.

    - **مضيف مخصص (VPS/Mac mini/Pi):** يعمل دائمًا، انقطاعات أقل بسبب السكون/إعادة التشغيل، أذونات أنظف، وأسهل في الإبقاء عليه قيد التشغيل.
    - **حاسوب محمول/مكتبي مشترك:** مناسب تمامًا للاختبار والاستخدام النشط، لكن توقّع توقفات عندما يدخل الجهاز في السكون أو يتلقى تحديثات.

    إذا كنت تريد أفضل ما في العالمين، فأبقِ Gateway على مضيف مخصص واقرن حاسوبك المحمول بوصفه **Node** من أجل أدوات الشاشة/الكاميرا/exec المحلية. راجع [Nodes](/ar/nodes).
    وللاطلاع على إرشادات الأمان، اقرأ [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما الحد الأدنى لمتطلبات VPS ونظام التشغيل الموصى به؟">
    OpenClaw خفيف. بالنسبة إلى Gateway أساسية + قناة دردشة واحدة:

    - **الحد الأدنى المطلق:** 1 vCPU، و1GB RAM، ونحو 500MB من مساحة القرص.
    - **الموصى به:** 1-2 vCPU، و2GB RAM أو أكثر كهامش احتياطي (للسجلات، والوسائط، والقنوات المتعددة). يمكن أن تكون أدوات Node وأتمتة المتصفح شرهة للموارد.

    نظام التشغيل: استخدم **Ubuntu LTS** (أو أي Debian/Ubuntu حديث). وقد جرى اختبار مسار التثبيت على Linux بشكل أفضل هناك.

    الوثائق: [Linux](/ar/platforms/linux)، [استضافة VPS](/ar/vps).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل OpenClaw داخل آلة افتراضية وما المتطلبات؟">
    نعم. تعامل مع الآلة الافتراضية كما تتعامل مع VPS: يجب أن تكون تعمل دائمًا، وقابلة للوصول، وأن تمتلك
    ذاكرة RAM كافية لـ Gateway وأي قنوات تقوم بتمكينها.

    إرشادات أساسية:

    - **الحد الأدنى المطلق:** 1 vCPU و1GB RAM.
    - **الموصى به:** 2GB RAM أو أكثر إذا كنت تشغّل قنوات متعددة، أو أتمتة متصفح، أو أدوات وسائط.
    - **نظام التشغيل:** Ubuntu LTS أو Debian/Ubuntu حديث آخر.

    إذا كنت على Windows، فإن **WSL2 هو أسهل إعداد على نمط الآلات الافتراضية** ويتمتع بأفضل توافق
    مع الأدوات. راجع [Windows](/ar/platforms/windows)، [استضافة VPS](/ar/vps).
    وإذا كنت تشغّل macOS داخل آلة افتراضية، فراجع [آلة macOS الافتراضية](/ar/install/macos-vm).

  </Accordion>
</AccordionGroup>

## ما هو OpenClaw؟

<AccordionGroup>
  <Accordion title="ما هو OpenClaw في فقرة واحدة؟">
    OpenClaw هو مساعد AI شخصي تشغّله على أجهزتك الخاصة. يرد على أسطح المراسلة التي تستخدمها بالفعل (WhatsApp وTelegram وSlack وMattermost وDiscord وGoogle Chat وSignal وiMessage وWebChat وPlugins القنوات المضمّنة مثل QQ Bot) ويمكنه أيضًا تنفيذ الصوت + Canvas حي على المنصات المدعومة. ويمثل **Gateway** طبقة التحكم التي تعمل دائمًا؛ أما المساعد فهو المنتج.
  </Accordion>

  <Accordion title="عرض القيمة">
    OpenClaw ليس "مجرد غلاف لـ Claude". بل هو **طبقة تحكم local-first** تتيح لك تشغيل
    مساعد قادر على **أجهزتك الخاصة**، ويمكن الوصول إليه من تطبيقات الدردشة التي تستخدمها بالفعل، مع
    جلسات ذات حالة، وذاكرة، وأدوات - من دون تسليم التحكم في سير عملك إلى
    SaaS مستضاف.

    أبرز المزايا:

    - **أجهزتك، بياناتك:** شغّل Gateway حيثما تريد (Mac أو Linux أو VPS) واحتفظ
      بمساحة العمل + سجل الجلسات محليًا.
    - **قنوات حقيقية، وليست صندوق رمل ويب:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc،
      بالإضافة إلى الصوت على الهاتف المحمول وCanvas على المنصات المدعومة.
    - **محايد تجاه النماذج:** استخدم Anthropic وOpenAI وMiniMax وOpenRouter وغيرها، مع توجيه
      لكل وكيل والتحويل التلقائي عند الفشل.
    - **خيار محلي فقط:** شغّل نماذج محلية حتى **تبقى كل البيانات على جهازك** إذا أردت.
    - **توجيه متعدد الوكلاء:** افصل الوكلاء حسب القناة أو الحساب أو المهمة، بحيث يكون لكل منهم
      مساحة العمل والإعدادات الافتراضية الخاصة به.
    - **مفتوح المصدر وقابل للتعديل:** افحصه، ووسّعه، واستضفه ذاتيًا من دون ارتهان لمورّد.

    الوثائق: [Gateway](/ar/gateway)، [القنوات](/ar/channels)، [متعدد الوكلاء](/ar/concepts/multi-agent)،
    [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="لقد أعددته للتو - ماذا ينبغي أن أفعل أولًا؟">
    مشاريع أولى جيدة:

    - أنشئ موقعًا إلكترونيًا (WordPress أو Shopify أو موقعًا ثابتًا بسيطًا).
    - أنشئ نموذجًا أوليًا لتطبيق جوال (المخطط، الشاشات، خطة API).
    - نظّم الملفات والمجلدات (التنظيف، التسمية، الوسم).
    - اربط Gmail وأتمت الملخصات أو المتابعات.

    يمكنه التعامل مع مهام كبيرة، لكنه يعمل بأفضل شكل عندما تقسّمها إلى مراحل
    وتستخدم وكلاء فرعيين للعمل المتوازي.

  </Accordion>

  <Accordion title="ما أهم خمس حالات استخدام يومية لـ OpenClaw؟">
    تبدو المكاسب اليومية عادةً على النحو التالي:

    - **إحاطات شخصية:** ملخصات للبريد الوارد، والتقويم، والأخبار التي تهمك.
    - **البحث والصياغة:** بحث سريع، وملخصات، ومسودات أولية للرسائل الإلكترونية أو المستندات.
    - **التذكيرات والمتابعات:** تنبيهات وقوائم تحقق مدفوعة بـ Cron أو Heartbeat.
    - **أتمتة المتصفح:** ملء النماذج، وجمع البيانات، وتكرار مهام الويب.
    - **التنسيق عبر الأجهزة:** أرسل مهمة من هاتفك، ودع Gateway تشغّلها على خادم، ثم استلم النتيجة مرة أخرى في الدردشة.

  </Accordion>

  <Accordion title="هل يمكن لـ OpenClaw المساعدة في توليد العملاء المحتملين، والتواصل، والإعلانات، والمدونات من أجل SaaS؟">
    نعم بالنسبة إلى **البحث، والتأهيل، والصياغة**. يمكنه فحص المواقع، وبناء قوائم مختصرة،
    وتلخيص العملاء المحتملين، وكتابة مسودات للتواصل أو نصوص الإعلانات.

    أما بالنسبة إلى **حملات التواصل أو تشغيل الإعلانات**، فأبقِ إنسانًا ضمن الحلقة. تجنب
    الرسائل غير المرغوب فيها، واتبع القوانين المحلية وسياسات المنصات، وراجع أي شيء قبل إرساله.
    وأكثر الأنماط أمانًا هو أن يدع OpenClaw يصوغ وأنت توافق.

    الوثائق: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما المزايا مقارنةً بـ Claude Code لتطوير الويب؟">
    OpenClaw هو **مساعد شخصي** وطبقة تنسيق، وليس بديلًا عن بيئة التطوير المتكاملة. استخدم
    Claude Code أو Codex لأسرع حلقة برمجة مباشرة داخل مستودع. واستخدم OpenClaw عندما
    تريد ذاكرة دائمة، ووصولًا عبر الأجهزة، وتنسيقًا للأدوات.

    المزايا:

    - **ذاكرة + مساحة عمل دائمة** عبر الجلسات
    - **وصول متعدد المنصات** (WhatsApp وTelegram وTUI وWebChat)
    - **تنسيق الأدوات** (المتصفح، والملفات، والجدولة، وhooks)
    - **Gateway تعمل دائمًا** (شغّلها على VPS وتفاعل معها من أي مكان)
    - **Nodes** للمتصفح/الشاشة/الكاميرا/exec المحلي

    معرض: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills والأتمتة

<AccordionGroup>
  <Accordion title="كيف أخصص Skills من دون إبقاء المستودع في حالة dirty؟">
    استخدم التجاوزات المُدارة بدلًا من تعديل نسخة المستودع. ضع تغييراتك في `~/.openclaw/skills/<name>/SKILL.md` (أو أضف مجلدًا عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json`). ترتيب الأولوية هو `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → المضمّنة → `skills.load.extraDirs`، لذلك تظل التجاوزات المُدارة متقدمة على Skills المضمّنة من دون لمس git. وإذا كنت تحتاج إلى تثبيت Skill على مستوى عام لكن لا تريد أن تكون مرئية إلا لبعض الوكلاء، فاحتفظ بالنسخة المشتركة في `~/.openclaw/skills` وتحكم في الرؤية عبر `agents.defaults.skills` و`agents.list[].skills`. ولا ينبغي أن تعيش التعديلات الجديرة بالرفع upstream إلا في المستودع وأن تخرج على شكل PRs.
  </Accordion>

  <Accordion title="هل يمكنني تحميل Skills من مجلد مخصص؟">
    نعم. أضف أدلة إضافية عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json` (أدنى أولوية). ترتيب الأولوية الافتراضي هو `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → المضمّنة → `skills.load.extraDirs`. يقوم `clawhub` بالتثبيت في `./skills` افتراضيًا، ويتعامل OpenClaw معها على أنها `<workspace>/skills` في الجلسة التالية. وإذا كان ينبغي أن تكون Skill مرئية لبعض الوكلاء فقط، فاقرن ذلك مع `agents.defaults.skills` أو `agents.list[].skills`.
  </Accordion>

  <Accordion title="كيف يمكنني استخدام نماذج مختلفة لمهام مختلفة؟">
    الأنماط المدعومة اليوم هي:

    - **وظائف Cron**: يمكن للوظائف المعزولة ضبط تجاوز `model` لكل وظيفة.
    - **الوكلاء الفرعيون**: وجّه المهام إلى وكلاء منفصلين يملكون نماذج افتراضية مختلفة.
    - **تبديل عند الطلب**: استخدم `/model` لتبديل نموذج الجلسة الحالية في أي وقت.

    راجع [وظائف Cron](/ar/automation/cron-jobs)، [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="يتجمد الروبوت أثناء تنفيذ عمل ثقيل. كيف أنقل ذلك؟">
    استخدم **الوكلاء الفرعيين** للمهام الطويلة أو المتوازية. يعمل الوكلاء الفرعيون في جلستهم الخاصة،
    ويعيدون ملخصًا، ويحافظون على استجابة الدردشة الرئيسية.

    اطلب من الروبوت "spawn a sub-agent for this task" أو استخدم `/subagents`.
    استخدم `/status` في الدردشة لمعرفة ما الذي تفعله Gateway الآن (وما إذا كانت مشغولة).

    نصيحة تتعلق بالرموز: تستهلك المهام الطويلة والوكلاء الفرعيون كليهما الرموز. وإذا كانت التكلفة مصدر قلق، فاضبط
    نموذجًا أرخص للوكلاء الفرعيين عبر `agents.defaults.subagents.model`.

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [المهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="كيف تعمل جلسات الوكلاء الفرعيين المرتبطة بسلاسل المحادثات على Discord؟">
    استخدم ارتباطات السلاسل. يمكنك ربط سلسلة محادثة في Discord بوكيل فرعي أو هدف جلسة بحيث تبقى رسائل المتابعة في تلك السلسلة على الجلسة المرتبطة نفسها.

    التدفق الأساسي:

    - أنشئها عبر `sessions_spawn` باستخدام `thread: true` (واختياريًا `mode: "session"` للمتابعة المستمرة).
    - أو اربطها يدويًا باستخدام `/focus <target>`.
    - استخدم `/agents` لفحص حالة الارتباط.
    - استخدم `/session idle <duration|off>` و`/session max-age <duration|off>` للتحكم في إلغاء التركيز التلقائي.
    - استخدم `/unfocus` لفصل السلسلة.

    التكوين المطلوب:

    - الإعدادات الافتراضية العامة: `session.threadBindings.enabled` و`session.threadBindings.idleHours` و`session.threadBindings.maxAgeHours`.
    - تجاوزات Discord: `channels.discord.threadBindings.enabled` و`channels.discord.threadBindings.idleHours` و`channels.discord.threadBindings.maxAgeHours`.
    - الارتباط التلقائي عند الإنشاء: اضبط `channels.discord.threadBindings.spawnSubagentSessions: true`.

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [Discord](/ar/channels/discord)، [مرجع التكوين](/ar/gateway/configuration-reference)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="انتهى وكيل فرعي، لكن تحديث الإكمال ذهب إلى المكان الخطأ أو لم يُنشر مطلقًا. ما الذي ينبغي أن أتحقق منه؟">
    تحقّق أولًا من مسار الطالب الذي تم حله:

    - يفضّل تسليم الوكيل الفرعي في وضع الإكمال أي سلسلة محادثة أو مسار محادثة مرتبط عندما يكون أحدها موجودًا.
    - إذا كان أصل الإكمال يحمل قناة فقط، يعود OpenClaw إلى المسار المخزن لجلسة الطالب (`lastChannel` / `lastTo` / `lastAccountId`) بحيث يظل التسليم المباشر ممكنًا.
    - إذا لم يوجد لا مسار مرتبط ولا مسار مخزن قابل للاستخدام، فقد يفشل التسليم المباشر وتعود النتيجة بدلًا من ذلك إلى التسليم عبر الجلسة المدرجة في الطابور بدلًا من النشر الفوري في الدردشة.
    - قد تستمر الأهداف غير الصالحة أو القديمة في فرض الرجوع إلى الطابور أو التسبب في فشل التسليم النهائي.
    - إذا كان آخر رد مساعد مرئي للوكيل الابن هو الرمز الصامت الدقيق `NO_REPLY` / `no_reply`، أو `ANNOUNCE_SKIP` تمامًا، فإن OpenClaw يتعمد كتم الإعلان بدلًا من نشر تقدم أقدم غير صالح.
    - إذا انتهت مهلة الوكيل الابن بعد استدعاءات أدوات فقط، فقد يختزل الإعلان ذلك إلى ملخص قصير للتقدم الجزئي بدلًا من إعادة تشغيل خرج الأدوات الخام.

    التصحيح:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [المهام الخلفية](/ar/automation/tasks)، [أدوات الجلسة](/ar/concepts/session-tool).

  </Accordion>

  <Accordion title="لا تعمل Cron أو التذكيرات. ما الذي ينبغي أن أتحقق منه؟">
    تعمل Cron داخل عملية Gateway. إذا لم تكن Gateway تعمل باستمرار،
    فلن تعمل الوظائف المجدولة.

    قائمة تحقق:

    - أكّد أن Cron مفعلة (`cron.enabled`) وأن `OPENCLAW_SKIP_CRON` غير مضبوط.
    - تحقّق من أن Gateway تعمل على مدار الساعة طوال أيام الأسبوع (من دون سكون/إعادة تشغيل).
    - تحقّق من إعدادات المنطقة الزمنية للوظيفة (`--tz` مقابل المنطقة الزمنية للمضيف).

    التصحيح:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    الوثائق: [وظائف Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="تم تشغيل Cron، لكن لم يُرسل شيء إلى القناة. لماذا؟">
    تحقّق من وضع التسليم أولًا:

    - `--no-deliver` / `delivery.mode: "none"` يعني أنه لا يُتوقع وجود رسالة خارجية.
    - غياب هدف إعلان (`channel` / `to`) أو عدم صحته يعني أن المشغل تخطّى التسليم الصادر.
    - تعني إخفاقات مصادقة القناة (`unauthorized`, `Forbidden`) أن المشغل حاول التسليم لكن بيانات الاعتماد منعته.
    - تُعامل النتيجة المعزولة الصامتة (`NO_REPLY` / `no_reply` فقط) على أنها غير قابلة للتسليم عمدًا، لذلك يكتم المشغل أيضًا تسليم الرجوع إلى الطابور.

    بالنسبة إلى وظائف Cron المعزولة، يملك المشغل التسليم النهائي. ومن المتوقع
    أن يعيد الوكيل ملخصًا نصيًا عاديًا لكي يرسله المشغل. يُبقي `--no-deliver`
    تلك النتيجة داخلية؛ ولا يسمح للوكيل بالإرسال مباشرةً باستخدام
    أداة الرسائل بدلًا من ذلك.

    التصحيح:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [وظائف Cron](/ar/automation/cron-jobs)، [المهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="لماذا بدّلت عملية Cron معزولة النماذج أو أعادت المحاولة مرة واحدة؟">
    يكون هذا عادةً مسار تبديل النموذج الحي، وليس جدولة مكررة.

    يمكن لـ Cron المعزولة حفظ عملية تسليم نموذج وقت التشغيل وإعادة المحاولة عندما
    يطرح التشغيل النشط `LiveSessionModelSwitchError`. وتحافظ إعادة المحاولة على
    المزوّد/النموذج الذي تم التبديل إليه، وإذا كان التبديل يحمل تجاوزًا جديدًا لملف تعريف المصادقة،
    فإن Cron تحفظ ذلك أيضًا قبل إعادة المحاولة.

    قواعد الاختيار ذات الصلة:

    - يتقدم أولًا تجاوز نموذج Gmail hook عند انطباقه.
    - ثم `model` لكل وظيفة.
    - ثم أي تجاوز مخزن لنموذج جلسة Cron.
    - ثم اختيار النموذج العادي للوكيل/الافتراضي.

    حلقة إعادة المحاولة محدودة. فبعد المحاولة الأولية بالإضافة إلى محاولتَي تبديل،
    تُجهض Cron بدلًا من التكرار إلى ما لا نهاية.

    التصحيح:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [وظائف Cron](/ar/automation/cron-jobs)، [CLI لـ cron](/cli/cron).

  </Accordion>

  <Accordion title="كيف أُثبت Skills على Linux؟">
    استخدم أوامر `openclaw skills` الأصلية أو أسقط Skills داخل مساحة عملك. واجهة Skills على macOS غير متاحة على Linux.
    تصفح Skills على [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    تكتب عملية `openclaw skills install` الأصلية إلى دليل `skills/`
    في مساحة العمل النشطة. ثبّت CLI المنفصل `clawhub` فقط إذا كنت تريد نشر
    Skills الخاصة بك أو مزامنتها. ولعمليات التثبيت المشتركة عبر الوكلاء، ضع Skill تحت
    `~/.openclaw/skills` واستخدم `agents.defaults.skills` أو
    `agents.list[].skills` إذا كنت تريد تضييق نطاق الوكلاء الذين يمكنهم رؤيتها.

  </Accordion>

  <Accordion title="هل يستطيع OpenClaw تشغيل مهام وفق جدول أو باستمرار في الخلفية؟">
    نعم. استخدم المجدول الخاص بـ Gateway:

    - **وظائف Cron** للمهام المجدولة أو المتكررة (تستمر عبر إعادة التشغيل).
    - **Heartbeat** للفحوصات الدورية الخاصة بـ "الجلسة الرئيسية".
    - **الوظائف المعزولة** للوكلاء المستقلين الذين ينشرون ملخصات أو يسلّمون إلى الدردشات.

    الوثائق: [وظائف Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation)،
    [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل Skills الخاصة بـ Apple/macOS فقط من Linux؟">
    ليس مباشرةً. تُقيد Skills الخاصة بـ macOS بواسطة `metadata.openclaw.os` بالإضافة إلى الملفات الثنائية المطلوبة، ولا تظهر Skills في مطالبة النظام إلا عندما تكون مؤهلة على **مضيف Gateway**. وعلى Linux، لن تُحمَّل Skills الخاصة بـ `darwin` فقط (مثل `apple-notes` و`apple-reminders` و`things-mac`) ما لم تتجاوز هذا التقييد.

    لديك ثلاثة أنماط مدعومة:

    **الخيار A - تشغيل Gateway على جهاز Mac (الأبسط).**
    شغّل Gateway حيث توجد الملفات الثنائية الخاصة بـ macOS، ثم اتصل من Linux في [الوضع البعيد](#gateway-ports-already-running-and-remote-mode) أو عبر Tailscale. تُحمَّل Skills بشكل طبيعي لأن مضيف Gateway هو macOS.

    **الخيار B - استخدام Node لنظام macOS (من دون SSH).**
    شغّل Gateway على Linux، ثم اقترن مع Node لنظام macOS (تطبيق شريط القوائم)، واضبط **Node Run Commands** على "Always Ask" أو "Always Allow" على جهاز Mac. يمكن لـ OpenClaw اعتبار Skills الخاصة بـ macOS فقط مؤهلة عندما تكون الملفات الثنائية المطلوبة موجودة على الـ Node. ويشغّل الوكيل تلك Skills عبر أداة `nodes`. وإذا اخترت "Always Ask"، فإن الموافقة على "Always Allow" في المطالبة تضيف ذلك الأمر إلى قائمة السماح.

    **الخيار C - تمرير الملفات الثنائية الخاصة بـ macOS عبر SSH (متقدم).**
    أبقِ Gateway على Linux، لكن اجعل الملفات الثنائية CLI المطلوبة تُحل إلى أغلفة SSH تعمل على جهاز Mac. ثم تجاوز Skill للسماح بـ Linux حتى تظل مؤهلة.

    1. أنشئ غلاف SSH للملف الثنائي (مثال: `memo` لـ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. ضع الغلاف في `PATH` على مضيف Linux (على سبيل المثال `~/bin/memo`).
    3. تجاوز بيانات Skill الوصفية (مساحة العمل أو `~/.openclaw/skills`) للسماح بـ Linux:

       ```markdown
       ---
       name: apple-notes
       description: إدارة Apple Notes عبر CLI الخاص بـ memo على macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. ابدأ جلسة جديدة حتى يتم تحديث لقطة Skills.

  </Accordion>

  <Accordion title="هل لديكم تكامل مع Notion أو HeyGen؟">
    ليس مضمّنًا اليوم.

    الخيارات:

    - **Skill / Plugin مخصص:** الأفضل للوصول الموثوق إلى API (لكل من Notion وHeyGen واجهات API).
    - **أتمتة المتصفح:** تعمل من دون شيفرة لكنها أبطأ وأكثر هشاشة.

    إذا كنت تريد الاحتفاظ بالسياق لكل عميل (سير عمل الوكالات)، فنمط بسيط هو:

    - صفحة Notion واحدة لكل عميل (السياق + التفضيلات + العمل النشط).
    - اطلب من الوكيل جلب تلك الصفحة في بداية الجلسة.

    إذا كنت تريد تكاملًا أصليًا، فافتح طلب ميزة أو ابنِ Skill
    تستهدف تلك الواجهات API.

    تثبيت Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    تصل عمليات التثبيت الأصلية إلى دليل `skills/` في مساحة العمل النشطة. وبالنسبة إلى Skills المشتركة عبر الوكلاء، ضعها في `~/.openclaw/skills/<name>/SKILL.md`. وإذا كان ينبغي أن ترى بعض الوكلاء فقط عملية تثبيت مشتركة، فاضبط `agents.defaults.skills` أو `agents.list[].skills`. وتتوقع بعض Skills وجود ملفات ثنائية مثبتة عبر Homebrew؛ وعلى Linux فهذا يعني Linuxbrew (راجع إدخال الأسئلة الشائعة عن Homebrew Linux أعلاه). راجع [Skills](/ar/tools/skills)، و[تكوين Skills](/ar/tools/skills-config)، و[ClawHub](/ar/tools/clawhub).

  </Accordion>

  <Accordion title="كيف أستخدم Chrome الحالي المسجّل الدخول به مع OpenClaw؟">
    استخدم ملف تعريف المتصفح المضمّن `user`، الذي يرتبط عبر Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    وإذا كنت تريد اسمًا مخصصًا، فأنشئ ملف تعريف MCP صريحًا:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    هذا المسار محلي بالنسبة إلى المضيف. وإذا كانت Gateway تعمل في مكان آخر، فإما أن تشغّل مضيف Node على الجهاز الذي يوجد عليه المتصفح أو أن تستخدم CDP عن بُعد بدلًا من ذلك.

    القيود الحالية على `existing-session` / `user`:

    - الإجراءات تعتمد على `ref`، وليس على محددات CSS
    - تتطلب عمليات الرفع `ref` / `inputRef` وتدعم حاليًا ملفًا واحدًا في كل مرة
    - ما تزال `responsebody` وتصدير PDF واعتراض التنزيلات والإجراءات المجمعة تتطلب متصفحًا مُدارًا أو ملف تعريف CDP خام

  </Accordion>
</AccordionGroup>

## العزل والذاكرة

<AccordionGroup>
  <Accordion title="هل توجد وثيقة مخصصة للعزل؟">
    نعم. راجع [العزل](/ar/gateway/sandboxing). ولإعدادات Docker الخاصة (Gateway كاملة داخل Docker أو صور العزل)، راجع [Docker](/ar/install/docker).
  </Accordion>

  <Accordion title="يبدو Docker محدودًا - كيف أُمكّن الميزات الكاملة؟">
    الصورة الافتراضية تضع الأمان أولًا وتعمل بصفتها المستخدم `node`، لذلك فهي لا
    تتضمن حزم النظام، أو Homebrew، أو المتصفحات المضمّنة. ومن أجل إعداد أكثر اكتمالًا:

    - اجعل `/home/node` دائمًا باستخدام `OPENCLAW_HOME_VOLUME` حتى تبقى الذاكرات المؤقتة.
    - ضمّن تبعيات النظام في الصورة باستخدام `OPENCLAW_DOCKER_APT_PACKAGES`.
    - ثبّت متصفحات Playwright عبر CLI المضمّنة:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - اضبط `PLAYWRIGHT_BROWSERS_PATH` وتأكد من أن المسار محفوظ بشكل دائم.

    الوثائق: [Docker](/ar/install/docker)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل يمكنني إبقاء الرسائل الخاصة شخصية ولكن جعل المجموعات عامة/معزولة باستخدام وكيل واحد؟">
    نعم - إذا كانت الحركة الخاصة لديك هي **الرسائل الخاصة** وكانت الحركة العامة لديك هي **المجموعات**.

    استخدم `agents.defaults.sandbox.mode: "non-main"` بحيث تعمل جلسات المجموعة/القناة (المفاتيح غير الرئيسية) داخل Docker، بينما تبقى جلسة الرسائل الخاصة الرئيسية على المضيف. ثم قيّد الأدوات المتاحة في الجلسات المعزولة عبر `tools.sandbox.tools`.

    شرح الإعداد + مثال التكوين: [المجموعات: رسائل خاصة شخصية + مجموعات عامة](/ar/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع التكوين الأساسي: [تكوين Gateway](/ar/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="كيف أربط مجلدًا من المضيف داخل sandbox؟">
    اضبط `agents.defaults.sandbox.docker.binds` إلى `["host:path:mode"]` (مثل `"/home/user/src:/src:ro"`). تندمج الارتباطات العامة + ارتباطات كل وكيل؛ ويتم تجاهل ارتباطات كل وكيل عندما تكون `scope: "shared"`. استخدم `:ro` لأي شيء حساس وتذكّر أن الارتباطات تتجاوز جدران نظام ملفات sandbox.

    يتحقق OpenClaw من مصادر الربط وفقًا لكل من المسار المُطبّع والمسار القانوني الذي يُحل عبر أعمق سلف موجود. وهذا يعني أن محاولات الهروب عبر والد رمزي ما تزال تُغلَق بشكل آمن حتى عندما لا يكون الجزء الأخير من المسار موجودًا بعد، كما أن فحوصات الجذر المسموح به تظل مطبقة بعد حل الروابط الرمزية.

    راجع [العزل](/ar/gateway/sandboxing#custom-bind-mounts) و[Sandbox مقابل سياسة الأداة مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) للاطلاع على أمثلة وملاحظات السلامة.

  </Accordion>

  <Accordion title="كيف تعمل الذاكرة؟">
    ذاكرة OpenClaw هي مجرد ملفات Markdown داخل مساحة عمل الوكيل:

    - ملاحظات يومية في `memory/YYYY-MM-DD.md`
    - ملاحظات منسقة طويلة الأمد في `MEMORY.md` (للجلسات الرئيسية/الخاصة فقط)

    يشغّل OpenClaw أيضًا **تفريغًا صامتًا للذاكرة قبل Compaction** لتذكير النموذج
    بكتابة ملاحظات دائمة قبل Compaction التلقائي. ولا يعمل هذا إلا عندما تكون مساحة العمل
    قابلة للكتابة (تتخطاه بيئات sandbox للقراءة فقط). راجع [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="الذاكرة تستمر في نسيان الأشياء. كيف أجعلها تثبت؟">
    اطلب من الروبوت **أن يكتب الحقيقة في الذاكرة**. تنتمي الملاحظات طويلة الأمد إلى `MEMORY.md`،
    بينما يذهب السياق قصير الأمد إلى `memory/YYYY-MM-DD.md`.

    ما يزال هذا مجالًا نعمل على تحسينه. ومن المفيد تذكير النموذج بتخزين الذكريات؛
    فهو سيعرف ما يجب فعله. وإذا استمر في النسيان، فتحقق من أن Gateway تستخدم
    مساحة العمل نفسها في كل تشغيل.

    الوثائق: [الذاكرة](/ar/concepts/memory)، [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="هل تستمر الذاكرة إلى الأبد؟ ما الحدود؟">
    تعيش ملفات الذاكرة على القرص وتستمر حتى تحذفها. الحد هنا هو
    التخزين لديك، وليس النموذج. أما **سياق الجلسة** فما يزال محدودًا بنافذة سياق
    النموذج، لذلك قد تخضع المحادثات الطويلة إلى Compaction أو الاقتطاع. ولهذا السبب
    يوجد البحث في الذاكرة - إذ يعيد فقط الأجزاء ذات الصلة إلى السياق.

    الوثائق: [الذاكرة](/ar/concepts/memory)، [السياق](/ar/concepts/context).

  </Accordion>

  <Accordion title="هل يتطلب البحث الدلالي في الذاكرة مفتاح OpenAI API؟">
    فقط إذا كنت تستخدم **OpenAI embeddings**. تغطي مصادقة Codex OAuth الدردشة/الإكمالات
    ولا **تمنح** وصولًا إلى embeddings، لذلك فإن **تسجيل الدخول باستخدام Codex (OAuth أو
    تسجيل دخول Codex CLI)** لا يساعد في البحث الدلالي في الذاكرة. وما تزال embeddings الخاصة بـ OpenAI
    تحتاج إلى مفتاح API حقيقي (`OPENAI_API_KEY` أو `models.providers.openai.apiKey`).

    إذا لم تضبط مزودًا صراحةً، فإن OpenClaw يختار مزودًا تلقائيًا عندما
    يتمكن من حل مفتاح API (ملفات تعريف المصادقة، أو `models.providers.*.apiKey`، أو متغيرات البيئة).
    وهو يفضّل OpenAI إذا أمكن حل مفتاح OpenAI، وإلا Gemini إذا أمكن حل مفتاح Gemini،
    ثم Voyage، ثم Mistral. وإذا لم يكن أي مفتاح بعيد متاحًا، فإن البحث في الذاكرة
    يبقى معطلًا حتى تقوم بتكوينه. وإذا كان لديك مسار نموذج محلي
    مضبوط وموجود، فإن OpenClaw
    يفضّل `local`. ويدعم Ollama عندما تضبط صراحةً
    `memorySearch.provider = "ollama"`.

    وإذا كنت تفضّل البقاء محليًا، فاضبط `memorySearch.provider = "local"` (واختياريًا
    `memorySearch.fallback = "none"`). وإذا كنت تريد Gemini embeddings، فاضبط
    `memorySearch.provider = "gemini"` ووفّر `GEMINI_API_KEY` (أو
    `memorySearch.remote.apiKey`). نحن ندعم نماذج embedding الخاصة بـ **OpenAI وGemini وVoyage وMistral وOllama أو local**
    - راجع [الذاكرة](/ar/concepts/memory) لتفاصيل الإعداد.

  </Accordion>
</AccordionGroup>

## أين توجد الأشياء على القرص

<AccordionGroup>
  <Accordion title="هل تُحفَظ كل البيانات المستخدمة مع OpenClaw محليًا؟">
    لا - **حالة OpenClaw محلية**، لكن **الخدمات الخارجية ما تزال ترى ما ترسله إليها**.

    - **محلي افتراضيًا:** تعيش الجلسات، وملفات الذاكرة، والتكوين، ومساحة العمل على مضيف Gateway
      (`~/.openclaw` + دليل مساحة العمل لديك).
    - **بعيد بحكم الضرورة:** تُرسَل الرسائل التي ترسلها إلى مزودي النماذج (Anthropic/OpenAI/إلخ) إلى
      واجهات API الخاصة بهم، كما تخزن منصات الدردشة (WhatsApp/Telegram/Slack/إلخ) بيانات الرسائل على
      خوادمها.
    - **أنت تتحكم في النطاق:** يؤدي استخدام النماذج المحلية إلى إبقاء المطالبات على جهازك، لكن
      حركة القنوات ما تزال تمر عبر خوادم القناة.

    ذو صلة: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="أين يخزن OpenClaw بياناته؟">
    كل شيء يعيش تحت `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`):

    | المسار                                                            | الغرض                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | التكوين الرئيسي (JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | استيراد OAuth القديم (يُنسخ إلى ملفات تعريف المصادقة عند أول استخدام)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | ملفات تعريف المصادقة (OAuth، ومفاتيح API، و`keyRef`/`tokenRef` الاختيارية)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | حمولة سرية اختيارية مدعومة بملف لمزوّدي `file` من SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ملف توافق قديم (تُنظف منه إدخالات `api_key` الثابتة)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | حالة المزوّد (مثل `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | حالة كل وكيل (agentDir + sessions)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | سجل المحادثات والحالة (لكل وكيل)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | بيانات الجلسات الوصفية (لكل وكيل)                                       |

    المسار القديم لوكيل واحد: `~/.openclaw/agent/*` (يُرحَّل بواسطة `openclaw doctor`).

    أما **مساحة العمل** الخاصة بك (`AGENTS.md`، وملفات الذاكرة، وSkills، وغيرها) فهي منفصلة ويجري تكوينها عبر `agents.defaults.workspace` (الافتراضي: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="أين يجب أن توجد AGENTS.md / SOUL.md / USER.md / MEMORY.md؟">
    تعيش هذه الملفات في **مساحة عمل الوكيل**، وليس في `~/.openclaw`.

    - **مساحة العمل (لكل وكيل)**: `AGENTS.md` و`SOUL.md` و`IDENTITY.md` و`USER.md`،
      و`MEMORY.md` (أو المسار الاحتياطي القديم `memory.md` عند غياب `MEMORY.md`)،
      و`memory/YYYY-MM-DD.md`، و`HEARTBEAT.md` الاختياري.
    - **دليل الحالة (`~/.openclaw`)**: التكوين، وحالة القناة/المزوّد، وملفات تعريف المصادقة، والجلسات، والسجلات،
      وSkills المشتركة (`~/.openclaw/skills`).

    مساحة العمل الافتراضية هي `~/.openclaw/workspace`، ويمكن تكوينها عبر:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    إذا كان الروبوت "ينسى" بعد إعادة التشغيل، فتأكد من أن Gateway تستخدم
    مساحة العمل نفسها في كل تشغيل (وتذكر: يستخدم الوضع البعيد **مساحة عمل مضيف Gateway**،
    وليس حاسوبك المحمول المحلي).

    نصيحة: إذا كنت تريد سلوكًا أو تفضيلًا دائمًا، فاطلب من الروبوت **كتابته في
    AGENTS.md أو MEMORY.md** بدلًا من الاعتماد على سجل الدردشة.

    راجع [مساحة عمل الوكيل](/ar/concepts/agent-workspace) و[الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="استراتيجية النسخ الاحتياطي الموصى بها">
    ضع **مساحة عمل الوكيل** الخاصة بك في مستودع git **خاص** وخذ نسخة احتياطية منها في مكان
    خاص (مثل GitHub الخاص). يلتقط هذا الذاكرة + ملفات AGENTS/SOUL/USER
    ويسمح لك باستعادة "عقل" المساعد لاحقًا.

    **لا** تُدرج أي شيء تحت `~/.openclaw` في الالتزامات (بيانات الاعتماد، أو الجلسات، أو الرموز المميزة، أو الحمولات السرية المشفرة).
    وإذا كنت تحتاج إلى استعادة كاملة، فخذ نسخة احتياطية من كل من مساحة العمل ودليل الحالة
    بشكل منفصل (راجع سؤال الترحيل أعلاه).

    الوثائق: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="كيف أزيل OpenClaw بالكامل؟">
    راجع الدليل المخصص: [إزالة التثبيت](/ar/install/uninstall).
  </Accordion>

  <Accordion title="هل يمكن للوكلاء العمل خارج مساحة العمل؟">
    نعم. مساحة العمل هي **cwd الافتراضي** ومرساة الذاكرة، وليست sandbox صلبة.
    تُحل المسارات النسبية داخل مساحة العمل، لكن يمكن للمسارات المطلقة الوصول إلى
    مواقع أخرى على المضيف ما لم يكن العزل مفعّلًا. وإذا كنت تحتاج إلى عزل، فاستخدم
    [`agents.defaults.sandbox`](/ar/gateway/sandboxing) أو إعدادات sandbox لكل وكيل. وإذا كنت
    تريد أن يكون المستودع هو دليل العمل الافتراضي، فوجه `workspace`
    الخاص بذلك الوكيل إلى جذر المستودع. ومستودع OpenClaw ليس سوى شيفرة مصدرية؛ أبقِ
    مساحة العمل منفصلة ما لم تكن تريد عمدًا أن يعمل الوكيل داخلها.

    مثال (المستودع باعتباره cwd الافتراضي):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="الوضع البعيد: أين يوجد مخزن الجلسات؟">
    تعود ملكية حالة الجلسة إلى **مضيف Gateway**. وإذا كنت في الوضع البعيد، فإن مخزن الجلسات الذي يهمك يوجد على الجهاز البعيد، وليس على حاسوبك المحمول المحلي. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>
</AccordionGroup>

## أساسيات التكوين

<AccordionGroup>
  <Accordion title="ما تنسيق التكوين؟ وأين يوجد؟">
    يقرأ OpenClaw تكوين **JSON5** اختياريًا من `$OPENCLAW_CONFIG_PATH` (الافتراضي: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    إذا كان الملف مفقودًا، فإنه يستخدم إعدادات افتراضية آمنة إلى حد ما (بما في ذلك مساحة عمل افتراضية هي `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='لقد ضبطت gateway.bind: "lan" (أو "tailnet") والآن لا يوجد شيء يستمع / تقول واجهة المستخدم unauthorized'>
    تتطلب عمليات الربط غير loopback **مسار مصادقة صالحًا لـ Gateway**. وعمليًا يعني ذلك:

    - مصادقة shared-secret: رمز مميز أو كلمة مرور
    - `gateway.auth.mode: "trusted-proxy"` خلف وكيل عكسي مدرك للهوية غير loopback ومكوّن على نحو صحيح

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    ملاحظات:

    - لا يقوم `gateway.remote.token` / `.password` **بمفردهما** بتمكين مصادقة Gateway المحلية.
    - يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كاحتياطي فقط عندما لا يكون `gateway.auth.*` مضبوطًا.
    - بالنسبة إلى مصادقة كلمة المرور، اضبط `gateway.auth.mode: "password"` مع `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`) بدلًا من ذلك.
    - إذا جرى تكوين `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef وتعذر حله، فإن الحل يفشل بشكل مغلق (من دون تمويه احتياطي بعيد).
    - تُصادق إعدادات shared-secret الخاصة بـ Control UI عبر `connect.params.auth.token` أو `connect.params.auth.password` (المخزَّنين في إعدادات التطبيق/واجهة المستخدم). أما الأوضاع الحاملة للهوية مثل Tailscale Serve أو `trusted-proxy` فتستخدم ترويسات الطلب بدلًا من ذلك. تجنب وضع shared secrets داخل عناوين URL.
    - مع `gateway.auth.mode: "trusted-proxy"`، فإن الوكلاء العكسيين loopback على المضيف نفسه **لا** يلبون مصادقة trusted-proxy. يجب أن يكون trusted proxy مصدرًا غير loopback ومكوّنًا.

  </Accordion>

  <Accordion title="لماذا أحتاج الآن إلى رمز مميز على localhost؟">
    يفرض OpenClaw مصادقة Gateway افتراضيًا، بما في ذلك loopback. وفي المسار الافتراضي المعتاد، يعني ذلك مصادقة الرمز المميز: إذا لم يُكوَّن مسار مصادقة صريح، فإن بدء تشغيل Gateway يحل إلى وضع الرمز المميز ويولّد واحدًا تلقائيًا، ويحفظه في `gateway.auth.token`، لذلك **يجب على عملاء WS المحليين المصادقة**. وهذا يمنع العمليات المحلية الأخرى من استدعاء Gateway.

    وإذا كنت تفضّل مسار مصادقة مختلفًا، فيمكنك اختيار وضع كلمة المرور صراحةً (أو `trusted-proxy` بالنسبة إلى الوكلاء العكسية غير loopback والمدركة للهوية). وإذا كنت **حقًا** تريد loopback مفتوحة، فاضبط `gateway.auth.mode: "none"` صراحةً في التكوين. ويمكن لـ Doctor إنشاء رمز مميز لك في أي وقت: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="هل يجب أن أعيد التشغيل بعد تغيير التكوين؟">
    تراقب Gateway التكوين وتدعم إعادة التحميل السريع:

    - `gateway.reload.mode: "hybrid"` (الافتراضي): تطبيق التغييرات الآمنة فورًا، وإعادة التشغيل للتغييرات الحرجة
    - كما أن `hot` و`restart` و`off` مدعومة أيضًا

  </Accordion>

  <Accordion title="كيف أعطّل العبارات الطريفة في CLI؟">
    اضبط `cli.banner.taglineMode` في التكوين:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: يُخفي نص العبارة التعريفية لكنه يُبقي سطر عنوان الشعار/الإصدار.
    - `default`: يستخدم `All your chats, one OpenClaw.` في كل مرة.
    - `random`: عبارات تعريفية طريفة/موسمية متناوبة (السلوك الافتراضي).
    - إذا كنت لا تريد أي شعار إطلاقًا، فاضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="كيف أمكّن البحث في الويب (وجلب الويب)؟">
    يعمل `web_fetch` من دون مفتاح API. أما `web_search` فيعتمد على
    المزوّد الذي اخترته:

    - يتطلب المزوّدون المدعومون بواجهات API مثل Brave وExa وFirecrawl وGemini وGrok وKimi وMiniMax Search وPerplexity وTavily إعداد مفتاح API المعتاد لديهم.
    - لا يحتاج Ollama Web Search إلى مفتاح، لكنه يستخدم مضيف Ollama المكوّن لديك ويتطلب `ollama signin`.
    - لا يحتاج DuckDuckGo إلى مفتاح، لكنه تكامل غير رسمي قائم على HTML.
    - SearXNG مجاني الاستعمال/مستضاف ذاتيًا؛ اضبط `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl`.

    **الموصى به:** شغّل `openclaw configure --section web` واختر مزودًا.
    بدائل متغيرات البيئة:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` أو `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY` أو `MINIMAX_CODING_API_KEY` أو `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` أو `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // اختياري؛ احذفه للاكتشاف التلقائي
            },
          },
        },
    }
    ```

    يوجد الآن التكوين الخاص بالبحث في الويب لكل مزود تحت `plugins.entries.<plugin>.config.webSearch.*`.
    وما تزال مسارات المزوّد القديمة `tools.web.search.*` تُحمَّل مؤقتًا من أجل التوافق، لكن لا ينبغي استخدامها في التكوينات الجديدة.
    يوجد تكوين الرجوع الاحتياطي الخاص بجلب الويب لـ Firecrawl تحت `plugins.entries.firecrawl.config.webFetch.*`.

    ملاحظات:

    - إذا كنت تستخدم قوائم السماح، فأضف `web_search`/`web_fetch`/`x_search` أو `group:web`.
    - يكون `web_fetch` مفعّلًا افتراضيًا (ما لم يُعطّل صراحةً).
    - إذا تم حذف `tools.web.fetch.provider`، يكتشف OpenClaw تلقائيًا أول مزود رجوع احتياطي جاهز للجلب من بيانات الاعتماد المتاحة. والمزوّد المضمّن اليوم هو Firecrawl.
    - تقرأ العمليات الخدمية متغيرات البيئة من `~/.openclaw/.env` (أو من بيئة الخدمة).

    الوثائق: [أدوات الويب](/ar/tools/web).

  </Accordion>

  <Accordion title="قام config.apply بمسح التكوين الخاص بي. كيف أستعيده وأتجنب ذلك؟">
    يستبدل `config.apply` **التكوين بالكامل**. وإذا أرسلت كائنًا جزئيًا، فسيُزال
    كل شيء آخر.

    الاستعادة:

    - استعده من نسخة احتياطية (git أو نسخة من `~/.openclaw/openclaw.json`).
    - إذا لم تكن لديك نسخة احتياطية، فأعد تشغيل `openclaw doctor` ثم أعد تكوين القنوات/النماذج.
    - إذا كان هذا غير متوقع، فافتح بلاغ خلل وضمّن آخر تكوين معروف لديك أو أي نسخة احتياطية.
    - يمكن لوكيل برمجة محلي في كثير من الأحيان إعادة بناء تكوين عامل من السجلات أو السجل السابق.

    لتجنب ذلك:

    - استخدم `openclaw config set` للتغييرات الصغيرة.
    - استخدم `openclaw configure` للتعديلات التفاعلية.
    - استخدم `config.schema.lookup` أولًا عندما لا تكون متأكدًا من المسار الدقيق أو شكل الحقل؛ فهو يعيد عقدة مخطط سطحية بالإضافة إلى ملخصات الأبناء المباشرين للتعمق.
    - استخدم `config.patch` لتعديلات RPC الجزئية؛ وأبقِ `config.apply` لاستبدال التكوين الكامل فقط.
    - إذا كنت تستخدم أداة `gateway` المخصصة للمالك فقط من تشغيل وكيل، فستظل ترفض الكتابة إلى `tools.exec.ask` / `tools.exec.security` (بما في ذلك الأسماء المستعارة القديمة `tools.bash.*` التي تُطبّع إلى مسارات exec المحمية نفسها).

    الوثائق: [التكوين](/cli/config)، [التهيئة](/cli/configure)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="كيف أشغّل Gateway مركزية مع عمال متخصصين عبر الأجهزة؟">
    النمط الشائع هو **Gateway واحدة** (مثل Raspberry Pi) بالإضافة إلى **Nodes** و**وكلاء**:

    - **Gateway (مركزية):** تملك القنوات (Signal/WhatsApp)، والتوجيه، والجلسات.
    - **Nodes (الأجهزة):** تتصل أجهزة Mac/iOS/Android كملحقات وتكشف الأدوات المحلية (`system.run` و`canvas` و`camera`).
    - **الوكلاء (العمال):** عقول/مساحات عمل منفصلة لأدوار خاصة (مثل "عمليات Hetzner" و"البيانات الشخصية").
    - **الوكلاء الفرعيون:** ينشئون عملًا في الخلفية من وكيل رئيسي عندما تريد العمل المتوازي.
    - **TUI:** يتصل بـ Gateway ويبدّل بين الوكلاء/الجلسات.

    الوثائق: [Nodes](/ar/nodes)، [الوصول عن بُعد](/ar/gateway/remote)، [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [TUI](/web/tui).

  </Accordion>

  <Accordion title="هل يمكن لمتصفح OpenClaw أن يعمل في وضع headless؟">
    نعم. هذا خيار تكوين:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    القيمة الافتراضية هي `false` (مع واجهة مرئية). ويكون وضع headless أكثر عرضة لتفعيل فحوصات مكافحة الروبوتات في بعض المواقع. راجع [المتصفح](/ar/tools/browser).

    يستخدم وضع headless **محرك Chromium نفسه** ويعمل مع معظم الأتمتة (النماذج، والنقرات، والكشط، وتسجيلات الدخول). الفروق الرئيسية:

    - لا توجد نافذة متصفح مرئية (استخدم لقطات الشاشة إذا كنت بحاجة إلى عناصر مرئية).
    - تكون بعض المواقع أكثر تشددًا تجاه الأتمتة في وضع headless (CAPTCHA، ومكافحة الروبوتات).
      على سبيل المثال، غالبًا ما يحظر X/Twitter جلسات headless.

  </Accordion>

  <Accordion title="كيف أستخدم Brave للتحكم في المتصفح؟">
    اضبط `browser.executablePath` إلى الملف الثنائي الخاص بـ Brave لديك (أو أي متصفح قائم على Chromium) ثم أعد تشغيل Gateway.
    راجع أمثلة التكوين الكاملة في [المتصفح](/ar/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways البعيدة وNodes

<AccordionGroup>
  <Accordion title="كيف تنتشر الأوامر بين Telegram وGateway وNodes؟">
    تتم معالجة رسائل Telegram بواسطة **Gateway**. تشغّل Gateway الوكيل
    ثم تستدعي Nodes عبر **Gateway WebSocket** فقط عندما تكون هناك حاجة إلى أداة Node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    لا ترى Nodes حركة المزوّد الواردة؛ فهي لا تتلقى إلا استدعاءات RPC الخاصة بـ Node.

  </Accordion>

  <Accordion title="كيف يمكن لوكيلي الوصول إلى جهازي إذا كانت Gateway مستضافة عن بُعد؟">
    الإجابة المختصرة: **اقرن جهازك بوصفه Node**. تعمل Gateway في مكان آخر، لكنها تستطيع
    استدعاء أدوات `node.*` (الشاشة، والكاميرا، والنظام) على جهازك المحلي عبر Gateway WebSocket.

    إعداد نموذجي:

    1. شغّل Gateway على المضيف الذي يعمل دائمًا (VPS/خادم منزلي).
    2. ضع مضيف Gateway + جهازك على tailnet نفسها.
    3. تأكد من أن Gateway WS قابلة للوصول (ربط tailnet أو نفق SSH).
    4. افتح تطبيق macOS محليًا واتصل في وضع **Remote over SSH**
       (أو tailnet مباشرةً) حتى يتمكن من التسجيل بوصفه Node.
    5. وافق على Node في Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    لا حاجة إلى جسر TCP منفصل؛ إذ تتصل Nodes عبر Gateway WebSocket.

    تذكير أمني: يسمح إقران Node لنظام macOS بتنفيذ `system.run` على ذلك الجهاز. لا
    تقرن إلا الأجهزة التي تثق بها، وراجع [الأمان](/ar/gateway/security).

    الوثائق: [Nodes](/ar/nodes)، [بروتوكول Gateway](/ar/gateway/protocol)، [الوضع البعيد على macOS](/ar/platforms/mac/remote)، [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="Tailscale متصل لكنني لا أتلقى أي ردود. ماذا الآن؟">
    تحقق من الأساسيات:

    - Gateway تعمل: `openclaw gateway status`
    - صحة Gateway: `openclaw status`
    - صحة القناة: `openclaw channels status`

    ثم تحقق من المصادقة والتوجيه:

    - إذا كنت تستخدم Tailscale Serve، فتأكد من ضبط `gateway.auth.allowTailscale` بشكل صحيح.
    - إذا كنت تتصل عبر نفق SSH، فأكّد أن النفق المحلي قائم ويشير إلى المنفذ الصحيح.
    - أكّد أن قوائم السماح الخاصة بك (الرسائل الخاصة أو المجموعة) تتضمن حسابك.

    الوثائق: [Tailscale](/ar/gateway/tailscale)، [الوصول عن بُعد](/ar/gateway/remote)، [القنوات](/ar/channels).

  </Accordion>

  <Accordion title="هل يمكن لنسختين من OpenClaw التحدث إلى بعضهما البعض (محلية + VPS)؟">
    نعم. لا يوجد جسر "روبوت إلى روبوت" مضمّن، لكن يمكنك توصيل ذلك بعدة
    طرق موثوقة:

    **الأبسط:** استخدم قناة دردشة عادية يمكن لكلا الروبوتين الوصول إليها (Telegram/Slack/WhatsApp).
    اجعل الروبوت A يرسل رسالة إلى الروبوت B، ثم دع الروبوت B يرد كالمعتاد.

    **جسر CLI (عام):** شغّل نصًا يستدعي Gateway الأخرى باستخدام
    `openclaw agent --message ... --deliver`، مستهدفًا دردشة يستمع فيها الروبوت الآخر.
    وإذا كان أحد الروبوتين موجودًا على VPS بعيدة، فوجه CLI لديك إلى تلك Gateway البعيدة
    عبر SSH/Tailscale (راجع [الوصول عن بُعد](/ar/gateway/remote)).

    نمط مثال (شغّله من جهاز يمكنه الوصول إلى Gateway المستهدفة):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نصيحة: أضف حاجزًا وقائيًا حتى لا يدخل الروبوتان في حلقة لا نهائية (الرد عند الإشارة فقط، أو
    قوائم سماح القنوات، أو قاعدة "لا ترد على رسائل الروبوتات").

    الوثائق: [الوصول عن بُعد](/ar/gateway/remote)، [CLI الخاص بالوكيل](/cli/agent)، [إرسال الوكيل](/ar/tools/agent-send).

  </Accordion>

  <Accordion title="هل أحتاج إلى VPS منفصلة لوكلاء متعددين؟">
    لا. يمكن لـ Gateway واحدة استضافة عدة وكلاء، لكل منهم مساحة عمله الخاصة، وإعداداته الافتراضية للنموذج،
    وتوجيهه الخاص. هذا هو الإعداد المعتاد، وهو أرخص بكثير وأبسط من تشغيل
    VPS واحدة لكل وكيل.

    استخدم VPS منفصلة فقط عندما تحتاج إلى عزل صارم (حدود أمان) أو
    تكوينات مختلفة جدًا لا تريد مشاركتها. وإلا، فاحتفظ بـ Gateway واحدة
    واستخدم عدة وكلاء أو وكلاء فرعيين.

  </Accordion>

  <Accordion title="هل توجد فائدة من استخدام Node على حاسوبي المحمول الشخصي بدلًا من SSH من VPS؟">
    نعم - تُعد Nodes الطريقة الأساسية للوصول إلى حاسوبك المحمول من Gateway بعيدة، وهي
    تفتح أكثر من مجرد وصول إلى الصدفة. تعمل Gateway على macOS/Linux (وWindows عبر WSL2) وهي
    خفيفة، لذا فإن إعدادًا شائعًا هو
    مضيف يعمل دائمًا بالإضافة إلى حاسوبك المحمول بوصفه Node.

    - **لا حاجة إلى SSH وارد.** تتصل Nodes خارجيًا بـ Gateway WebSocket وتستخدم إقران الأجهزة.
    - **عناصر تحكم أكثر أمانًا في التنفيذ.** يُحاط `system.run` بقوائم سماح/موافقات Nodes على ذلك الحاسوب المحمول.
    - **المزيد من أدوات الأجهزة.** تكشف Nodes عن `canvas` و`camera` و`screen` بالإضافة إلى `system.run`.
    - **أتمتة متصفح محلية.** أبقِ Gateway على VPS، لكن شغّل Chrome محليًا عبر مضيف Node على الحاسوب المحمول، أو اتصل بـ Chrome المحلي على المضيف عبر Chrome MCP.

    لا بأس باستخدام SSH للوصول العارض إلى الصدفة، لكن Nodes أبسط لسير عمل الوكلاء المستمر
    وأتمتة الأجهزة.

    الوثائق: [Nodes](/ar/nodes)، [CLI لـ Nodes](/cli/nodes)، [المتصفح](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل تقوم Nodes بتشغيل خدمة Gateway؟">
    لا. يجب تشغيل **Gateway واحدة** فقط لكل مضيف ما لم تكن تشغّل عمدًا ملفات تعريف معزولة (راجع [Gateways متعددة](/ar/gateway/multiple-gateways)). تُعد Nodes أجهزة طرفية تتصل
    بـ Gateway (Nodes لـ iOS/Android، أو "وضع Node" على macOS في تطبيق شريط القوائم). وبالنسبة إلى
    مضيفي Nodes بلا واجهة والتحكم عبر CLI، راجع [CLI الخاص بمضيف Node](/cli/node).

    يلزم إجراء إعادة تشغيل كاملة عند تغيير `gateway` أو `discovery` أو `canvasHost`.

  </Accordion>

  <Accordion title="هل توجد طريقة API / RPC لتطبيق التكوين؟">
    نعم.

    - `config.schema.lookup`: فحص شجرة فرعية واحدة من التكوين مع عقدة المخطط السطحية الخاصة بها، وتلميح واجهة المستخدم المطابق، وملخصات الأبناء المباشرين قبل الكتابة
    - `config.get`: جلب اللقطة الحالية + hash
    - `config.patch`: تحديث جزئي آمن (المفضل لمعظم تعديلات RPC)؛ يعيد التحميل السريع عند الإمكان ويعيد التشغيل عند الحاجة
    - `config.apply`: يتحقق من الصحة + يستبدل التكوين الكامل؛ يعيد التحميل السريع عند الإمكان ويعيد التشغيل عند الحاجة
    - ما تزال أداة وقت التشغيل `gateway` المخصصة للمالك فقط ترفض إعادة كتابة `tools.exec.ask` / `tools.exec.security`؛ وتُطبّع الأسماء المستعارة القديمة `tools.bash.*` إلى مسارات exec المحمية نفسها

  </Accordion>

  <Accordion title="أبسط تكوين معقول لأول تثبيت">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    يضبط هذا مساحة العمل الخاصة بك ويقيّد من يمكنه تشغيل الروبوت.

  </Accordion>

  <Accordion title="كيف أُعِد Tailscale على VPS وأتصل من جهاز Mac الخاص بي؟">
    الخطوات الدنيا:

    1. **ثبّت + سجّل الدخول على VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **ثبّت + سجّل الدخول على جهاز Mac**
       - استخدم تطبيق Tailscale وسجّل الدخول إلى tailnet نفسها.
    3. **فعّل MagicDNS (موصى به)**
       - في وحدة تحكم إدارة Tailscale، فعّل MagicDNS حتى يكون لـ VPS اسم ثابت.
    4. **استخدم اسم مضيف tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    إذا كنت تريد Control UI من دون SSH، فاستخدم Tailscale Serve على VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    هذا يُبقي Gateway مربوطة بـ loopback ويكشف HTTPS عبر Tailscale. راجع [Tailscale](/ar/gateway/tailscale).

  </Accordion>

  <Accordion title="كيف أوصل Node على Mac بـ Gateway بعيدة (Tailscale Serve)؟">
    يكشف Serve **Control UI + WS الخاصة بـ Gateway**. وتتصل Nodes عبر نقطة نهاية Gateway WS نفسها.

    الإعداد الموصى به:

    1. **تأكد من أن VPS + جهاز Mac على tailnet نفسها**.
    2. **استخدم تطبيق macOS في الوضع البعيد** (يمكن أن يكون هدف SSH هو اسم مضيف tailnet).
       سيقوم التطبيق بإنشاء نفق لمنفذ Gateway والاتصال بوصفه Node.
    3. **وافق على Node** على Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    الوثائق: [بروتوكول Gateway](/ar/gateway/protocol)، [الاكتشاف](/ar/gateway/discovery)، [الوضع البعيد على macOS](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل ينبغي أن أثبّت على حاسوب محمول ثانٍ أم أضيف Node فقط؟">
    إذا كنت تحتاج فقط إلى **أدوات محلية** (الشاشة/الكاميرا/exec) على الحاسوب المحمول الثاني، فأضفه بوصفه
    **Node**. يُبقي هذا على Gateway واحدة ويتجنب ازدواجية التكوين. أدوات Nodes المحلية
    حاليًا خاصة بـ macOS فقط، لكننا نخطط لتوسيعها إلى أنظمة تشغيل أخرى.

    ثبّت Gateway ثانية فقط عندما تحتاج إلى **عزل صارم** أو إلى روبوتين منفصلين تمامًا.

    الوثائق: [Nodes](/ar/nodes)، [CLI لـ Nodes](/cli/nodes)، [Gateways متعددة](/ar/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغيرات البيئة وتحميل `.env`

<AccordionGroup>
  <Accordion title="كيف يحمّل OpenClaw متغيرات البيئة؟">
    يقرأ OpenClaw متغيرات البيئة من العملية الأم (الصدفة، أو launchd/systemd، أو CI، إلخ) ويحمّل أيضًا:

    - `.env` من دليل العمل الحالي
    - ملف `.env` احتياطي عام من `~/.openclaw/.env` (أي `$OPENCLAW_STATE_DIR/.env`)

    لا يقوم أي من ملفي `.env` بتجاوز متغيرات البيئة الموجودة.

    يمكنك أيضًا تعريف متغيرات بيئة مضمنة في التكوين (تُطبَّق فقط إذا كانت مفقودة من بيئة العملية):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    راجع [/environment](/ar/help/environment) لمعرفة الأولوية الكاملة والمصادر.

  </Accordion>

  <Accordion title="لقد بدأت Gateway عبر الخدمة واختفت متغيرات البيئة الخاصة بي. ماذا الآن؟">
    هناك حلان شائعان:

    1. ضع المفاتيح المفقودة في `~/.openclaw/.env` حتى يتم التقاطها حتى عندما لا ترث الخدمة بيئة الصدفة الخاصة بك.
    2. فعّل استيراد الصدفة (خيار اختياري للراحة):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    يشغّل هذا صدفة تسجيل الدخول لديك ويستورد فقط المفاتيح المتوقعة المفقودة (من دون تجاوز أي شيء مطلقًا). مقابلات متغيرات البيئة:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='لقد ضبطت COPILOT_GITHUB_TOKEN، لكن models status يعرض "Shell env: off." لماذا؟'>
    يبلّغ `openclaw models status` عما إذا كان **استيراد بيئة الصدفة** مفعّلًا. لا تعني عبارة "Shell env: off"
    أن متغيرات البيئة لديك مفقودة - بل تعني فقط أن OpenClaw لن يحمّل
    صدفة تسجيل الدخول لديك تلقائيًا.

    إذا كانت Gateway تعمل بوصفها خدمة (launchd/systemd)، فلن ترث صدفة
    البيئة الخاصة بك. أصلح ذلك بإحدى هذه الطرق:

    1. ضع الرمز المميز في `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. أو فعّل استيراد الصدفة (`env.shellEnv.enabled: true`).
    3. أو أضفه إلى كتلة `env` في التكوين لديك (يُطبّق فقط إذا كان مفقودًا).

    ثم أعد تشغيل Gateway وتحقق مرة أخرى:

    ```bash
    openclaw models status
    ```

    تتم قراءة رموز Copilot من `COPILOT_GITHUB_TOKEN` (وأيضًا `GH_TOKEN` / `GITHUB_TOKEN`).
    راجع [/concepts/model-providers](/ar/concepts/model-providers) و[/environment](/ar/help/environment).

  </Accordion>
</AccordionGroup>

## الجلسات والدردشات المتعددة

<AccordionGroup>
  <Accordion title="كيف أبدأ محادثة جديدة؟">
    أرسل `/new` أو `/reset` بوصفها رسالة مستقلة. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>

  <Accordion title="هل تُعاد تعيين الجلسات تلقائيًا إذا لم أرسل /new مطلقًا؟">
    يمكن أن تنتهي صلاحية الجلسات بعد `session.idleMinutes`، لكن هذا **معطل افتراضيًا** (القيمة الافتراضية **0**).
    اضبطه على قيمة موجبة لتمكين انتهاء الصلاحية عند الخمول. وعند التمكين، فإن الرسالة **التالية**
    بعد فترة الخمول تبدأ معرف جلسة جديدًا لمفتاح الدردشة هذا.
    ولا يحذف هذا النصوص المسجلة - بل يبدأ جلسة جديدة فقط.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="هل توجد طريقة لإنشاء فريق من نسخ OpenClaw (رئيس تنفيذي واحد والعديد من الوكلاء)؟">
    نعم، عبر **التوجيه متعدد الوكلاء** و**الوكلاء الفرعيين**. يمكنك إنشاء وكيل
    منسق واحد والعديد من وكلاء العمال مع مساحات عملهم ونماذجهم الخاصة.

    ومع ذلك، فمن الأفضل النظر إلى هذا على أنه **تجربة ممتعة**. فهو يستهلك قدرًا كبيرًا من الرموز وغالبًا
    ما يكون أقل كفاءة من استخدام روبوت واحد مع جلسات منفصلة. النموذج المعتاد الذي
    نتصوره هو روبوت واحد تتحدث إليه، مع جلسات مختلفة للعمل المتوازي. ويمكن لهذا
    الروبوت أيضًا إنشاء وكلاء فرعيين عند الحاجة.

    الوثائق: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [CLI الخاص بالوكلاء](/cli/agents).

  </Accordion>

  <Accordion title="لماذا اقتُطع السياق في منتصف المهمة؟ كيف أمنع ذلك؟">
    سياق الجلسة محدود بنافذة النموذج. يمكن للدردشات الطويلة، أو مخرجات الأدوات الكبيرة، أو كثرة
    الملفات أن تؤدي إلى Compaction أو الاقتطاع.

    ما الذي يساعد:

    - اطلب من الروبوت تلخيص الحالة الحالية وكتابتها في ملف.
    - استخدم `/compact` قبل المهام الطويلة، و`/new` عند تبديل المواضيع.
    - احتفظ بالسياق المهم في مساحة العمل واطلب من الروبوت قراءته مرة أخرى.
    - استخدم الوكلاء الفرعيين للمهام الطويلة أو المتوازية حتى تبقى الدردشة الرئيسية أصغر.
    - اختر نموذجًا بنافذة سياق أكبر إذا كان هذا يحدث كثيرًا.

  </Accordion>

  <Accordion title="كيف أعيد تعيين OpenClaw بالكامل مع الإبقاء عليه مثبتًا؟">
    استخدم أمر إعادة التعيين:

    ```bash
    openclaw reset
    ```

    إعادة تعيين كاملة غير تفاعلية:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    ثم أعد تشغيل الإعداد:

    ```bash
    openclaw onboard --install-daemon
    ```

    ملاحظات:

    - يقدّم الإعداد الأولي أيضًا خيار **إعادة التعيين** إذا اكتشف تكوينًا موجودًا. راجع [الإعداد الأولي (CLI)](/ar/start/wizard).
    - إذا كنت قد استخدمت ملفات تعريف (`--profile` / `OPENCLAW_PROFILE`)، فأعد تعيين كل دليل حالة (الافتراضي هو `~/.openclaw-<profile>`).
    - إعادة تعيين التطوير: `openclaw gateway --dev --reset` (خاص بالتطوير فقط؛ يمسح تكوين التطوير + بيانات الاعتماد + الجلسات + مساحة العمل).

  </Accordion>

  <Accordion title='أتلقى أخطاء "context too large" - كيف أعيد التعيين أو أجري Compaction؟'>
    استخدم أحد هذه الخيارات:

    - **Compaction** (يُبقي المحادثة لكنه يختصر الأدوار الأقدم):

      ```
      /compact
      ```

      أو `/compact <instructions>` لتوجيه الملخص.

    - **إعادة التعيين** (معرّف جلسة جديد لمفتاح الدردشة نفسه):

      ```
      /new
      /reset
      ```

    إذا استمر حدوث ذلك:

    - فعّل أو اضبط **تقليم الجلسة** (`agents.defaults.contextPruning`) لقص مخرجات الأدوات القديمة.
    - استخدم نموذجًا بنافذة سياق أكبر.

    الوثائق: [Compaction](/ar/concepts/compaction)، [تقليم الجلسة](/ar/concepts/session-pruning)، [إدارة الجلسات](/ar/concepts/session).

  </Accordion>

  <Accordion title='لماذا أرى "LLM request rejected: messages.content.tool_use.input field required"؟'>
    هذا خطأ تحقق من صحة المزوّد: أصدر النموذج كتلة `tool_use` من دون
    `input` المطلوبة. ويعني هذا عادةً أن سجل الجلسة قديم أو تالف (غالبًا بعد سلاسل طويلة
    أو تغيير في الأداة/المخطط).

    الحل: ابدأ جلسة جديدة باستخدام `/new` (رسالة مستقلة).

  </Accordion>

  <Accordion title="لماذا أتلقى رسائل Heartbeat كل 30 دقيقة؟">
    تعمل Heartbeats كل **30 دقيقة** افتراضيًا (**ساعة واحدة** عند استخدام مصادقة OAuth). اضبطها أو عطّلها:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // أو "0m" للتعطيل
          },
        },
      },
    }
    ```

    إذا كان `HEARTBEAT.md` موجودًا لكنه فارغ فعليًا (أسطر فارغة فقط وعناوين
    Markdown مثل `# Heading`)، فإن OpenClaw تتخطى تشغيل Heartbeat لتوفير استدعاءات API.
    وإذا كان الملف مفقودًا، فإن Heartbeat ما تزال تعمل ويقرر النموذج ما يجب فعله.

    تستخدم تجاوزات كل وكيل `agents.list[].heartbeat`. الوثائق: [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title='هل أحتاج إلى إضافة "حساب روبوت" إلى مجموعة WhatsApp؟'>
    لا. يعمل OpenClaw على **حسابك الشخصي**، لذلك إذا كنت موجودًا في المجموعة، يمكن لـ OpenClaw رؤيتها.
    افتراضيًا، تُحظر الردود في المجموعات إلى أن تسمح للمرسلين (`groupPolicy: "allowlist"`).

    إذا كنت تريد أن تتمكن **أنت فقط** من تشغيل الردود في المجموعة:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="كيف أحصل على JID لمجموعة WhatsApp؟">
    الخيار 1 (الأسرع): تتبّع السجلات وأرسل رسالة اختبار في المجموعة:

    ```bash
    openclaw logs --follow --json
    ```

    ابحث عن `chatId` (أو `from`) الذي ينتهي بـ `@g.us`، مثل:
    `1234567890-1234567890@g.us`.

    الخيار 2 (إذا كان مضبوطًا/في قائمة السماح بالفعل): اعرض المجموعات من التكوين:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    الوثائق: [WhatsApp](/ar/channels/whatsapp)، [الدليل](/cli/directory)، [السجلات](/cli/logs).

  </Accordion>

  <Accordion title="لماذا لا يرد OpenClaw في مجموعة؟">
    هناك سببان شائعان:

    - تفعيل الإشارة مفعّل (افتراضيًا). يجب أن تقوم بعمل @mention للروبوت (أو مطابقة `mentionPatterns`).
    - لقد قمت بتكوين `channels.whatsapp.groups` من دون `"*"` والمجموعة ليست ضمن قائمة السماح.

    راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).

  </Accordion>

  <Accordion title="هل تشترك المجموعات/سلاسل المحادثات في السياق مع الرسائل الخاصة؟">
    تُدمج الدردشات المباشرة في الجلسة الرئيسية افتراضيًا. أما المجموعات/القنوات فلها مفاتيح جلسات خاصة بها، كما أن مواضيع Telegram / سلاسل Discord هي جلسات منفصلة. راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).
  </Accordion>

  <Accordion title="كم عدد مساحات العمل والوكلاء الذين يمكنني إنشاؤهم؟">
    لا توجد حدود صارمة. العشرات (بل حتى المئات) لا بأس بها، ولكن انتبه إلى:

    - **نمو القرص:** تعيش الجلسات + النصوص المسجلة تحت `~/.openclaw/agents/<agentId>/sessions/`.
    - **تكلفة الرموز:** يعني المزيد من الوكلاء مزيدًا من استخدام النماذج المتزامن.
    - **أعباء التشغيل:** ملفات تعريف المصادقة، ومساحات العمل، وتوجيه القنوات لكل وكيل.

    نصائح:

    - احتفظ **بمساحة عمل نشطة** واحدة لكل وكيل (`agents.defaults.workspace`).
    - قلّم الجلسات القديمة (احذف JSONL أو مدخلات التخزين) إذا نما القرص.
    - استخدم `openclaw doctor` لاكتشاف مساحات العمل الشاردة وعدم تطابق ملفات التعريف.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة روبوتات أو دردشات في الوقت نفسه (Slack)، وكيف ينبغي أن أُعد ذلك؟">
    نعم. استخدم **التوجيه متعدد الوكلاء** لتشغيل عدة وكلاء معزولين وتوجيه الرسائل الواردة بحسب
    القناة/الحساب/النظير. Slack مدعوم بوصفه قناة ويمكن ربطه بوكلاء محددين.

    إن الوصول إلى المتصفح قوي، لكنه ليس "افعل أي شيء يمكن للإنسان فعله" - فما تزال أنظمة مكافحة الروبوتات وCAPTCHA وMFA
    قادرة على حظر الأتمتة. ولأكثر تحكم موثوق في المتصفح، استخدم Chrome MCP المحلي على المضيف،
    أو استخدم CDP على الجهاز الذي يشغّل المتصفح فعليًا.

    إعداد أفضل الممارسات:

    - مضيف Gateway يعمل دائمًا (VPS/Mac mini).
    - وكيل واحد لكل دور (bindings).
    - قناة أو قنوات Slack مرتبطة بتلك الوكلاء.
    - متصفح محلي عبر Chrome MCP أو Node عند الحاجة.

    الوثائق: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [Slack](/ar/channels/slack)،
    [المتصفح](/ar/tools/browser)، [Nodes](/ar/nodes).

  </Accordion>
</AccordionGroup>

## النماذج: الإعدادات الافتراضية، والاختيار، والأسماء المستعارة، والتبديل

<AccordionGroup>
  <Accordion title='ما هو "النموذج الافتراضي"؟'>
    النموذج الافتراضي في OpenClaw هو أي نموذج تضبطه على أنه:

    ```
    agents.defaults.model.primary
    ```

    يُشار إلى النماذج بصيغة `provider/model` (مثال: `openai/gpt-5.4`). وإذا حذفت اسم المزوّد، فإن OpenClaw تحاول أولًا اسمًا مستعارًا، ثم تطابقًا فريدًا لمزوّد مُكوَّن لذلك المعرّف الدقيق للنموذج، وبعد ذلك فقط تعود إلى المزوّد الافتراضي المكوَّن باعتباره مسار توافق قديمًا. وإذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المكوَّن، فإن OpenClaw تعود إلى أول مزود/نموذج مُكوَّن بدلًا من إظهار افتراضي قديم تابع لمزوّد تمت إزالته. ومع ذلك، ينبغي لك **ضبط `provider/model` صراحةً**.

  </Accordion>

  <Accordion title="ما النموذج الذي توصي به؟">
    **الإعداد الافتراضي الموصى به:** استخدم أقوى نموذج من أحدث جيل متاح في مجموعة مزوديك.
    **للوكلاء الممكَّنين بالأدوات أو المدخلات غير الموثوقة:** أعطِ أولوية لقوة النموذج على التكلفة.
    **للدردشة الروتينية/منخفضة المخاطر:** استخدم نماذج احتياطية أرخص ووجّه حسب دور الوكيل.

    لدى MiniMax وثائقه الخاصة: [MiniMax](/ar/providers/minimax) و
    [النماذج المحلية](/ar/gateway/local-models).

    القاعدة العامة: استخدم **أفضل نموذج يمكنك تحمله** للأعمال عالية المخاطر، واستخدم نموذجًا أرخص
    للدردشة الروتينية أو الملخصات. يمكنك توجيه النماذج لكل وكيل واستخدام الوكلاء الفرعيين من أجل
    موازاة المهام الطويلة (كل وكيل فرعي يستهلك رموزًا). راجع [النماذج](/ar/concepts/models) و
    [الوكلاء الفرعيون](/ar/tools/subagents).

    تحذير قوي: النماذج الأضعف/المفرطة في التكميم أكثر عرضة لحقن
    المطالبات والسلوك غير الآمن. راجع [الأمان](/ar/gateway/security).

    مزيد من السياق: [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="كيف أبدّل النماذج من دون مسح التكوين الخاص بي؟">
    استخدم **أوامر النماذج** أو عدّل حقول **النموذج** فقط. تجنب استبدال التكوين الكامل.

    الخيارات الآمنة:

    - `/model` في الدردشة (سريع، لكل جلسة)
    - `openclaw models set ...` (يحدّث تكوين النموذج فقط)
    - `openclaw configure --section model` (تفاعلي)
    - عدّل `agents.defaults.model` في `~/.openclaw/openclaw.json`

    تجنب `config.apply` مع كائن جزئي ما لم تكن تنوي استبدال التكوين كله.
    وبالنسبة إلى تعديلات RPC، افحص أولًا باستخدام `config.schema.lookup` وفضّل `config.patch`.
    توفّر لك حمولة lookup المسار المُطبّع، ووثائق/قيود المخطط السطحية، وملخصات الأبناء المباشرين
    للتحديثات الجزئية.
    وإذا كنت قد استبدلت التكوين بالفعل، فاستعده من نسخة احتياطية أو أعد تشغيل `openclaw doctor` للإصلاح.

    الوثائق: [النماذج](/ar/concepts/models)، [التهيئة](/cli/configure)، [التكوين](/cli/config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج مستضافة ذاتيًا (llama.cpp، vLLM، Ollama)؟">
    نعم. يُعد Ollama أسهل مسار للنماذج المحلية.

    أسرع إعداد:

    1. ثبّت Ollama من `https://ollama.com/download`
    2. اسحب نموذجًا محليًا مثل `ollama pull gemma4`
    3. إذا كنت تريد نماذج سحابية أيضًا، فشغّل `ollama signin`
    4. شغّل `openclaw onboard` واختر `Ollama`
    5. اختر `Local` أو `Cloud + Local`

    ملاحظات:

    - يمنحك `Cloud + Local` نماذج سحابية بالإضافة إلى نماذج Ollama المحلية
    - لا تحتاج النماذج السحابية مثل `kimi-k2.5:cloud` إلى سحب محلي
    - للتبديل اليدوي، استخدم `openclaw models list` و`openclaw models set ollama/<model>`

    ملاحظة أمنية: النماذج الأصغر أو المكممة بشكل كبير أكثر عرضة لحقن
    المطالبات. نوصي بشدة باستخدام **نماذج كبيرة** لأي روبوت يمكنه استخدام الأدوات.
    وإذا كنت لا تزال تريد نماذج صغيرة، ففعّل العزل وقوائم سماح صارمة للأدوات.

    الوثائق: [Ollama](/ar/providers/ollama)، [النماذج المحلية](/ar/gateway/local-models)،
    [مزودو النماذج](/ar/concepts/model-providers)، [الأمان](/ar/gateway/security)،
    [العزل](/ar/gateway/sandboxing).

  </Accordion>

  <Accordion title="ما النماذج التي يستخدمها OpenClaw وFlawd وKrill؟">
    - قد تختلف هذه البيئات وقد تتغير بمرور الوقت؛ لا توجد توصية ثابتة لمزوّد بعينه.
    - تحقّق من إعداد وقت التشغيل الحالي على كل Gateway باستخدام `openclaw models status`.
    - بالنسبة إلى الوكلاء الحساسين أمنيًا/الممكّنين بالأدوات، استخدم أقوى نموذج من أحدث جيل متاح.
  </Accordion>

  <Accordion title="كيف أبدّل النماذج أثناء التشغيل (من دون إعادة تشغيل)؟">
    استخدم الأمر `/model` بوصفه رسالة مستقلة:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    هذه هي الأسماء المستعارة المضمّنة. ويمكن إضافة أسماء مستعارة مخصصة عبر `agents.defaults.models`.

    يمكنك عرض النماذج المتاحة باستخدام `/model` أو `/model list` أو `/model status`.

    يعرض `/model` (و`/model list`) أداة اختيار مدمجة ومرقمة. اختر بالرقم:

    ```
    /model 3
    ```

    يمكنك أيضًا فرض ملف تعريف مصادقة محدد للمزوّد (لكل جلسة):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نصيحة: يعرض `/model status` الوكيل النشط، وملف `auth-profiles.json` المستخدم، وملف تعريف المصادقة الذي ستتم تجربته بعد ذلك.
    كما يعرض نقطة نهاية المزوّد المكوّنة (`baseUrl`) ووضع API (`api`) عند توفرهما.

    **كيف أُلغي تثبيت ملف تعريف ثبّتُّه باستخدام @profile؟**

    أعد تشغيل `/model` **من دون** اللاحقة `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    إذا كنت تريد العودة إلى الافتراضي، فاختره من `/model` (أو أرسل `/model <default provider/model>`).
    استخدم `/model status` للتأكد من ملف تعريف المصادقة النشط.

  </Accordion>

  <Accordion title="هل يمكنني استخدام GPT 5.2 للمهام اليومية وCodex 5.3 للبرمجة؟">
    نعم. اضبط أحدهما كافتراضي وبدّل عند الحاجة:

    - **تبديل سريع (لكل جلسة):** `/model gpt-5.4` للمهام اليومية، و`/model openai-codex/gpt-5.4` للبرمجة باستخدام Codex OAuth.
    - **افتراضي + تبديل:** اضبط `agents.defaults.model.primary` إلى `openai/gpt-5.4`، ثم بدّل إلى `openai-codex/gpt-5.4` عند البرمجة (أو العكس).
    - **الوكلاء الفرعيون:** وجّه مهام البرمجة إلى وكلاء فرعيين لديهم نموذج افتراضي مختلف.

    راجع [النماذج](/ar/concepts/models) و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أضبط الوضع السريع لـ GPT 5.4؟">
    استخدم إما تبديلًا لكل جلسة أو إعدادًا افتراضيًا في التكوين:

    - **لكل جلسة:** أرسل `/fast on` بينما تستخدم الجلسة `openai/gpt-5.4` أو `openai-codex/gpt-5.4`.
    - **افتراضي لكل نموذج:** اضبط `agents.defaults.models["openai/gpt-5.4"].params.fastMode` إلى `true`.
    - **Codex OAuth أيضًا:** إذا كنت تستخدم أيضًا `openai-codex/gpt-5.4`، فاضبط العلم نفسه هناك.

    مثال:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    بالنسبة إلى OpenAI، يُطابِق الوضع السريع `service_tier = "priority"` في طلبات Responses الأصلية المدعومة. وتتفوق تجاوزات `/fast` الخاصة بالجلسة على إعدادات التكوين الافتراضية.

    راجع [التفكير والوضع السريع](/ar/tools/thinking) و[الوضع السريع في OpenAI](/ar/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='لماذا أرى "Model ... is not allowed" ثم لا يصل أي رد؟'>
    إذا كان `agents.defaults.models` مضبوطًا، فإنه يصبح **قائمة السماح** لـ `/model` ولأي
    تجاوزات جلسة. ويؤدي اختيار نموذج غير موجود في تلك القائمة إلى إرجاع:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    ويُعاد هذا الخطأ **بدلًا من** رد عادي. الحل: أضف النموذج إلى
    `agents.defaults.models`، أو أزل قائمة السماح، أو اختر نموذجًا من `/model list`.

  </Accordion>

  <Accordion title='لماذا أرى "Unknown model: minimax/MiniMax-M2.7"؟'>
    هذا يعني أن **المزوّد غير مكوّن** (لم يُعثر على تكوين لمزوّد MiniMax أو على ملف
    تعريف مصادقة)، لذلك لا يمكن حل النموذج.

    قائمة تحقق للإصلاح:

    1. حدّث إلى إصدار OpenClaw حديث (أو شغّل من المصدر `main`)، ثم أعد تشغيل Gateway.
    2. تأكد من تكوين MiniMax (عبر المعالج أو JSON)، أو من وجود مصادقة MiniMax
       في env/ملفات تعريف المصادقة بحيث يمكن حقن المزوّد المطابق
       (`MINIMAX_API_KEY` لـ `minimax`، و`MINIMAX_OAUTH_TOKEN` أو مصادقة MiniMax
       OAuth المخزنة لـ `minimax-portal`).
    3. استخدم معرّف النموذج الدقيق (مع حساسية حالة الأحرف) لمسار المصادقة لديك:
       `minimax/MiniMax-M2.7` أو `minimax/MiniMax-M2.7-highspeed` لإعداد
       مفتاح API، أو `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` لإعداد OAuth.
    4. شغّل:

       ```bash
       openclaw models list
       ```

       واختر من القائمة (أو `/model list` في الدردشة).

    راجع [MiniMax](/ar/providers/minimax) و[النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام MiniMax كافتراضي وOpenAI للمهام المعقدة؟">
    نعم. استخدم **MiniMax كافتراضي** وبدّل النماذج **لكل جلسة** عند الحاجة.
    تستخدم النماذج الاحتياطية من أجل **الأخطاء**، وليس من أجل "المهام الصعبة"، لذا استخدم `/model` أو وكيلًا منفصلًا.

    **الخيار A: التبديل لكل جلسة**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    ثم:

    ```
    /model gpt
    ```

    **الخيار B: وكلاء منفصلون**

    - الوكيل A افتراضيه: MiniMax
    - الوكيل B افتراضيه: OpenAI
    - وجّه حسب الوكيل أو استخدم `/agent` للتبديل

    الوثائق: [النماذج](/ar/concepts/models)، [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [MiniMax](/ar/providers/minimax)، [OpenAI](/ar/providers/openai).

  </Accordion>

  <Accordion title="هل opus / sonnet / gpt اختصارات مضمّنة؟">
    نعم. يشحن OpenClaw بعض الاختصارات الافتراضية (ولا تُطبَّق إلا عندما يكون النموذج موجودًا في `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    إذا ضبطت اسمًا مستعارًا خاصًا بك بالاسم نفسه، فقيمتك هي التي تسود.

  </Accordion>

  <Accordion title="كيف أعرّف/أتجاوز اختصارات النماذج (الأسماء المستعارة)؟">
    تأتي الأسماء المستعارة من `agents.defaults.models.<modelId>.alias`. مثال:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    بعد ذلك، يحل `/model sonnet` (أو `/<alias>` عندما يكون مدعومًا) إلى معرّف ذلك النموذج.

  </Accordion>

  <Accordion title="كيف أضيف نماذج من مزودين آخرين مثل OpenRouter أو Z.AI؟">
    OpenRouter (الدفع حسب الرمز؛ نماذج كثيرة):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (نماذج GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    إذا أشرت إلى `provider/model` لكن مفتاح المزوّد المطلوب مفقود، فستحصل على خطأ مصادقة وقت التشغيل (مثل `No API key found for provider "zai"`).

    **لم يُعثر على مفتاح API للمزوّد بعد إضافة وكيل جديد**

    يعني هذا عادةً أن **الوكيل الجديد** لديه مخزن مصادقة فارغ. المصادقة تكون لكل وكيل
    وتُخزَّن في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    خيارات الإصلاح:

    - شغّل `openclaw agents add <id>` وقم بتكوين المصادقة أثناء المعالج.
    - أو انسخ `auth-profiles.json` من `agentDir` الخاص بالوكيل الرئيسي إلى `agentDir` الخاص بالوكيل الجديد.

    **لا** تعِد استخدام `agentDir` عبر وكلاء متعددين؛ فهذا يسبب تصادمات في المصادقة/الجلسات.

  </Accordion>
</AccordionGroup>

## التحويل التلقائي بين النماذج و"فشلت كل النماذج"

<AccordionGroup>
  <Accordion title="كيف يعمل التحويل التلقائي عند الفشل؟">
    يحدث التحويل التلقائي عند الفشل على مرحلتين:

    1. **تدوير ملفات تعريف المصادقة** داخل المزوّد نفسه.
    2. **النموذج الاحتياطي** إلى النموذج التالي في `agents.defaults.model.fallbacks`.

    تُطبَّق فترات تهدئة على ملفات التعريف الفاشلة (تراجع أسي)، بحيث يمكن لـ OpenClaw الاستمرار في الرد حتى عندما يكون أحد المزوّدين مقيّدًا بالمعدل أو متعطلًا مؤقتًا.

    تتضمن سلة حدود المعدل أكثر من مجرد استجابات `429` العادية. إذ تتعامل OpenClaw
    أيضًا مع رسائل مثل `Too many concurrent requests`،
    و`ThrottlingException`، و`concurrency limit reached`،
    و`workers_ai ... quota limit exceeded`، و`resource exhausted`، وحدود
    نوافذ الاستخدام الدورية (`weekly/monthly limit reached`) على أنها
    حدود معدلات تستحق التحويل التلقائي عند الفشل.

    بعض الاستجابات التي تبدو متعلقة بالفوترة ليست `402`، وبعض استجابات HTTP `402`
    تبقى أيضًا ضمن سلة الحالات المؤقتة. وإذا أعاد مزوّد
    نص فوترة صريحًا على `401` أو `403`، فلا يزال بإمكان OpenClaw إبقاؤه في
    مسار الفوترة، لكن مطابِقات النصوص الخاصة بالمزوّد تبقى محصورة في
    المزوّد الذي يملكها (مثل OpenRouter `Key limit exceeded`). وإذا بدت رسالة `402`
    بدلًا من ذلك كحد قابل لإعادة المحاولة متعلق بنافذة استخدام أو
    بحد إنفاق مؤسسة/مساحة عمل (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، فإن OpenClaw تتعامل معها على أنها
    `rate_limit`، وليس تعطيل فوترة طويل الأمد.

    تختلف أخطاء تجاوز السياق عن ذلك: فالتواقيع مثل
    `request_too_large`، و`input exceeds the maximum number of tokens`،
    و`input token count exceeds the maximum number of input tokens`،
    و`input is too long for the model`، أو `ollama error: context length
    exceeded` تبقى على مسار Compaction/إعادة المحاولة بدلًا من
    التقدم إلى النموذج الاحتياطي.

    النصوص العامة لأخطاء الخادم أضيق عمدًا من "أي شيء يحتوي على
    unknown/error". إذ تتعامل OpenClaw مع الأشكال العابرة الخاصة بالمزوّد
    مثل صيغة Anthropic المجردة `An unknown error occurred`، وصيغة OpenRouter المجردة
    `Provider returned error`، وأخطاء سبب الإيقاف مثل `Unhandled stop reason:
    error`، وحمولات JSON `api_error` ذات نصوص الخادم العابرة
    (`internal server error`، و`unknown error, 520`، و`upstream error`، و`backend
    error`)، وأخطاء انشغال المزوّد مثل `ModelNotReadyException` على أنها
    إشارات مهلة/تحميل زائد تستحق التحويل التلقائي عند الفشل عندما يتطابق
    سياق المزوّد.
    أما نص الرجوع الاحتياطي الداخلي العام مثل `LLM request failed with an unknown
    error.` فيبقى محافظًا ولا يفعّل التحويل إلى نموذج احتياطي بمفرده.

  </Accordion>

  <Accordion title='ما معنى "No credentials found for profile anthropic:default"؟'>
    يعني هذا أن النظام حاول استخدام معرّف ملف تعريف المصادقة `anthropic:default`، لكنه لم يتمكن من العثور على بيانات اعتماد له في مخزن المصادقة المتوقع.

    **قائمة تحقق للإصلاح:**

    - **أكد مكان وجود ملفات تعريف المصادقة** (المسارات الجديدة مقابل القديمة)
      - الحالي: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - القديم: `~/.openclaw/agent/*` (يُرحَّل بواسطة `openclaw doctor`)
    - **أكد أن متغير البيئة لديك محمّل بواسطة Gateway**
      - إذا ضبطت `ANTHROPIC_API_KEY` في صدفتك لكنك تشغّل Gateway عبر systemd/launchd، فقد لا يرثه. ضعه في `~/.openclaw/.env` أو فعّل `env.shellEnv`.
    - **تأكد من أنك تعدّل الوكيل الصحيح**
      - تعني إعدادات الوكلاء المتعددين أنه قد تكون هناك عدة ملفات `auth-profiles.json`.
    - **تحقق سريعًا من حالة النموذج/المصادقة**
      - استخدم `openclaw models status` لرؤية النماذج المكوّنة وما إذا كان المزوّدون مصادقين.

    **قائمة تحقق للإصلاح لعبارة "No credentials found for profile anthropic"**

    يعني هذا أن التشغيل مثبّت على ملف تعريف مصادقة Anthropic، لكن Gateway
    لا تستطيع العثور عليه في مخزن المصادقة لديها.

    - **استخدم Claude CLI**
      - شغّل `openclaw models auth login --provider anthropic --method cli --set-default` على مضيف Gateway.
    - **إذا كنت تريد استخدام مفتاح API بدلًا من ذلك**
      - ضع `ANTHROPIC_API_KEY` في `~/.openclaw/.env` على **مضيف Gateway**.
      - امسح أي ترتيب مثبّت يفرض ملف تعريف مفقودًا:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **أكد أنك تشغّل الأوامر على مضيف Gateway**
      - في الوضع البعيد، تعيش ملفات تعريف المصادقة على جهاز Gateway، وليس على حاسوبك المحمول.

  </Accordion>

  <Accordion title="لماذا حاول أيضًا Google Gemini وفشل؟">
    إذا كان تكوين النموذج لديك يتضمن Google Gemini كنموذج احتياطي (أو إذا بدّلت إلى اختصار Gemini)، فستحاول OpenClaw استخدامه أثناء التحويل إلى النموذج الاحتياطي. وإذا لم تكن قد كوّنت بيانات اعتماد Google، فسترى `No API key found for provider "google"`.

    الحل: إما أن توفّر مصادقة Google، أو تزيل/تتجنب نماذج Google في `agents.defaults.model.fallbacks` / الأسماء المستعارة حتى لا يتجه التحويل الاحتياطي إليها.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    السبب: يحتوي سجل الجلسة على **كتل thinking بلا تواقيع** (غالبًا من
    تدفق متوقف/جزئي). يتطلب Google Antigravity وجود تواقيع لكتل thinking.

    الحل: تقوم OpenClaw الآن بإزالة كتل thinking غير الموقّعة من Google Antigravity Claude. وإذا استمرت المشكلة في الظهور، فابدأ **جلسة جديدة** أو اضبط `/thinking off` لهذا الوكيل.

  </Accordion>
</AccordionGroup>

## ملفات تعريف المصادقة: ما هي وكيفية إدارتها

ذو صلة: [/concepts/oauth](/ar/concepts/oauth) (تدفقات OAuth، وتخزين الرموز المميزة، وأنماط الحسابات المتعددة)

<AccordionGroup>
  <Accordion title="ما هو ملف تعريف المصادقة؟">
    ملف تعريف المصادقة هو سجل بيانات اعتماد مسمّى (OAuth أو مفتاح API) مرتبط بمزوّد. تعيش ملفات التعريف في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="ما هي معرّفات ملفات التعريف النموذجية؟">
    تستخدم OpenClaw معرّفات مسبوقة بالمزوّد مثل:

    - `anthropic:default` (شائع عند عدم وجود هوية بريد إلكتروني)
    - `anthropic:<email>` لهويات OAuth
    - المعرّفات المخصصة التي تختارها (مثل `anthropic:work`)

  </Accordion>

  <Accordion title="هل يمكنني التحكم في ملف تعريف المصادقة الذي تتم تجربته أولًا؟">
    نعم. يدعم التكوين بيانات وصفية اختيارية لملفات التعريف وترتيبًا لكل مزوّد (`auth.order.<provider>`). وهذا **لا** يخزن الأسرار؛ بل يربط المعرّفات بالمزوّد/الوضع ويضبط ترتيب التدوير.

    قد تتخطى OpenClaw مؤقتًا ملف تعريف إذا كان في **فترة تهدئة** قصيرة (حدود معدل/مهل/إخفاقات مصادقة) أو في حالة **تعطيل** أطول (فوترة/رصيد غير كافٍ). لفحص هذا، شغّل `openclaw models status --json` وتحقق من `auth.unusableProfiles`. الضبط: `auth.cooldowns.billingBackoffHours*`.

    يمكن أن تكون فترات التهدئة الخاصة بحدود المعدل محصورة بنموذج معين. فقد يكون ملف تعريف في فترة تهدئة
    لنموذج واحد بينما يظل قابلًا للاستخدام لنموذج شقيق على المزوّد نفسه،
    في حين أن نوافذ الفوترة/التعطيل ما تزال تحجب ملف التعريف كله.

    يمكنك أيضًا ضبط تجاوز ترتيب **لكل وكيل** (مخزن في `auth-state.json` الخاص بذلك الوكيل) عبر CLI:

    ```bash
    # تكون القيمة الافتراضية هي الوكيل الافتراضي المكوّن (احذف --agent)
    openclaw models auth order get --provider anthropic

    # ثبّت التدوير على ملف تعريف واحد (جرّب هذا فقط)
    openclaw models auth order set --provider anthropic anthropic:default

    # أو اضبط ترتيبًا صريحًا (رجوع احتياطي داخل المزوّد)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # امسح التجاوز (الرجوع إلى config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    لاستهداف وكيل محدد:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    وللتحقق مما ستتم تجربته فعليًا، استخدم:

    ```bash
    openclaw models status --probe
    ```

    إذا حُذف ملف تعريف مخزن من الترتيب الصريح، فسيبلغ probe
    عن `excluded_by_auth_order` لذلك الملف بدلًا من تجربته بصمت.

  </Accordion>

  <Accordion title="OAuth مقابل مفتاح API - ما الفرق؟">
    يدعم OpenClaw كليهما:

    - **OAuth** يستفيد غالبًا من وصول الاشتراك (عند الاقتضاء).
    - **مفاتيح API** تستخدم فوترة الدفع حسب الرمز.

    يدعم المعالج صراحةً Anthropic Claude CLI، وOpenAI Codex OAuth، ومفاتيح API.

  </Accordion>
</AccordionGroup>

## Gateway: المنافذ، و"قيد التشغيل بالفعل"، والوضع البعيد

<AccordionGroup>
  <Accordion title="ما المنفذ الذي تستخدمه Gateway؟">
    يتحكم `gateway.port` في المنفذ المتعدد الوحيد لـ WebSocket + HTTP (Control UI، وhooks، وما إلى ذلك).

    ترتيب الأولوية:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='لماذا يقول openclaw gateway status "Runtime: running" لكنه يقول "RPC probe: failed"؟'>
    لأن "running" هو منظور **المشرف** (launchd/systemd/schtasks). أما RPC probe فهو قيام CLI فعليًا بالاتصال بـ Gateway WebSocket واستدعاء `status`.

    استخدم `openclaw gateway status` وصدّق هذه الأسطر:

    - `Probe target:` (عنوان URL الذي استخدمه probe فعليًا)
    - `Listening:` (ما هو مربوط فعليًا على المنفذ)
    - `Last gateway error:` (السبب الجذري الشائع عندما تكون العملية حية لكن المنفذ لا يستمع)

  </Accordion>

  <Accordion title='لماذا يعرض openclaw gateway status قيمًا مختلفة لـ "Config (cli)" و"Config (service)"؟'>
    أنت تعدّل ملف تكوين واحدًا بينما تقوم الخدمة بتشغيل ملف آخر (غالبًا بسبب عدم تطابق `--profile` / `OPENCLAW_STATE_DIR`).

    الحل:

    ```bash
    openclaw gateway install --force
    ```

    شغّل ذلك من `--profile` / البيئة نفسها التي تريد أن تستخدمها الخدمة.

  </Accordion>

  <Accordion title='ما معنى "another gateway instance is already listening"؟'>
    يفرض OpenClaw قفلًا في وقت التشغيل من خلال ربط مستمع WebSocket فورًا عند بدء التشغيل (الافتراضي `ws://127.0.0.1:18789`). وإذا فشل الربط بسبب `EADDRINUSE`، فإنه يطرح `GatewayLockError` مشيرًا إلى أن نسخة أخرى تستمع بالفعل.

    الحل: أوقف النسخة الأخرى، أو حرّر المنفذ، أو شغّل باستخدام `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="كيف أشغّل OpenClaw في الوضع البعيد (يتصل العميل بـ Gateway في مكان آخر)؟">
    اضبط `gateway.mode: "remote"` ووجّه إلى عنوان URL بعيد لـ WebSocket، مع بيانات اعتماد بعيدة shared-secret اختيارية:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    ملاحظات:

    - لا يبدأ `openclaw gateway` إلا عندما تكون `gateway.mode` مساوية لـ `local` (أو عند تمرير علم التجاوز).
    - يراقب تطبيق macOS ملف التكوين ويبدّل الأوضاع مباشرةً عند تغير هذه القيم.
    - إن `gateway.remote.token` / `.password` هي بيانات اعتماد بعيدة على جانب العميل فقط؛ ولا تمكّن مصادقة Gateway المحلية بمفردها.

  </Accordion>

  <Accordion title='تقول Control UI "unauthorized" (أو تستمر في إعادة الاتصال). ماذا الآن؟'>
    لا يتطابق مسار مصادقة Gateway لديك مع طريقة المصادقة في واجهة المستخدم.

    حقائق (من الشيفرة):

    - تحتفظ Control UI بالرمز المميز في `sessionStorage` لجلسة علامة تبويب المتصفح الحالية وعنوان URL المحدد لـ Gateway، لذلك تستمر تحديثات علامة التبويب نفسها في العمل من دون استعادة استمرارية رمز localStorage طويلة الأمد.
    - عند `AUTH_TOKEN_MISMATCH`، يمكن للعملاء الموثوقين محاولة إعادة واحدة محدودة باستخدام رمز جهاز مخزن مؤقتًا عندما تعيد Gateway تلميحات إعادة المحاولة (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - تعيد إعادة المحاولة بهذا الرمز المخزن الآن استخدام النطاقات المعتمدة المخزنة مع رمز الجهاز. أما مستدعيات `deviceToken` الصريحة / `scopes` الصريحة فتحتفظ بمجموعة النطاقات المطلوبة بدلًا من وراثة النطاقات المخزنة.
    - خارج مسار إعادة المحاولة هذا، يكون ترتيب أولوية مصادقة الاتصال هو: رمز/كلمة مرور مشتركان صريحان أولًا، ثم `deviceToken` صريح، ثم رمز جهاز مخزن، ثم رمز bootstrap.
    - تكون فحوصات نطاق رمز bootstrap مسبوقة بالدور. ولا تلبّي قائمة السماح المضمّنة لمشغلي bootstrap سوى طلبات المشغل؛ أما أدوار node أو غيرها من الأدوار غير المشغِّلة فما تزال تحتاج إلى نطاقات تحت بادئة دورها الخاصة.

    الحل:

    - الأسرع: `openclaw dashboard` (يطبع + ينسخ عنوان URL الخاص بلوحة التحكم، ويحاول فتحه؛ ويعرض تلميح SSH إذا كان headless).
    - إذا لم يكن لديك رمز مميز بعد: `openclaw doctor --generate-gateway-token`.
    - إذا كان بعيدًا، فأنشئ نفقًا أولًا: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`.
    - وضع shared-secret: اضبط `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`، ثم ألصق السر المطابق في إعدادات Control UI.
    - وضع Tailscale Serve: تأكد من تمكين `gateway.auth.allowTailscale` وأنك تفتح عنوان URL الخاص بـ Serve، وليس عنوان loopback/tailnet خامًا يتجاوز ترويسات هوية Tailscale.
    - وضع trusted-proxy: تأكد من أنك تمر عبر الوكيل غير loopback والمدرك للهوية والمكوّن، وليس عبر وكيل loopback على المضيف نفسه أو عنوان URL خام لـ Gateway.
    - إذا استمر عدم التطابق بعد إعادة المحاولة الواحدة، فقم بتدوير/إعادة اعتماد رمز الجهاز المقترن:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - إذا كانت مكالمة rotate تقول إنها رُفضت، فتحقق من أمرين:
      - يمكن لجلسات الأجهزة المقترنة تدوير **جهازها الخاص فقط** ما لم تكن لديها أيضًا `operator.admin`
      - لا يمكن لقيم `--scope` الصريحة أن تتجاوز نطاقات المشغل الحالية لدى المستدعي
    - ما زلت عالقًا؟ شغّل `openclaw status --all` واتبع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). راجع [لوحة التحكم](/web/dashboard) لتفاصيل المصادقة.

  </Accordion>

  <Accordion title="لقد ضبطت gateway.bind tailnet لكنه لا يستطيع الربط ولا يوجد شيء يستمع">
    يختار ربط `tailnet` عنوان IP من Tailscale من واجهات الشبكة لديك (100.64.0.0/10). وإذا لم يكن الجهاز على Tailscale (أو كانت الواجهة متوقفة)، فلن يوجد شيء يمكن الربط إليه.

    الحل:

    - شغّل Tailscale على ذلك المضيف (حتى يحصل على عنوان 100.x)، أو
    - بدّل إلى `gateway.bind: "loopback"` / `"lan"`.

    ملاحظة: `tailnet` صريح. يفضّل `auto` ‏loopback؛ استخدم `gateway.bind: "tailnet"` عندما تريد ربطًا خاصًا بـ tailnet فقط.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة Gateways على المضيف نفسه؟">
    عادةً لا - يمكن لـ Gateway واحدة تشغيل عدة قنوات مراسلة ووكلاء. استخدم Gateways متعددة فقط عندما تحتاج إلى التكرار (مثل: روبوت إنقاذ) أو إلى عزل صارم.

    نعم، لكن يجب عليك عزل:

    - `OPENCLAW_CONFIG_PATH` (تكوين لكل نسخة)
    - `OPENCLAW_STATE_DIR` (حالة لكل نسخة)
    - `agents.defaults.workspace` (عزل مساحة العمل)
    - `gateway.port` (منافذ فريدة)

    إعداد سريع (موصى به):

    - استخدم `openclaw --profile <name> ...` لكل نسخة (ينشئ تلقائيًا `~/.openclaw-<name>`).
    - اضبط `gateway.port` فريدًا في تكوين كل ملف تعريف (أو مرّر `--port` للتشغيل اليدوي).
    - ثبّت خدمة لكل ملف تعريف: `openclaw --profile <name> gateway install`.

    تضيف ملفات التعريف أيضًا لاحقات إلى أسماء الخدمات (`ai.openclaw.<profile>`؛ والإرث `com.openclaw.*`، و`openclaw-gateway-<profile>.service`، و`OpenClaw Gateway (<profile>)`).
    الدليل الكامل: [Gateways متعددة](/ar/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='ما معنى "invalid handshake" / الرمز 1008؟'>
    إن Gateway هي **خادم WebSocket**، وهي تتوقع أن تكون أول رسالة على الإطلاق
    إطار `connect`. وإذا تلقت أي شيء آخر، فإنها تغلق الاتصال
    باستخدام **الرمز 1008** (مخالفة للسياسة).

    الأسباب الشائعة:

    - فتحت عنوان URL لـ **HTTP** في متصفح (`http://...`) بدلًا من عميل WS.
    - استخدمت المنفذ أو المسار الخطأ.
    - قام وكيل أو نفق بإزالة ترويسات المصادقة أو أرسل طلبًا ليس خاصًا بـ Gateway.

    إصلاحات سريعة:

    1. استخدم عنوان URL لـ WS: `ws://<host>:18789` (أو `wss://...` إذا كان HTTPS).
    2. لا تفتح منفذ WS في علامة تبويب متصفح عادية.
    3. إذا كانت المصادقة مفعلة، فضمّن الرمز المميز/كلمة المرور في إطار `connect`.

    إذا كنت تستخدم CLI أو TUI، فيجب أن يبدو عنوان URL كما يلي:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    تفاصيل البروتوكول: [بروتوكول Gateway](/ar/gateway/protocol).

  </Accordion>
</AccordionGroup>

## التسجيل والتصحيح

<AccordionGroup>
  <Accordion title="أين توجد السجلات؟">
    سجلات الملفات (منظمة):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    يمكنك ضبط مسار ثابت عبر `logging.file`. ويُتحكم في مستوى سجل الملف عبر `logging.level`. أما درجة تفصيل وحدة التحكم فتُتحكم فيها عبر `--verbose` و`logging.consoleLevel`.

    أسرع طريقة لتتبّع السجل:

    ```bash
    openclaw logs --follow
    ```

    سجلات الخدمة/المشرف (عندما تعمل Gateway عبر launchd/systemd):

    - macOS: ‏`$OPENCLAW_STATE_DIR/logs/gateway.log` و`gateway.err.log` (الافتراضي: `~/.openclaw/logs/...`؛ وتستخدم ملفات التعريف `~/.openclaw-<profile>/logs/...`)
    - Linux: ‏`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: ‏`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    راجع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting) للمزيد.

  </Accordion>

  <Accordion title="كيف أبدأ/أوقف/أعيد تشغيل خدمة Gateway؟">
    استخدم أدوات Gateway المساعدة:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا كنت تشغّل Gateway يدويًا، فإن `openclaw gateway --force` يمكنه استعادة المنفذ. راجع [Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="أغلقت الطرفية على Windows - كيف أعيد تشغيل OpenClaw؟">
    هناك **وضعان للتثبيت على Windows**:

    **1) WSL2 (موصى به):** تعمل Gateway داخل Linux.

    افتح PowerShell، وادخل إلى WSL، ثم أعد التشغيل:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا لم تكن قد ثبّت الخدمة مطلقًا، فابدأها في الواجهة الأمامية:

    ```bash
    openclaw gateway run
    ```

    **2) Windows الأصلي (غير موصى به):** تعمل Gateway مباشرةً في Windows.

    افتح PowerShell وشغّل:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا كنت تشغّلها يدويًا (من دون خدمة)، فاستخدم:

    ```powershell
    openclaw gateway run
    ```

    الوثائق: [Windows (WSL2)](/ar/platforms/windows)، [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="Gateway تعمل لكن الردود لا تصل أبدًا. ما الذي ينبغي أن أتحقق منه؟">
    ابدأ بمسح سريع للحالة الصحية:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    الأسباب الشائعة:

    - لم تُحمَّل مصادقة النموذج على **مضيف Gateway** (تحقق من `models status`).
    - يقف اقتران القناة/قائمة السماح في وجه الردود (تحقق من تكوين القناة + السجلات).
    - WebChat/لوحة التحكم مفتوحة من دون الرمز المميز الصحيح.

    إذا كنت في الوضع البعيد، فتأكد من أن اتصال النفق/Tailscale قائم وأن
    Gateway WebSocket قابلة للوصول.

    الوثائق: [القنوات](/ar/channels)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)، [الوصول عن بُعد](/ar/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - ماذا الآن؟'>
    يعني هذا عادةً أن واجهة المستخدم فقدت اتصال WebSocket. تحقق من:

    1. هل تعمل Gateway؟ `openclaw gateway status`
    2. هل Gateway سليمة؟ `openclaw status`
    3. هل تمتلك واجهة المستخدم الرمز المميز الصحيح؟ `openclaw dashboard`
    4. إذا كانت بعيدة، فهل وصلة النفق/Tailscale قائمة؟

    ثم تتبّع السجلات:

    ```bash
    openclaw logs --follow
    ```

    الوثائق: [لوحة التحكم](/web/dashboard)، [الوصول عن بُعد](/ar/gateway/remote)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

  </Accordion>

  <Accordion title="يفشل Telegram setMyCommands. ما الذي ينبغي أن أتحقق منه؟">
    ابدأ بالسجلات وحالة القناة:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    ثم طابق الخطأ:

    - `BOT_COMMANDS_TOO_MUCH`: تحتوي قائمة Telegram على عدد كبير جدًا من الإدخالات. تقوم OpenClaw بالفعل بالاقتصاص إلى حد Telegram وتعيد المحاولة بعدد أقل من الأوامر، لكن بعض إدخالات القائمة ما تزال بحاجة إلى الإسقاط. قلّل أوامر Plugin/Skill/الأوامر المخصصة، أو عطّل `channels.telegram.commands.native` إذا لم تكن بحاجة إلى القائمة.
    - `TypeError: fetch failed`، أو `Network request for 'setMyCommands' failed!`، أو أخطاء شبكة مشابهة: إذا كنت على VPS أو خلف وكيل، فتأكد من أن HTTPS الصادر مسموح وأن DNS يعمل لـ `api.telegram.org`.

    إذا كانت Gateway بعيدة، فتأكد من أنك تنظر إلى السجلات على مضيف Gateway.

    الوثائق: [Telegram](/ar/channels/telegram)، [استكشاف أخطاء القنوات](/ar/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI لا يعرض أي مخرجات. ما الذي ينبغي أن أتحقق منه؟">
    أكد أولًا أن Gateway قابلة للوصول وأن الوكيل يمكنه التشغيل:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    في TUI، استخدم `/status` لمعرفة الحالة الحالية. وإذا كنت تتوقع وصول الردود في قناة دردشة،
    فتأكد من تمكين التسليم (`/deliver on`).

    الوثائق: [TUI](/web/tui)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أوقف Gateway تمامًا ثم أبدأها؟">
    إذا كنت قد ثبّت الخدمة:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    يوقف/يبدأ هذا **الخدمة الخاضعة للإشراف** (launchd على macOS، وsystemd على Linux).
    استخدم هذا عندما تعمل Gateway في الخلفية كعملية خدمية.

    إذا كنت تشغّلها في الواجهة الأمامية، فأوقفها باستخدام Ctrl-C، ثم:

    ```bash
    openclaw gateway run
    ```

    الوثائق: [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="اشرحها ببساطة: openclaw gateway restart مقابل openclaw gateway">
    - `openclaw gateway restart`: يعيد تشغيل **الخدمة الخلفية** (launchd/systemd).
    - `openclaw gateway`: يشغّل Gateway **في الواجهة الأمامية** لهذه الجلسة الطرفية.

    إذا كنت قد ثبّت الخدمة، فاستخدم أوامر Gateway. واستخدم `openclaw gateway` عندما
    تريد تشغيلًا لمرة واحدة في الواجهة الأمامية.

  </Accordion>

  <Accordion title="أسرع طريقة للحصول على مزيد من التفاصيل عند فشل شيء ما">
    ابدأ Gateway باستخدام `--verbose` للحصول على مزيد من التفاصيل في وحدة التحكم. ثم افحص ملف السجل بحثًا عن مصادقة القناة، وتوجيه النموذج، وأخطاء RPC.
  </Accordion>
</AccordionGroup>

## الوسائط والمرفقات

<AccordionGroup>
  <Accordion title="ولّدت Skill صورة/PDF، لكن لم يُرسل شيء">
    يجب أن تتضمن المرفقات الصادرة من الوكيل سطر `MEDIA:<path-or-url>` (في سطر مستقل). راجع [إعداد مساعد OpenClaw](/ar/start/openclaw) و[إرسال الوكيل](/ar/tools/agent-send).

    الإرسال عبر CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    تحقق أيضًا من:

    - أن القناة المستهدفة تدعم الوسائط الصادرة وليست محجوبة بقوائم السماح.
    - أن الملف ضمن حدود الحجم الخاصة بالمزوّد (تُعاد تحجيم الصور إلى حد أقصى 2048px).
    - يقيّد `tools.fs.workspaceOnly=true` عمليات الإرسال عبر المسار المحلي بحدود مساحة العمل، وtemp/media-store، والملفات التي تم التحقق منها ضمن sandbox.
    - يسمح `tools.fs.workspaceOnly=false` لـ `MEDIA:` بإرسال الملفات المحلية على المضيف التي يستطيع الوكيل قراءتها بالفعل، ولكن فقط للوسائط بالإضافة إلى أنواع المستندات الآمنة (الصور، والصوت، والفيديو، وPDF، ومستندات Office). وما تزال الملفات النصية العادية والملفات الشبيهة بالأسرار محجوبة.

    راجع [الصور](/ar/nodes/images).

  </Accordion>
</AccordionGroup>

## الأمان والتحكم في الوصول

<AccordionGroup>
  <Accordion title="هل من الآمن كشف OpenClaw للرسائل الخاصة الواردة؟">
    تعامل مع الرسائل الخاصة الواردة بوصفها مدخلات غير موثوقة. صُممت الإعدادات الافتراضية لتقليل المخاطر:

    - السلوك الافتراضي على القنوات القادرة على الرسائل الخاصة هو **الاقتران**:
      - يتلقى المرسلون غير المعروفين رمز اقتران؛ ولا يعالج الروبوت رسالتهم.
      - وافق باستخدام: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - تُحدد الطلبات المعلقة بحد أقصى **3 لكل قناة**؛ تحقق من `openclaw pairing list --channel <channel> [--account <id>]` إذا لم يصل الرمز.
    - يتطلب فتح الرسائل الخاصة علنًا موافقة صريحة (`dmPolicy: "open"` وقائمة السماح `"*"`).

    شغّل `openclaw doctor` لإظهار سياسات الرسائل الخاصة المحفوفة بالمخاطر.

  </Accordion>

  <Accordion title="هل يُعد حقن المطالبات مصدر قلق للروبوتات العامة فقط؟">
    لا. يتعلق حقن المطالبات بـ **المحتوى غير الموثوق**، وليس فقط بمن يستطيع إرسال رسالة خاصة إلى الروبوت.
    فإذا كان مساعدك يقرأ محتوى خارجيًا (بحث/جلب الويب، وصفحات المتصفح، ورسائل البريد الإلكتروني،
    والمستندات، والمرفقات، والسجلات الملصقة)، فقد يتضمن ذلك المحتوى تعليمات تحاول
    اختطاف النموذج. ويمكن أن يحدث هذا حتى لو كنت **أنت المرسل الوحيد**.

    يكمن الخطر الأكبر عند تمكين الأدوات: إذ يمكن خداع النموذج لكي
    يسرّب السياق أو يستدعي الأدوات نيابةً عنك. قلّل مساحة الضرر عبر:

    - استخدام وكيل "قارئ" للقراءة فقط أو معطَّل الأدوات لتلخيص المحتوى غير الموثوق
    - إبقاء `web_search` / `web_fetch` / `browser` معطّلة للوكلاء الممكَّنين بالأدوات
    - معاملة النص المفكوك من الملفات/المستندات على أنه غير موثوق أيضًا: يقوم OpenResponses
      `input_file` واستخراج نص المرفقات الوسائطية كلاهما بتغليف النص المستخرج داخل
      علامات حدود صريحة للمحتوى الخارجي بدلًا من تمرير نص الملف الخام
    - العزل وقوائم السماح الصارمة للأدوات

    التفاصيل: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل ينبغي أن يمتلك الروبوت بريده الإلكتروني الخاص أو حساب GitHub أو رقم هاتفه الخاص؟">
    نعم، في معظم الإعدادات. إن عزل الروبوت بحسابات وأرقام هواتف منفصلة
    يقلل مساحة الضرر إذا حدث خطأ ما. كما يجعل ذلك تدوير
    بيانات الاعتماد أو إلغاء الوصول أسهل من دون التأثير على حساباتك الشخصية.

    ابدأ على نطاق صغير. امنح الوصول فقط إلى الأدوات والحسابات التي تحتاجها فعلًا، ثم وسّع
    لاحقًا إذا لزم الأمر.

    الوثائق: [الأمان](/ar/gateway/security)، [الاقتران](/ar/channels/pairing).

  </Accordion>

  <Accordion title="هل يمكنني منحه استقلالية على رسائلي النصية وهل هذا آمن؟">
    نحن **لا** نوصي بالاستقلالية الكاملة على رسائلك الشخصية. النمط الأكثر أمانًا هو:

    - أبقِ الرسائل الخاصة في **وضع الاقتران** أو ضمن قائمة سماح محكمة.
    - استخدم **رقمًا أو حسابًا منفصلًا** إذا كنت تريد منه المراسلة نيابةً عنك.
    - دعه يصوغ، ثم **وافق قبل الإرسال**.

    إذا كنت تريد التجربة، فافعل ذلك على حساب مخصص وأبقِه معزولًا. راجع
    [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج أرخص لمهام المساعد الشخصي؟">
    نعم، **إذا** كان الوكيل مخصصًا للدردشة فقط وكانت المدخلات موثوقة. الفئات الأصغر
    أكثر عرضة لاختطاف التعليمات، لذا تجنبها للوكلاء الممكَّنين بالأدوات
    أو عند قراءة محتوى غير موثوق. وإذا كان لا بد من استخدام نموذج أصغر، فأحكم
    الأدوات وشغّله داخل sandbox. راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="قمت بتشغيل /start في Telegram لكنني لم أتلق رمز اقتران">
    تُرسل رموز الاقتران **فقط** عندما يرسل مرسل غير معروف رسالة إلى الروبوت ويكون
    `dmPolicy: "pairing"` مفعّلًا. لا يؤدي `/start` وحده إلى إنشاء رمز.

    تحقق من الطلبات المعلقة:

    ```bash
    openclaw pairing list telegram
    ```

    إذا كنت تريد وصولًا فوريًا، فأضف معرّف المرسل إلى قائمة السماح أو اضبط `dmPolicy: "open"`
    لذلك الحساب.

  </Accordion>

  <Accordion title="WhatsApp: هل سيراسل جهات اتصالي؟ كيف يعمل الاقتران؟">
    لا. سياسة الرسائل الخاصة الافتراضية في WhatsApp هي **الاقتران**. يتلقى المرسلون غير المعروفين رمز اقتران فقط ولا **تُعالَج** رسالتهم. لا يرد OpenClaw إلا على الدردشات التي يتلقاها أو على عمليات الإرسال الصريحة التي تقوم أنت بتشغيلها.

    وافق على الاقتران باستخدام:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    اعرض الطلبات المعلقة:

    ```bash
    openclaw pairing list whatsapp
    ```

    مطالبة رقم الهاتف في المعالج: تُستخدم لضبط **قائمة السماح/المالك** الخاصة بك بحيث تكون رسائلك الخاصة المرسلة من حسابك مسموحًا بها. ولا تُستخدم للإرسال التلقائي. وإذا كنت تشغّل على رقم WhatsApp الشخصي لديك، فاستخدم ذلك الرقم وفعّل `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## أوامر الدردشة، وإيقاف المهام، و"لن يتوقف"

<AccordionGroup>
  <Accordion title="كيف أوقف ظهور رسائل النظام الداخلية في الدردشة؟">
    لا تظهر معظم الرسائل الداخلية أو رسائل الأدوات إلا عندما يكون **verbose** أو **trace** أو **reasoning** مفعّلًا
    لتلك الجلسة.

    أصلح ذلك في الدردشة التي ترى فيها المشكلة:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    إذا ظلت مزعجة، فتحقق من إعدادات الجلسة في Control UI واضبط verbose
    على **inherit**. وتأكد أيضًا من أنك لا تستخدم ملف تعريف روبوت مع `verboseDefault` مضبوط
    على `on` في التكوين.

    الوثائق: [التفكير وverbose](/ar/tools/thinking)، [الأمان](/ar/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="كيف أوقف/ألغي مهمة قيد التشغيل؟">
    أرسل أيًا مما يلي **بوصفه رسالة مستقلة** (من دون شرطة مائلة):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    هذه محفزات إيقاف، وليست أوامر بشرطة مائلة.

    بالنسبة إلى العمليات الخلفية (من أداة exec)، يمكنك أن تطلب من الوكيل تشغيل:

    ```
    process action:kill sessionId:XXX
    ```

    لمحة عامة عن الأوامر ذات الشرطة المائلة: راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

    يجب إرسال معظم الأوامر بوصفها رسالة **مستقلة** تبدأ بـ `/`، لكن بعض الاختصارات القليلة (مثل `/status`) تعمل أيضًا ضمن الرسالة للمرسلين الموجودين في قائمة السماح.

  </Accordion>

  <Accordion title='كيف أرسل رسالة Discord من Telegram؟ ("Cross-context messaging denied")'>
    يمنع OpenClaw المراسلة **عبر المزوّدات** افتراضيًا. فإذا كانت أداة استدعاء مرتبطة
    بـ Telegram، فلن ترسل إلى Discord ما لم تسمح بذلك صراحةً.

    فعّل المراسلة عبر المزوّدات لهذا الوكيل:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    أعد تشغيل Gateway بعد تعديل التكوين.

  </Accordion>

  <Accordion title='لماذا يبدو أن الروبوت "يتجاهل" الرسائل السريعة المتتابعة؟'>
    يتحكم وضع الطابور في كيفية تفاعل الرسائل الجديدة مع تشغيل جارٍ. استخدم `/queue` لتغيير الأوضاع:

    - `steer` - تعيد الرسائل الجديدة توجيه المهمة الحالية
    - `followup` - تشغيل الرسائل واحدة تلو الأخرى
    - `collect` - تجميع الرسائل والرد مرة واحدة (الافتراضي)
    - `steer-backlog` - إعادة التوجيه الآن، ثم معالجة التراكم
    - `interrupt` - إيقاف التشغيل الحالي وبدء تشغيل جديد

    يمكنك إضافة خيارات مثل `debounce:2s cap:25 drop:summarize` لأوضاع المتابعة.

  </Accordion>
</AccordionGroup>

## متفرقات

<AccordionGroup>
  <Accordion title='ما النموذج الافتراضي لـ Anthropic عند استخدام مفتاح API؟'>
    في OpenClaw، تكون بيانات الاعتماد واختيار النموذج أمرين منفصلين. يؤدي ضبط `ANTHROPIC_API_KEY` (أو تخزين مفتاح Anthropic API في ملفات تعريف المصادقة) إلى تمكين المصادقة، لكن النموذج الافتراضي الفعلي هو أي نموذج تقوم بتكوينه في `agents.defaults.model.primary` (مثل `anthropic/claude-sonnet-4-6` أو `anthropic/claude-opus-4-6`). وإذا رأيت `No credentials found for profile "anthropic:default"`، فهذا يعني أن Gateway لم تتمكن من العثور على بيانات اعتماد Anthropic في ملف `auth-profiles.json` المتوقع للوكيل الذي يعمل.
  </Accordion>
</AccordionGroup>

---

ما زلت عالقًا؟ اسأل في [Discord](https://discord.com/invite/clawd) أو افتح [مناقشة على GitHub](https://github.com/openclaw/openclaw/discussions).
