---
read_when:
    - الإجابة عن الأسئلة الشائعة المتعلقة بالإعداد أو التثبيت أو التهيئة الأولية أو دعم وقت التشغيل
    - فرز المشكلات التي يبلغ عنها المستخدمون قبل إجراء تصحيح أعمق للأخطاء
summary: الأسئلة الشائعة حول إعداد OpenClaw وتكوينه واستخدامه
title: الأسئلة الشائعة
x-i18n:
    generated_at: "2026-04-20T07:29:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae8efda399e34f59f22f6ea8ce218eaf7b872e4117d8596ec19c09891d70813b
    source_path: help/faq.md
    workflow: 15
---

# الأسئلة الشائعة

إجابات سريعة بالإضافة إلى استكشاف أخطاء أعمق لبيئات الإعداد الواقعية (التطوير المحلي، VPS، تعدد الوكلاء، OAuth/مفاتيح API، والتحويل الاحتياطي للنماذج). لتشخيصات وقت التشغيل، راجع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). وللاطلاع على المرجع الكامل للإعدادات، راجع [الإعدادات](/ar/gateway/configuration).

## أول 60 ثانية إذا كان هناك شيء معطّل

1. **الحالة السريعة (أول فحص)**

   ```bash
   openclaw status
   ```

   ملخص محلي سريع: نظام التشغيل + التحديث، إمكانية الوصول إلى Gateway/الخدمة، الوكلاء/الجلسات، وإعدادات الموفر + مشكلات وقت التشغيل (عندما يكون Gateway قابلاً للوصول).

2. **تقرير قابل للمشاركة بأمان**

   ```bash
   openclaw status --all
   ```

   تشخيص للقراءة فقط مع ذيل السجل (مع إخفاء الرموز المميزة).

3. **حالة العملية الخلفية + المنفذ**

   ```bash
   openclaw gateway status
   ```

   يعرض وقت تشغيل المشرف مقابل إمكانية الوصول إلى RPC، وعنوان URL المستهدف للفحص، وأي إعدادات يُحتمل أن الخدمة استخدمتها.

4. **فحوصات متعمقة**

   ```bash
   openclaw status --deep
   ```

   يُجري فحص صحة حيًّا لـ Gateway، بما في ذلك فحوصات القنوات عند توفر الدعم
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

6. **تشغيل الطبيب (الإصلاحات)**

   ```bash
   openclaw doctor
   ```

   يُصلح/يُرحّل الإعدادات والحالة ويُجري فحوصات الصحة. راجع [Doctor](/ar/gateway/doctor).

7. **لقطة Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # يعرض عنوان URL المستهدف + مسار الإعدادات عند حدوث أخطاء
   ```

   يطلب من Gateway العامل لقطة كاملة (WS فقط). راجع [الصحة](/ar/gateway/health).

## البدء السريع وإعداد أول تشغيل

<AccordionGroup>
  <Accordion title="أنا عالق، ما أسرع طريقة للخروج من التعطل؟">
    استخدم وكيلاً محليًا للذكاء الاصطناعي يمكنه **رؤية جهازك**. هذا أكثر فاعلية بكثير من السؤال
    في Discord، لأن معظم حالات "أنا عالق" تكون **مشكلات إعدادات أو بيئة محلية** لا يستطيع
    المساعدون عن بُعد فحصها.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    تستطيع هذه الأدوات قراءة المستودع، وتشغيل الأوامر، وفحص السجلات، والمساعدة في إصلاح
    الإعداد على مستوى الجهاز لديك (PATH، والخدمات، والأذونات، وملفات المصادقة). امنحها
    **نسخة المصدر الكاملة** عبر تثبيت git القابل للتعديل:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يثبّت هذا OpenClaw **من نسخة git محلية**، بحيث يتمكن الوكيل من قراءة الشيفرة + الوثائق
    والاستدلال على الإصدار الدقيق الذي تشغّله. ويمكنك دائمًا العودة إلى الإصدار المستقر لاحقًا
    عبر إعادة تشغيل المثبّت بدون `--install-method git`.

    نصيحة: اطلب من الوكيل **تخطيط الإصلاح والإشراف عليه** (خطوة بخطوة)، ثم تنفيذ
    الأوامر الضرورية فقط. هذا يُبقي التغييرات صغيرة وأسهل في المراجعة.

    إذا اكتشفت خطأً فعليًا أو إصلاحًا، يُرجى فتح issue على GitHub أو إرسال PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    ابدأ بهذه الأوامر (وشارك المخرجات عند طلب المساعدة):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    ما الذي تفعله:

    - `openclaw status`: لقطة سريعة لصحة Gateway/الوكيل + الإعدادات الأساسية.
    - `openclaw models status`: يتحقق من مصادقة الموفر + توفر النماذج.
    - `openclaw doctor`: يتحقق من مشكلات الإعدادات/الحالة الشائعة ويُصلحها.

    فحوصات CLI أخرى مفيدة: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    حلقة تصحيح سريعة: [أول 60 ثانية إذا كان هناك شيء معطّل](#أول-60-ثانية-إذا-كان-هناك-شيء-معطّل).
    وثائق التثبيت: [التثبيت](/ar/install)، [أعلام المثبّت](/ar/install/installer)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="Heartbeat يستمر في التخطي. ماذا تعني أسباب التخطي؟">
    أسباب شائعة لتخطي Heartbeat:

    - `quiet-hours`: خارج نافذة الساعات النشطة المكوّنة
    - `empty-heartbeat-file`: الملف `HEARTBEAT.md` موجود لكنه يحتوي فقط على هيكل فارغ/عناوين فقط
    - `no-tasks-due`: وضع المهام في `HEARTBEAT.md` نشط لكن لم يحن موعد أي من فترات المهام بعد
    - `alerts-disabled`: كل مؤشرات ظهور Heartbeat معطلة (`showOk` و`showAlerts` و`useIndicator` جميعها معطلة)

    في وضع المهام، لا يتم تقديم الطوابع الزمنية المستحقة إلا بعد اكتمال
    تشغيل Heartbeat فعلي. ولا تُعلِّم عمليات التشغيل المتخطاة المهام على أنها مكتملة.

    الوثائق: [Heartbeat](/ar/gateway/heartbeat)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="الطريقة الموصى بها لتثبيت OpenClaw وإعداده">
    يوصي المستودع بالتشغيل من المصدر واستخدام الإعداد الأولي:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    يمكن للمعالج أيضًا بناء أصول واجهة المستخدم تلقائيًا. بعد الإعداد الأولي، عادةً ما تشغّل Gateway على المنفذ **18789**.

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
    يفتح المعالج متصفحك باستخدام عنوان URL نظيف للوحة التحكم (من دون رموز مميزة) مباشرةً بعد الإعداد الأولي ويطبع الرابط أيضًا في الملخص. أبقِ علامة التبويب هذه مفتوحة؛ وإذا لم تُفتح، فانسخ/ألصق عنوان URL المطبوع على الجهاز نفسه.
  </Accordion>

  <Accordion title="كيف أصادق لوحة التحكم على localhost مقابل جهاز بعيد؟">
    **Localhost (الجهاز نفسه):**

    - افتح `http://127.0.0.1:18789/`.
    - إذا طلبت مصادقة shared-secret، فألصق الرمز المميز أو كلمة المرور المكوّنة في إعدادات Control UI.
    - مصدر الرمز المميز: `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
    - مصدر كلمة المرور: `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
    - إذا لم يتم تكوين shared secret بعد، فأنشئ رمزًا مميزًا باستخدام `openclaw doctor --generate-gateway-token`.

    **ليس على localhost:**

    - **Tailscale Serve** (موصى به): أبقِ الربط على loopback، وشغّل `openclaw gateway --tailscale serve`، وافتح `https://<magicdns>/`. إذا كانت قيمة `gateway.auth.allowTailscale` هي `true`، فإن رؤوس الهوية تلبّي مصادقة Control UI/WebSocket (من دون لصق shared secret، مع افتراض موثوقية مضيف Gateway)؛ بينما تظل واجهات HTTP API تتطلب مصادقة shared-secret إلا إذا استخدمت عمدًا `none` لـ private-ingress أو مصادقة HTTP عبر trusted-proxy.
      تتم سلسلة محاولات مصادقة Serve غير الصالحة المتزامنة من العميل نفسه قبل أن يسجل محدِّد فشل المصادقة المحاولة، لذلك قد تُظهر المحاولة الثانية غير الصالحة بالفعل الرسالة `retry later`.
    - **ربط Tailnet**: شغّل `openclaw gateway --bind tailnet --token "<token>"` (أو كوّن مصادقة بكلمة مرور)، وافتح `http://<tailscale-ip>:18789/`، ثم ألصق shared secret المطابق في إعدادات لوحة التحكم.
    - **وكيل عكسي مدرك للهوية**: أبقِ Gateway خلف trusted proxy غير مربوط بـ loopback، واضبط `gateway.auth.mode: "trusted-proxy"`، ثم افتح عنوان URL الخاص بالوكيل.
    - **نفق SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`. تظل مصادقة shared-secret مطبقة عبر النفق؛ ألصق الرمز المميز أو كلمة المرور المكوّنة إذا طُلب ذلك.

    راجع [لوحة التحكم](/web/dashboard) و[واجهات الويب](/web) للحصول على تفاصيل أوضاع الربط والمصادقة.

  </Accordion>

  <Accordion title="لماذا يوجد إعدادان لموافقة exec لموافقات الدردشة؟">
    يتحكمان في طبقتين مختلفتين:

    - `approvals.exec`: يمرّر مطالبات الموافقة إلى وجهات الدردشة
    - `channels.<channel>.execApprovals`: يجعل تلك القناة تعمل كعميل موافقة أصلي لموافقات exec

    تظل سياسة exec الخاصة بالمضيف هي بوابة الموافقة الفعلية. يحدد إعداد الدردشة فقط مكان ظهور
    مطالبات الموافقة وكيف يمكن للأشخاص الرد عليها.

    في معظم البيئات، **لا** تحتاج إلى كليهما:

    - إذا كانت الدردشة تدعم الأوامر والردود بالفعل، فإن `/approve` داخل الدردشة نفسها يعمل عبر المسار المشترك.
    - إذا كانت قناة أصلية مدعومة يمكنها استنتاج الموافقين بأمان، فإن OpenClaw يفعّل الآن تلقائيًا الموافقات الأصلية بنمط DM-first عندما تكون `channels.<channel>.execApprovals.enabled` غير معيّنة أو قيمتها `"auto"`.
    - عندما تكون بطاقات/أزرار الموافقة الأصلية متاحة، تكون واجهة المستخدم الأصلية هي المسار الأساسي؛ ويجب ألا يضمّن الوكيل أمر `/approve` يدويًا إلا إذا كانت نتيجة الأداة تقول إن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.
    - استخدم `approvals.exec` فقط عندما يجب أيضًا تمرير المطالبات إلى دردشات أخرى أو غرف عمليات صريحة.
    - استخدم `channels.<channel>.execApprovals.target: "channel"` أو `"both"` فقط عندما تريد صراحةً نشر مطالبات الموافقة مرة أخرى في الغرفة/الموضوع الأصلي.
    - موافقات Plugin منفصلة مرة أخرى: فهي تستخدم `/approve` داخل الدردشة نفسها افتراضيًا، مع تمرير اختياري عبر `approvals.plugin`، وفقط بعض القنوات الأصلية تُبقي معالجة plugin-approval-native فوق ذلك.

    الخلاصة: التمرير مخصص للتوجيه، وإعداد العميل الأصلي مخصص لتجربة استخدام أغنى خاصة بالقناة.
    راجع [موافقات Exec](/ar/tools/exec-approvals).

  </Accordion>

  <Accordion title="ما وقت التشغيل الذي أحتاجه؟">
    Node **>= 22** مطلوب. يُوصى باستخدام `pnpm`. لا يُنصح باستخدام Bun مع Gateway.
  </Accordion>

  <Accordion title="هل يعمل على Raspberry Pi؟">
    نعم. إن Gateway خفيف - وتذكر الوثائق أن **512MB-1GB RAM** و**نواة واحدة** وحوالي **500MB**
    من مساحة القرص تكفي للاستخدام الشخصي، كما تشير إلى أن **Raspberry Pi 4 يمكنه تشغيله**.

    إذا كنت تريد مساحة إضافية (للسجلات أو الوسائط أو الخدمات الأخرى)، فإن **2GB موصى بها**،
    لكنها ليست حدًا أدنى صارمًا.

    نصيحة: يمكن لجهاز Pi/VPS صغير استضافة Gateway، ويمكنك إقران **nodes** على حاسوبك المحمول/هاتفك
    لاستخدام الشاشة/الكاميرا/اللوحة محليًا أو لتنفيذ الأوامر. راجع [Nodes](/ar/nodes).

  </Accordion>

  <Accordion title="هل توجد نصائح لتثبيت Raspberry Pi؟">
    باختصار: يعمل، لكن توقّع بعض الحواف الخشنة.

    - استخدم نظام تشغيل **64-bit** واحتفظ بـ Node >= 22.
    - فضّل **التثبيت القابل للتعديل (git)** حتى تتمكن من رؤية السجلات والتحديث بسرعة.
    - ابدأ من دون قنوات/Skills، ثم أضفها واحدة تلو الأخرى.
    - إذا واجهت مشكلات غريبة في الملفات الثنائية، فعادةً ما تكون مشكلة **توافق ARM**.

    الوثائق: [Linux](/ar/platforms/linux)، [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="إنه عالق على wake up my friend / الإعداد الأولي لا يكتمل. ماذا الآن؟">
    تعتمد هذه الشاشة على أن يكون Gateway قابلاً للوصول ومصادَقًا عليه. كما ترسل TUI أيضًا
    عبارة "Wake up, my friend!" تلقائيًا عند أول فتح. إذا رأيت هذا السطر **من دون رد**
    وبقيت الرموز عند 0، فهذا يعني أن الوكيل لم يعمل مطلقًا.

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

    3. إذا ظل معلقًا، فشغّل:

    ```bash
    openclaw doctor
    ```

    إذا كان Gateway بعيدًا، فتأكد من أن اتصال النفق/Tailscale قائم وأن واجهة المستخدم
    موجّهة إلى Gateway الصحيح. راجع [الوصول البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="هل يمكنني نقل إعدادي إلى جهاز جديد (Mac mini) من دون إعادة الإعداد الأولي؟">
    نعم. انسخ **دليل الحالة** و**مساحة العمل**، ثم شغّل Doctor مرة واحدة. هذا
    يُبقي الروبوت "كما هو تمامًا" (الذاكرة، وسجل الجلسة، والمصادقة، وحالة
    القناة) ما دمت تنسخ **الموقعين** كليهما:

    1. ثبّت OpenClaw على الجهاز الجديد.
    2. انسخ `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`) من الجهاز القديم.
    3. انسخ مساحة العمل الخاصة بك (الافتراضي: `~/.openclaw/workspace`).
    4. شغّل `openclaw doctor` وأعد تشغيل خدمة Gateway.

    هذا يحافظ على الإعدادات، وملفات المصادقة، وبيانات اعتماد WhatsApp، والجلسات، والذاكرة. إذا كنت تستخدم
    الوضع البعيد، فتذكّر أن مضيف Gateway هو من يملك مخزن الجلسات ومساحة العمل.

    **مهم:** إذا كنت فقط تُجري commit/push لمساحة العمل إلى GitHub، فأنت تنشئ
    نسخة احتياطية من **الذاكرة + ملفات التمهيد**، لكن **ليس** من سجل الجلسات أو المصادقة. فهذه
    موجودة تحت `~/.openclaw/` (على سبيل المثال `~/.openclaw/agents/<agentId>/sessions/`).

    ذو صلة: [الترحيل](/ar/install/migrating)، [مكان وجود الأشياء على القرص](#where-things-live-on-disk)،
    [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [Doctor](/ar/gateway/doctor)،
    [الوضع البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين يمكنني رؤية ما الجديد في أحدث إصدار؟">
    تحقّق من سجل التغييرات على GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    أحدث الإدخالات تكون في الأعلى. إذا كان القسم العلوي مميزًا بأنه **Unreleased**، فالقسم التالي المؤرخ
    هو أحدث إصدار تم شحنه. وتُجمّع الإدخالات ضمن **Highlights** و**Changes** و
    **Fixes** (بالإضافة إلى أقسام الوثائق/الأقسام الأخرى عند الحاجة).

  </Accordion>

  <Accordion title="لا يمكن الوصول إلى docs.openclaw.ai (خطأ SSL)">
    تقوم بعض اتصالات Comcast/Xfinity بحظر `docs.openclaw.ai` بشكل غير صحيح عبر Xfinity
    Advanced Security. عطّله أو أضف `docs.openclaw.ai` إلى قائمة السماح، ثم أعد المحاولة.
    يُرجى مساعدتنا في رفع الحظر عنه بالإبلاغ هنا: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    إذا كنت لا تزال غير قادر على الوصول إلى الموقع، فهناك نسخة معكوسة من الوثائق على GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="الفرق بين stable وbeta">
    إن **Stable** و**beta** هما **npm dist-tags**، وليسا سطرين منفصلين من الشيفرة:

    - `latest` = stable
    - `beta` = إصدار مبكر للاختبار

    عادةً ما يصل الإصدار المستقر إلى **beta** أولاً، ثم تنقل خطوة
    ترقية صريحة هذا الإصدار نفسه إلى `latest`. ويمكن للمشرفين أيضًا
    النشر مباشرةً إلى `latest` عند الحاجة. ولهذا السبب قد يشير beta وstable
    إلى **الإصدار نفسه** بعد الترقية.

    اطّلع على ما تغيّر:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    للاطلاع على أوامر التثبيت المختصرة والفارق بين beta وdev، راجع الأكورديون أدناه.

  </Accordion>

  <Accordion title="كيف أثبّت إصدار beta وما الفرق بين beta وdev؟">
    **Beta** هو npm dist-tag باسم `beta` (وقد يطابق `latest` بعد الترقية).
    أما **Dev** فهو الرأس المتحرك للفرع `main` (git)؛ وعند نشره، يستخدم npm dist-tag `dev`.

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
    يوجد خياران:

    1. **قناة Dev (نسخة git محلية):**

    ```bash
    openclaw update --channel dev
    ```

    يبدّل هذا إلى الفرع `main` ويحدّث من المصدر.

    2. **تثبيت قابل للتعديل (من موقع المثبّت):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يمنحك هذا مستودعًا محليًا يمكنك تعديله، ثم تحديثه عبر git.

    إذا كنت تفضّل نسخة نظيفة يدويًا، فاستخدم:

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

    - **التثبيت:** 2-5 دقائق
    - **الإعداد الأولي:** 5-15 دقيقة بحسب عدد القنوات/النماذج التي تقوم بتكوينها

    إذا تعلّق، فاستخدم [تعطّل المثبّت](#quick-start-and-first-run-setup)
    وحلقة التصحيح السريعة في [أنا عالق](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="المثبّت عالق؟ كيف أحصل على مزيد من التفاصيل؟">
    أعد تشغيل المثبّت باستخدام **مخرجات مفصلة**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    تثبيت beta مع المخرجات المفصلة:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    من أجل تثبيت قابل للتعديل (git):

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

    مزيد من الخيارات: [أعلام المثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="يقول تثبيت Windows إن git غير موجود أو إن openclaw غير معروف">
    هناك مشكلتان شائعتان في Windows:

    **1) خطأ npm spawn git / git not found**

    - ثبّت **Git for Windows** وتأكد من أن `git` موجود على PATH لديك.
    - أغلق PowerShell وأعد فتحه، ثم أعد تشغيل المثبّت.

    **2) لا يتم التعرف على openclaw بعد التثبيت**

    - مجلد npm global bin ليس موجودًا على PATH.
    - تحقّق من المسار:

      ```powershell
      npm config get prefix
      ```

    - أضف ذلك الدليل إلى PATH الخاص بالمستخدم لديك (لا حاجة إلى اللاحقة `\bin` على Windows؛ ففي معظم الأنظمة يكون `%AppData%\npm`).
    - أغلق PowerShell وأعد فتحه بعد تحديث PATH.

    إذا كنت تريد أسلس إعداد على Windows، فاستخدم **WSL2** بدل Windows الأصلي.
    الوثائق: [Windows](/ar/platforms/windows).

  </Accordion>

  <Accordion title="يعرض خرج exec في Windows نصًا صينيًا مشوهًا - ماذا أفعل؟">
    يكون هذا عادةً بسبب عدم تطابق صفحة ترميز وحدة التحكم في بيئات Windows الأصلية.

    الأعراض:

    - يعرض خرج `system.run`/`exec` النص الصيني بصورة مشوهة
    - يبدو الأمر نفسه طبيعيًا في ملف تعريف طرفية آخر

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

    إذا كنت لا تزال قادرًا على إعادة إنتاج هذه المشكلة على أحدث إصدار من OpenClaw، فتتبّعها/أبلِغ عنها في:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="لم تُجب الوثائق عن سؤالي - كيف أحصل على إجابة أفضل؟">
    استخدم **التثبيت القابل للتعديل (git)** حتى تكون لديك الشيفرة المصدرية الكاملة والوثائق محليًا، ثم اسأل
    الروبوت الخاص بك (أو Claude/Codex) _من ذلك المجلد_ حتى يتمكن من قراءة المستودع والإجابة بدقة.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مزيد من التفاصيل: [التثبيت](/ar/install) و[أعلام المثبّت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أثبّت OpenClaw على Linux؟">
    الإجابة المختصرة: اتبع دليل Linux، ثم شغّل الإعداد الأولي.

    - المسار السريع في Linux + تثبيت الخدمة: [Linux](/ar/platforms/linux).
    - الشرح الكامل: [البدء](/ar/start/getting-started).
    - المثبّت + التحديثات: [التثبيت والتحديثات](/ar/install/updating).

  </Accordion>

  <Accordion title="كيف أثبّت OpenClaw على VPS؟">
    أي VPS يعمل بنظام Linux مناسب. ثبّت على الخادم، ثم استخدم SSH/Tailscale للوصول إلى Gateway.

    الأدلة: [exe.dev](/ar/install/exe-dev)، [Hetzner](/ar/install/hetzner)، [Fly.io](/ar/install/fly).
    الوصول البعيد: [Gateway remote](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين توجد أدلة التثبيت السحابي/VPS؟">
    نحتفظ **بمركز استضافة** يضم موفري الخدمة الشائعين. اختر واحدًا واتبع الدليل:

    - [استضافة VPS](/ar/vps) (كل المزوّدين في مكان واحد)
    - [Fly.io](/ar/install/fly)
    - [Hetzner](/ar/install/hetzner)
    - [exe.dev](/ar/install/exe-dev)

    كيف يعمل هذا في السحابة: يعمل **Gateway على الخادم**، وتصل إليه
    من حاسوبك المحمول/هاتفك عبر Control UI (أو Tailscale/SSH). وتوجد حالتك + مساحة العمل
    على الخادم، لذا تعامل مع المضيف على أنه مصدر الحقيقة وقم بعمل نسخة احتياطية له.

    يمكنك إقران **nodes** (Mac/iOS/Android/headless) مع Gateway السحابي هذا للوصول
    إلى الشاشة/الكاميرا/اللوحة محليًا أو تشغيل الأوامر على حاسوبك المحمول مع الإبقاء على
    Gateway في السحابة.

    المركز: [المنصات](/ar/platforms). الوصول البعيد: [Gateway remote](/ar/gateway/remote).
    Nodes: [Nodes](/ar/nodes)، [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني أن أطلب من OpenClaw أن يحدّث نفسه؟">
    الإجابة المختصرة: **ممكن، لكنه غير موصى به**. إذ يمكن أن تؤدي عملية التحديث إلى إعادة تشغيل
    Gateway (مما يقطع الجلسة النشطة)، وقد تحتاج إلى نسخة git محلية نظيفة،
    وقد تطلب تأكيدًا. والأكثر أمانًا هو تشغيل التحديثات من shell بصفتك المشغّل.

    استخدم CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    إذا اضطررت إلى الأتمتة من وكيل:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    الوثائق: [التحديث](/cli/update)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="ماذا يفعل الإعداد الأولي فعليًا؟">
    إن `openclaw onboard` هو مسار الإعداد الموصى به. في **الوضع المحلي**، فإنه يوجّهك خلال:

    - **إعداد النموذج/المصادقة** (OAuth للموفر، ومفاتيح API، وsetup-token الخاص بـ Anthropic، بالإضافة إلى خيارات النماذج المحلية مثل LM Studio)
    - موقع **مساحة العمل** + ملفات التمهيد
    - **إعدادات Gateway** (الربط/المنفذ/المصادقة/tailscale)
    - **القنوات** (WhatsApp وTelegram وDiscord وMattermost وSignal وiMessage، بالإضافة إلى إضافات القنوات المضمّنة مثل QQ Bot)
    - **تثبيت العملية الخلفية** (LaunchAgent على macOS؛ ووحدة مستخدم systemd على Linux/WSL2)
    - **فحوصات الصحة** واختيار **Skills**

    كما يحذّر أيضًا إذا كان النموذج الذي قمت بتكوينه غير معروف أو إذا كانت المصادقة مفقودة.

  </Accordion>

  <Accordion title="هل أحتاج إلى اشتراك Claude أو OpenAI لتشغيل هذا؟">
    لا. يمكنك تشغيل OpenClaw باستخدام **مفاتيح API** (Anthropic/OpenAI/وغيرها) أو
    باستخدام **نماذج محلية فقط** بحيث تبقى بياناتك على جهازك. وتُعد الاشتراكات (Claude
    Pro/Max أو OpenAI Codex) طرقًا اختيارية للمصادقة مع هؤلاء المزوّدين.

    بالنسبة إلى Anthropic في OpenClaw، فالتقسيم العملي هو:

    - **مفتاح Anthropic API**: فوترة Anthropic API العادية
    - **مصادقة Claude CLI / اشتراك Claude داخل OpenClaw**: أخبرنا موظفو Anthropic
      بأن هذا الاستخدام مسموح به مرة أخرى، ويتعامل OpenClaw مع استخدام `claude -p`
      على أنه معتمد لهذا التكامل ما لم تنشر Anthropic سياسة جديدة

    بالنسبة إلى مضيفات Gateway طويلة العمر، تظل مفاتيح Anthropic API هي
    الإعداد الأكثر قابلية للتنبؤ. كما أن OpenAI Codex OAuth مدعوم صراحةً للأدوات
    الخارجية مثل OpenClaw.

    ويدعم OpenClaw أيضًا خيارات أخرى مستضافة بنمط الاشتراك، بما في ذلك
    **Qwen Cloud Coding Plan** و**MiniMax Coding Plan** و
    **Z.AI / GLM Coding Plan**.

    الوثائق: [Anthropic](/ar/providers/anthropic)، [OpenAI](/ar/providers/openai)،
    [Qwen Cloud](/ar/providers/qwen)،
    [MiniMax](/ar/providers/minimax)، [GLM Models](/ar/providers/glm)،
    [النماذج المحلية](/ar/gateway/local-models)، [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام اشتراك Claude Max من دون مفتاح API؟">
    نعم.

    أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مرة أخرى، لذلك
    يتعامل OpenClaw مع مصادقة اشتراك Claude واستخدام `claude -p` على أنهما معتمدان
    لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. وإذا كنت تريد
    الإعداد الأكثر قابلية للتنبؤ على جانب الخادم، فاستخدم مفتاح Anthropic API بدلًا من ذلك.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك Claude ‏(Claude Pro أو Max)؟">
    نعم.

    أخبرنا موظفو Anthropic أن هذا الاستخدام مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع
    إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل
    ما لم تنشر Anthropic سياسة جديدة.

    لا يزال setup-token الخاص بـ Anthropic متاحًا باعتباره مسار رمز مميز مدعومًا في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
    أما لأعباء العمل الإنتاجية أو متعددة المستخدمين، فما تزال
    مصادقة مفتاح Anthropic API هي الخيار الأكثر أمانًا وقابلية للتنبؤ. وإذا كنت تريد خيارات
    مستضافة أخرى بنمط الاشتراك في OpenClaw، فراجع [OpenAI](/ar/providers/openai)، و[Qwen / Model
    Cloud](/ar/providers/qwen)، و[MiniMax](/ar/providers/minimax)، و[GLM
    Models](/ar/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="لماذا أرى HTTP 429 rate_limit_error من Anthropic؟">
هذا يعني أن **حصة/حد المعدل لدى Anthropic** قد نُفدت في النافذة الحالية. إذا كنت
تستخدم **Claude CLI**، فانتظر حتى تُعاد تهيئة النافذة أو قم بترقية خطتك. وإذا كنت
تستخدم **مفتاح Anthropic API**، فتحقق من Anthropic Console
للاطلاع على الاستخدام/الفوترة وارفع الحدود عند الحاجة.

    إذا كانت الرسالة تحديدًا هي:
    `Extra usage is required for long context requests`، فهذا يعني أن الطلب يحاول استخدام
    الإصدار التجريبي لسياق Anthropic بحجم 1M (`context1m: true`). وهذا لا يعمل إلا عندما تكون
    بيانات اعتمادك مؤهلة لفوترة السياق الطويل (فوترة مفتاح API أو
    مسار تسجيل الدخول إلى Claude في OpenClaw مع تمكين Extra Usage).

    نصيحة: اضبط **نموذجًا احتياطيًا** حتى يتمكن OpenClaw من مواصلة الرد بينما يكون أحد الموفّرين مقيّدًا بالمعدل.
    راجع [النماذج](/cli/models)، و[OAuth](/ar/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ar/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="هل AWS Bedrock مدعوم؟">
    نعم. يتضمن OpenClaw موفّر **Amazon Bedrock (Converse)** مضمّنًا. وعند وجود مؤشرات بيئة AWS، يمكن لـ OpenClaw اكتشاف كتالوج Bedrock للبث/النص تلقائيًا ودمجه كموفّر ضمني `amazon-bedrock`؛ وإلا يمكنك تمكين `plugins.entries.amazon-bedrock.config.discovery.enabled` صراحةً أو إضافة إدخال موفّر يدويًا. راجع [Amazon Bedrock](/ar/providers/bedrock) و[موفري النماذج](/ar/providers/models). وإذا كنت تفضّل تدفق مفتاح مُدار، فإن الوكيل المتوافق مع OpenAI أمام Bedrock يظل خيارًا صالحًا.
  </Accordion>

  <Accordion title="كيف تعمل مصادقة Codex؟">
    يدعم OpenClaw **OpenAI Code (Codex)** عبر OAuth (تسجيل الدخول إلى ChatGPT). ويمكن للإعداد الأولي تشغيل تدفق OAuth كما سيضبط النموذج الافتراضي على `openai-codex/gpt-5.4` عند الاقتضاء. راجع [موفري النماذج](/ar/concepts/model-providers) و[الإعداد الأولي (CLI)](/ar/start/wizard).
  </Accordion>

  <Accordion title="لماذا لا يؤدي ChatGPT GPT-5.4 إلى فتح openai/gpt-5.4 في OpenClaw؟">
    يتعامل OpenClaw مع المسارين بشكل منفصل:

    - `openai-codex/gpt-5.4` = OAuth الخاص بـ ChatGPT/Codex
    - `openai/gpt-5.4` = واجهة OpenAI Platform API المباشرة

    في OpenClaw، يكون تسجيل الدخول عبر ChatGPT/Codex موصولًا بمسار `openai-codex/*`،
    وليس بمسار `openai/*` المباشر. وإذا كنت تريد مسار API المباشر في
    OpenClaw، فاضبط `OPENAI_API_KEY` (أو إعداد موفّر OpenAI المكافئ).
    وإذا كنت تريد تسجيل الدخول عبر ChatGPT/Codex في OpenClaw، فاستخدم `openai-codex/*`.

  </Accordion>

  <Accordion title="لماذا قد تختلف حدود Codex OAuth عن ChatGPT على الويب؟">
    يستخدم `openai-codex/*` مسار OAuth الخاص بـ Codex، وتدير OpenAI نوافذ الحصة القابلة للاستخدام فيه
    كما أنها تعتمد على الخطة. ومن الناحية العملية، قد تختلف هذه الحدود عن
    تجربة موقع/تطبيق ChatGPT، حتى عندما يكون الاثنان مرتبطين بالحساب نفسه.

    يمكن لـ OpenClaw عرض نوافذ الاستخدام/الحصة المرئية حاليًا للموفّر في
    `openclaw models status`، لكنه لا يخترع ولا يطبّع استحقاقات ChatGPT على الويب
    إلى وصول مباشر إلى API. وإذا كنت تريد مسار الفوترة/الحدود المباشر في OpenAI Platform،
    فاستخدم `openai/*` مع مفتاح API.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك OpenAI ‏(Codex OAuth)؟">
    نعم. يدعم OpenClaw بالكامل **OAuth لاشتراك OpenAI Code (Codex)**.
    وتسمح OpenAI صراحةً باستخدام OAuth الخاص بالاشتراك في الأدوات/سير العمل الخارجية
    مثل OpenClaw. ويمكن للإعداد الأولي تشغيل تدفق OAuth نيابةً عنك.

    راجع [OAuth](/ar/concepts/oauth)، و[موفري النماذج](/ar/concepts/model-providers)، و[الإعداد الأولي (CLI)](/ar/start/wizard).

  </Accordion>

  <Accordion title="كيف أُعد Gemini CLI OAuth؟">
    يستخدم Gemini CLI **تدفق مصادقة Plugin**، وليس معرّف عميل أو سرًا في `openclaw.json`.

    الخطوات:

    1. ثبّت Gemini CLI محليًا بحيث يكون `gemini` موجودًا على `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. فعّل Plugin: `openclaw plugins enable google`
    3. سجّل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. النموذج الافتراضي بعد تسجيل الدخول: `google-gemini-cli/gemini-3-flash-preview`
    5. إذا فشلت الطلبات، فاضبط `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway

    يؤدي هذا إلى تخزين رموز OAuth في ملفات المصادقة على مضيف Gateway. التفاصيل: [موفري النماذج](/ar/concepts/model-providers).

  </Accordion>

  <Accordion title="هل النموذج المحلي مناسب للمحادثات العادية؟">
    غالبًا لا. يحتاج OpenClaw إلى سياق كبير + أمان قوي؛ فالبطاقات الصغيرة تقطع وتُسرّب. وإذا اضطررت، فشغّل **أكبر** بنية نموذج يمكنك تشغيلها محليًا (LM Studio) وراجع [/gateway/local-models](/ar/gateway/local-models). تزيد النماذج الأصغر/المكمّاة من مخاطر حقن المطالبات - راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="كيف أحافظ على حركة مرور النموذج المستضاف داخل منطقة محددة؟">
    اختر نقاط نهاية مثبتة على منطقة معينة. يوفّر OpenRouter خيارات مستضافة في الولايات المتحدة لـ MiniMax وKimi وGLM؛ اختر النسخة المستضافة في الولايات المتحدة للحفاظ على البيانات داخل المنطقة. ولا يزال بإمكانك إدراج Anthropic/OpenAI إلى جانب هذه الخيارات باستخدام `models.mode: "merge"` بحيث تظل النماذج الاحتياطية متاحة مع احترام الموفّر المقيّد بالمنطقة الذي تختاره.
  </Accordion>

  <Accordion title="هل يجب أن أشتري Mac Mini لتثبيت هذا؟">
    لا. يعمل OpenClaw على macOS أو Linux (وWindows عبر WSL2). ويُعد Mac mini اختياريًا - فبعض الأشخاص
    يشترونه كمضيف يعمل دائمًا، لكن VPS صغيرًا أو خادمًا منزليًا أو جهازًا من فئة Raspberry Pi يمكنه القيام بذلك أيضًا.

    تحتاج إلى جهاز Mac فقط **للأدوات الخاصة بـ macOS فقط**. بالنسبة إلى iMessage، استخدم [BlueBubbles](/ar/channels/bluebubbles) (موصى به) - يعمل خادم BlueBubbles على أي جهاز Mac، بينما يمكن لـ Gateway أن يعمل على Linux أو في مكان آخر. وإذا كنت تريد أدوات أخرى خاصة بـ macOS فقط، فشغّل Gateway على جهاز Mac أو اقترن مع Node يعمل على macOS.

    الوثائق: [BlueBubbles](/ar/channels/bluebubbles)، [Nodes](/ar/nodes)، [الوضع البعيد على Mac](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل أحتاج إلى Mac mini لدعم iMessage؟">
    تحتاج إلى **أي جهاز macOS** مسجّل الدخول إلى Messages. ولا **يشترط** أن يكون Mac mini -
    فأي جهاز Mac يصلح. **استخدم [BlueBubbles](/ar/channels/bluebubbles)** (موصى به) لـ iMessage - إذ يعمل خادم BlueBubbles على macOS، بينما يمكن لـ Gateway أن يعمل على Linux أو في مكان آخر.

    الإعدادات الشائعة:

    - شغّل Gateway على Linux/VPS، وشغّل خادم BlueBubbles على أي جهاز Mac مسجّل الدخول إلى Messages.
    - شغّل كل شيء على جهاز Mac إذا كنت تريد أبسط إعداد على جهاز واحد.

    الوثائق: [BlueBubbles](/ar/channels/bluebubbles)، [Nodes](/ar/nodes)،
    [الوضع البعيد على Mac](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="إذا اشتريت Mac mini لتشغيل OpenClaw، فهل يمكنني توصيله بـ MacBook Pro الخاص بي؟">
    نعم. يمكن لـ **Mac mini تشغيل Gateway**، ويمكن لـ MacBook Pro الخاص بك الاتصال باعتباره
    **Node** (جهازًا مرافقًا). لا تقوم Nodes بتشغيل Gateway - بل توفر
    إمكانات إضافية مثل الشاشة/الكاميرا/اللوحة و`system.run` على ذلك الجهاز.

    النمط الشائع:

    - تشغيل Gateway على Mac mini (دائم التشغيل).
    - يشغّل MacBook Pro تطبيق macOS أو مضيف Node ويقترن مع Gateway.
    - استخدم `openclaw nodes status` / `openclaw nodes list` لرؤيته.

    الوثائق: [Nodes](/ar/nodes)، [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني استخدام Bun؟">
    لا يُوصى باستخدام Bun. فنحن نرى أخطاء في وقت التشغيل، خصوصًا مع WhatsApp وTelegram.
    استخدم **Node** للحصول على Gateways مستقرة.

    إذا كنت لا تزال تريد التجربة باستخدام Bun، فافعل ذلك على Gateway غير إنتاجية
    ومن دون WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: ماذا يوضع في allowFrom؟">
    إن `channels.telegram.allowFrom` هو **معرّف مستخدم Telegram الخاص بالمرسل البشري** (رقمي). وليس اسم مستخدم الروبوت.

    يطلب الإعداد أرقام معرّفات المستخدمين فقط. وإذا كانت لديك بالفعل إدخالات قديمة من نوع `@username` في الإعدادات، فيمكن أن يحاول `openclaw doctor --fix` حلها.

    الأكثر أمانًا (من دون روبوت طرف ثالث):

    - أرسل رسالة مباشرة إلى الروبوت، ثم شغّل `openclaw logs --follow` واقرأ `from.id`.

    Bot API الرسمي:

    - أرسل رسالة مباشرة إلى الروبوت، ثم اطلب `https://api.telegram.org/bot<bot_token>/getUpdates` واقرأ `message.from.id`.

    طرف ثالث (خصوصية أقل):

    - أرسل رسالة مباشرة إلى `@userinfobot` أو `@getidsbot`.

    راجع [/channels/telegram](/ar/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="هل يمكن لعدة أشخاص استخدام رقم WhatsApp واحد مع نُسخ OpenClaw مختلفة؟">
    نعم، عبر **التوجيه متعدد الوكلاء**. اربط **الرسائل المباشرة** لكل مرسل على WhatsApp (النظير `kind: "direct"`، ومعرّف المرسل بصيغة E.164 مثل `+15551234567`) بـ `agentId` مختلف، بحيث يحصل كل شخص على مساحة العمل ومخزن الجلسات الخاصين به. وستظل الردود تصدر من **حساب WhatsApp نفسه**، كما أن التحكم في الوصول إلى الرسائل المباشرة (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) يكون عامًا على مستوى حساب WhatsApp نفسه. راجع [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent) و[WhatsApp](/ar/channels/whatsapp).
  </Accordion>

  <Accordion title='هل يمكنني تشغيل وكيل "دردشة سريعة" ووكيل "Opus للبرمجة"؟'>
    نعم. استخدم التوجيه متعدد الوكلاء: امنح كل وكيل نموذجه الافتراضي الخاص، ثم اربط المسارات الواردة (حساب الموفّر أو نظراء محددين) بكل وكيل. يوجد مثال على الإعدادات في [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent). راجع أيضًا [النماذج](/ar/concepts/models) و[الإعدادات](/ar/gateway/configuration).
  </Accordion>

  <Accordion title="هل يعمل Homebrew على Linux؟">
    نعم. يدعم Homebrew نظام Linux ‏(Linuxbrew). إعداد سريع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    إذا كنت تشغّل OpenClaw عبر systemd، فتأكد من أن PATH الخاص بالخدمة يتضمن `/home/linuxbrew/.linuxbrew/bin` (أو بادئة brew لديك) حتى تُحل الأدوات المثبتة عبر `brew` في بيئات shell غير التفاعلية.
    كما تضيف الإصدارات الحديثة أيضًا أدلة bin الشائعة للمستخدم مسبقًا في خدمات Linux systemd (على سبيل المثال `~/.local/bin` و`~/.npm-global/bin` و`~/.local/share/pnpm` و`~/.bun/bin`) وتراعي `PNPM_HOME` و`NPM_CONFIG_PREFIX` و`BUN_INSTALL` و`VOLTA_HOME` و`ASDF_DATA_DIR` و`NVM_DIR` و`FNM_DIR` عند ضبطها.

  </Accordion>

  <Accordion title="الفرق بين التثبيت القابل للتعديل عبر git وnpm install">
    - **التثبيت القابل للتعديل (git):** نسخة مصدر كاملة، قابلة للتعديل، وهي الأفضل للمساهمين.
      إذ تقوم بتشغيل البنيات محليًا ويمكنك تعديل الشيفرة/الوثائق.
    - **npm install:** تثبيت CLI عام، من دون مستودع، وهو الأفضل لحالة "شغّله فقط".
      تأتي التحديثات من npm dist-tags.

    الوثائق: [البدء](/ar/start/getting-started)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="هل يمكنني التبديل لاحقًا بين تثبيت npm وتثبيت git؟">
    نعم. ثبّت النسخة الأخرى، ثم شغّل Doctor حتى تشير خدمة Gateway إلى نقطة الدخول الجديدة.
    هذا **لا يحذف بياناتك** - فهو يغيّر فقط تثبيت شيفرة OpenClaw. أما حالتك
    (`~/.openclaw`) ومساحة العمل (`~/.openclaw/workspace`) فتبقيان كما هما دون تغيير.

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

    يكتشف Doctor عدم تطابق نقطة دخول خدمة Gateway ويعرض إعادة كتابة إعدادات الخدمة لتتوافق مع التثبيت الحالي (استخدم `--repair` في الأتمتة).

    للحصول على نصائح حول النسخ الاحتياطي، راجع [استراتيجية النسخ الاحتياطي](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="هل يجب أن أشغّل Gateway على حاسوبي المحمول أم على VPS؟">
    الإجابة المختصرة: **إذا كنت تريد اعتمادية على مدار الساعة طوال أيام الأسبوع، فاستخدم VPS**. أما إذا كنت تريد
    أقل قدر من التعقيد وتقبل السكون/إعادة التشغيل، فشغّله محليًا.

    **الحاسوب المحمول (Gateway محلي)**

    - **الإيجابيات:** لا توجد تكلفة خادم، ووصول مباشر إلى الملفات المحلية، ونافذة متصفح مرئية مباشرة.
    - **السلبيات:** السكون/انقطاع الشبكة = انقطاعات، وتحديثات/إعادات تشغيل نظام التشغيل تقاطع العمل، ويجب أن يظل الجهاز مستيقظًا.

    **VPS / السحابة**

    - **الإيجابيات:** يعمل دائمًا، وشبكة مستقرة، ولا توجد مشكلات سكون الحاسوب المحمول، وأسهل في الاستمرار بالتشغيل.
    - **السلبيات:** غالبًا يعمل دون واجهة مرئية (استخدم لقطات الشاشة)، ووصول إلى الملفات عن بُعد فقط، ويجب عليك استخدام SSH لإجراء التحديثات.

    **ملاحظة خاصة بـ OpenClaw:** تعمل WhatsApp وTelegram وSlack وMattermost وDiscord جميعها بشكل جيد من VPS. والمقايضة الفعلية الوحيدة هي **متصفح headless** مقابل نافذة مرئية. راجع [Browser](/ar/tools/browser).

    **الافتراضي الموصى به:** VPS إذا كنت قد واجهت سابقًا انقطاعات في Gateway. أما التشغيل المحلي فهو ممتاز عندما تستخدم جهاز Mac بنشاط وتريد الوصول إلى الملفات المحلية أو أتمتة واجهة المستخدم من خلال متصفح مرئي.

  </Accordion>

  <Accordion title="إلى أي مدى من المهم تشغيل OpenClaw على جهاز مخصص؟">
    هذا ليس مطلوبًا، لكنه **موصى به من أجل الاعتمادية والعزل**.

    - **مضيف مخصص (VPS/Mac mini/Pi):** يعمل دائمًا، وانقطاعات أقل بسبب السكون/إعادة التشغيل، وأذونات أنظف، وأسهل في الاستمرار بالتشغيل.
    - **حاسوب محمول/مكتبي مشترك:** مناسب تمامًا للاختبار والاستخدام النشط، لكن توقّع توقفات عندما يدخل الجهاز في وضع السكون أو يتلقى تحديثات.

    إذا كنت تريد أفضل ما في العالمين، فأبقِ Gateway على مضيف مخصص واقرن حاسوبك المحمول باعتباره **Node** لاستخدام أدوات الشاشة/الكاميرا/exec المحلية. راجع [Nodes](/ar/nodes).
    ولإرشادات الأمان، اقرأ [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما الحد الأدنى لمتطلبات VPS وما نظام التشغيل الموصى به؟">
    OpenClaw خفيف الوزن. بالنسبة إلى Gateway أساسي + قناة دردشة واحدة:

    - **الحد الأدنى المطلق:** وحدة vCPU واحدة، و1GB RAM، وحوالي 500MB من القرص.
    - **الموصى به:** 1-2 vCPU، و2GB RAM أو أكثر لإتاحة هامش إضافي (للسجلات، والوسائط، والقنوات المتعددة). وقد تكون أدوات Node وأتمتة المتصفح شرهة للموارد.

    نظام التشغيل: استخدم **Ubuntu LTS** (أو أي Debian/Ubuntu حديث). وقد تم اختبار مسار التثبيت على Linux بشكل أفضل هناك.

    الوثائق: [Linux](/ar/platforms/linux)، [استضافة VPS](/ar/vps).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل OpenClaw داخل آلة افتراضية وما المتطلبات؟">
    نعم. تعامل مع الآلة الافتراضية كما تتعامل مع VPS: يجب أن تكون قيد التشغيل دائمًا، وقابلة للوصول، وتحتوي على قدر كافٍ
    من RAM لـ Gateway وأي قنوات تفعّلها.

    الإرشادات الأساسية:

    - **الحد الأدنى المطلق:** وحدة vCPU واحدة، و1GB RAM.
    - **الموصى به:** 2GB RAM أو أكثر إذا كنت تشغّل قنوات متعددة، أو أتمتة متصفح، أو أدوات وسائط.
    - **نظام التشغيل:** Ubuntu LTS أو أي Debian/Ubuntu حديث آخر.

    إذا كنت تستخدم Windows، فإن **WSL2 هو أسهل إعداد على نمط الآلة الافتراضية** ويملك أفضل
    توافق مع الأدوات. راجع [Windows](/ar/platforms/windows)، [استضافة VPS](/ar/vps).
    وإذا كنت تشغّل macOS داخل آلة افتراضية، فراجع [macOS VM](/ar/install/macos-vm).

  </Accordion>
</AccordionGroup>

## ما هو OpenClaw؟

<AccordionGroup>
  <Accordion title="ما هو OpenClaw، في فقرة واحدة؟">
    OpenClaw هو مساعد ذكاء اصطناعي شخصي تقوم بتشغيله على أجهزتك الخاصة. وهو يرد على أسطح المراسلة التي تستخدمها بالفعل (WhatsApp وTelegram وSlack وMattermost وDiscord وGoogle Chat وSignal وiMessage وWebChat وإضافات القنوات المضمنة مثل QQ Bot) ويمكنه أيضًا تنفيذ الصوت + Canvas مباشر على المنصات المدعومة. إن **Gateway** هو مستوى التحكم الذي يعمل دائمًا؛ والمساعد هو المنتج.
  </Accordion>

  <Accordion title="عرض القيمة">
    OpenClaw ليس "مجرد غلاف لـ Claude". إنه **مستوى تحكم محلي أولًا** يتيح لك تشغيل
    مساعد قادر على **أجهزتك الخاصة**، ويمكن الوصول إليه من تطبيقات الدردشة التي تستخدمها بالفعل، مع
    جلسات ذات حالة، وذاكرة، وأدوات - من دون تسليم التحكم في سير عملك إلى
    SaaS مستضاف.

    أبرز النقاط:

    - **أجهزتك، بياناتك:** شغّل Gateway أينما تريد (Mac أو Linux أو VPS) واحتفظ
      بمساحة العمل + سجل الجلسات محليين.
    - **قنوات حقيقية، لا صندوق رمل ويب:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc،
      بالإضافة إلى الصوت عبر الجوال وCanvas على المنصات المدعومة.
    - **محايد تجاه النماذج:** استخدم Anthropic وOpenAI وMiniMax وOpenRouter وغيرها، مع توجيه
      وتحويل احتياطي لكل وكيل.
    - **خيار محلي فقط:** شغّل نماذج محلية بحيث **يمكن أن تبقى كل البيانات على جهازك** إذا رغبت.
    - **التوجيه متعدد الوكلاء:** وكلاء منفصلون لكل قناة أو حساب أو مهمة، ولكل منهم
      مساحة العمل والإعدادات الافتراضية الخاصة به.
    - **مفتوح المصدر وقابل للتعديل:** افحصه ووسّعه واستضفه ذاتيًا من دون ارتهان لمزوّد.

    الوثائق: [Gateway](/ar/gateway)، [القنوات](/ar/channels)، [تعدد الوكلاء](/ar/concepts/multi-agent)،
    [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="لقد أعددته للتو - ماذا يجب أن أفعل أولاً؟">
    مشروعات أولية جيدة:

    - أنشئ موقعًا إلكترونيًا (WordPress أو Shopify أو موقعًا ثابتًا بسيطًا).
    - أنشئ نموذجًا أوليًا لتطبيق جوال (المخطط، والشاشات، وخطة API).
    - نظّم الملفات والمجلدات (التنظيف، والتسمية، والوسوم).
    - اربط Gmail وأتمت الملخصات أو المتابعات.

    يمكنه التعامل مع المهام الكبيرة، لكنه يعمل بأفضل صورة عندما تقسّمها إلى مراحل
    وتستخدم وكلاء فرعيين للعمل المتوازي.

  </Accordion>

  <Accordion title="ما أهم خمس حالات استخدام يومية لـ OpenClaw؟">
    تبدو المكاسب اليومية عادةً على النحو التالي:

    - **إحاطات شخصية:** ملخصات للبريد الوارد، والتقويم، والأخبار التي تهمك.
    - **البحث والصياغة:** بحث سريع، وملخصات، ومسودات أولى للرسائل الإلكترونية أو المستندات.
    - **التذكيرات والمتابعات:** تنبيهات وقوائم تحقق مدفوعة بواسطة Cron أو Heartbeat.
    - **أتمتة المتصفح:** تعبئة النماذج، وجمع البيانات، وتكرار مهام الويب.
    - **التنسيق بين الأجهزة:** أرسل مهمة من هاتفك، ودع Gateway يشغّلها على خادم، ثم استلم النتيجة مرة أخرى في الدردشة.

  </Accordion>

  <Accordion title="هل يمكن أن يساعد OpenClaw في توليد العملاء المحتملين، والتواصل، والإعلانات، والمدونات الخاصة بـ SaaS؟">
    نعم في **البحث، والتأهيل، والصياغة**. يمكنه فحص المواقع، وبناء قوائم مختصرة،
    وتلخيص العملاء المحتملين، وكتابة مسودات للتواصل أو نصوص إعلانية.

    أما بالنسبة إلى **حملات التواصل أو الإعلانات**، فأبقِ إنسانًا في الحلقة. تجنب
    الرسائل المزعجة، واتبع القوانين المحلية وسياسات المنصات، وراجع كل شيء قبل إرساله.
    وأكثر الأنماط أمانًا هو أن يدع OpenClaw المسودة لك ثم توافق أنت عليها.

    الوثائق: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما المزايا مقارنةً بـ Claude Code لتطوير الويب؟">
    OpenClaw هو **مساعد شخصي** وطبقة تنسيق، وليس بديلًا عن بيئة التطوير المتكاملة. استخدم
    Claude Code أو Codex للحصول على أسرع دورة ترميز مباشرة داخل مستودع. واستخدم OpenClaw عندما تريد
    ذاكرة مستمرة، ووصولًا عبر الأجهزة، وتنسيقًا للأدوات.

    المزايا:

    - **ذاكرة + مساحة عمل مستمرتان** عبر الجلسات
    - **وصول عبر منصات متعددة** (WhatsApp، Telegram، TUI، WebChat)
    - **تنسيق الأدوات** (المتصفح، الملفات، الجدولة، hooks)
    - **Gateway يعمل دائمًا** (شغّله على VPS وتفاعل معه من أي مكان)
    - **Nodes** للمتصفح/الشاشة/الكاميرا/exec المحلي

    عرض توضيحي: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills والأتمتة

<AccordionGroup>
  <Accordion title="كيف أخصص Skills من دون إبقاء المستودع في حالة dirty؟">
    استخدم عمليات التجاوز المُدارة بدلًا من تعديل نسخة المستودع. ضع تغييراتك في `~/.openclaw/skills/<name>/SKILL.md` (أو أضف مجلدًا عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json`). ترتيب الأولوية هو `<workspace>/skills` ← `<workspace>/.agents/skills` ← `~/.agents/skills` ← `~/.openclaw/skills` ← المضمّن ← `skills.load.extraDirs`، لذا فإن عمليات التجاوز المُدارة تظل تتقدم على Skills المضمّنة من دون لمس git. وإذا كنت تحتاج إلى تثبيت Skill على مستوى عام ولكن تكون مرئية فقط لبعض الوكلاء، فاحتفظ بالنسخة المشتركة في `~/.openclaw/skills` وتحكم في الظهور باستخدام `agents.defaults.skills` و`agents.list[].skills`. وينبغي ألا تعيش في المستودع وتُرسل كطلبات PR إلا التعديلات الجديرة بالرفع إلى المصدر الأصلي.
  </Accordion>

  <Accordion title="هل يمكنني تحميل Skills من مجلد مخصص؟">
    نعم. أضف أدلة إضافية عبر `skills.load.extraDirs` في `~/.openclaw/openclaw.json` (أدنى أولوية). ترتيب الأولوية الافتراضي هو `<workspace>/skills` ← `<workspace>/.agents/skills` ← `~/.agents/skills` ← `~/.openclaw/skills` ← المضمّن ← `skills.load.extraDirs`. يقوم `clawhub` بالتثبيت في `./skills` افتراضيًا، ويتعامل OpenClaw معه على أنه `<workspace>/skills` في الجلسة التالية. وإذا كان ينبغي أن تكون Skill مرئية فقط لوكلاء محددين، فاقرن ذلك مع `agents.defaults.skills` أو `agents.list[].skills`.
  </Accordion>

  <Accordion title="كيف يمكنني استخدام نماذج مختلفة لمهام مختلفة؟">
    الأنماط المدعومة اليوم هي:

    - **وظائف Cron**: يمكن للوظائف المعزولة ضبط تجاوز `model` لكل وظيفة.
    - **الوكلاء الفرعيون**: وجّه المهام إلى وكلاء منفصلين لديهم نماذج افتراضية مختلفة.
    - **التبديل عند الطلب**: استخدم `/model` للتبديل بين نماذج الجلسة الحالية في أي وقت.

    راجع [وظائف Cron](/ar/automation/cron-jobs)، و[التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="يتجمد الروبوت أثناء تنفيذ عمل ثقيل. كيف أنقل ذلك إلى مكان آخر؟">
    استخدم **وكلاء فرعيين** للمهام الطويلة أو المتوازية. يعمل الوكلاء الفرعيون في جلستهم الخاصة،
    ويعيدون ملخصًا، ويحافظون على استجابة الدردشة الرئيسية.

    اطلب من الروبوت "تشغيل وكيل فرعي لهذه المهمة" أو استخدم `/subagents`.
    واستخدم `/status` في الدردشة لمعرفة ما الذي ينفذه Gateway الآن (وما إذا كان مشغولًا).

    نصيحة خاصة بالرموز: تستهلك المهام الطويلة والوكلاء الفرعيون كلاهما رموزًا. وإذا كانت التكلفة مصدر قلق، فاضبط
    نموذجًا أرخص للوكلاء الفرعيين عبر `agents.defaults.subagents.model`.

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [المهام الخلفية](/ar/automation/tasks).

  </Accordion>

  <Accordion title="كيف تعمل جلسات الوكلاء الفرعيين المرتبطة بالمحادثات على Discord؟">
    استخدم ربط المحادثات. يمكنك ربط محادثة Discord بوكيل فرعي أو بهدف جلسة بحيث تبقى الرسائل اللاحقة في تلك المحادثة على الجلسة المرتبطة نفسها.

    التدفق الأساسي:

    - شغّل باستخدام `sessions_spawn` مع `thread: true` (واختياريًا `mode: "session"` للمتابعة المستمرة).
    - أو اربط يدويًا باستخدام `/focus <target>`.
    - استخدم `/agents` لفحص حالة الربط.
    - استخدم `/session idle <duration|off>` و`/session max-age <duration|off>` للتحكم في إلغاء التركيز التلقائي.
    - استخدم `/unfocus` لفصل المحادثة.

    الإعدادات المطلوبة:

    - الإعدادات الافتراضية العامة: `session.threadBindings.enabled` و`session.threadBindings.idleHours` و`session.threadBindings.maxAgeHours`.
    - تجاوزات Discord: `channels.discord.threadBindings.enabled` و`channels.discord.threadBindings.idleHours` و`channels.discord.threadBindings.maxAgeHours`.
    - الربط التلقائي عند التشغيل: اضبط `channels.discord.threadBindings.spawnSubagentSessions: true`.

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [Discord](/ar/channels/discord)، [مرجع الإعدادات](/ar/gateway/configuration-reference)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="انتهى وكيل فرعي، لكن تحديث الإكمال ذهب إلى المكان الخطأ أو لم يُنشر إطلاقًا. ما الذي يجب أن أتحقق منه؟">
    تحقّق أولًا من مسار الطالب الذي تم حسمه:

    - يفضّل تسليم الوكيل الفرعي في وضع الإكمال أي محادثة أو مسار محادثة مرتبط عندما يكون أحدهما موجودًا.
    - إذا كان أصل الإكمال يحمل قناة فقط، فإن OpenClaw يعود إلى المسار المخزن لجلسة الطالب (`lastChannel` / `lastTo` / `lastAccountId`) بحيث يظل التسليم المباشر ممكنًا.
    - إذا لم يوجد مسار مرتبط ولا مسار مخزن صالح للاستخدام، فقد يفشل التسليم المباشر وتعود النتيجة بدلًا من ذلك إلى تسليم الجلسة عبر الطابور بدلًا من النشر الفوري إلى الدردشة.
    - يمكن أن تؤدي الأهداف غير الصالحة أو القديمة أيضًا إلى فرض الرجوع إلى الطابور أو فشل التسليم النهائي.
    - إذا كان آخر رد مرئي من المساعد للطفل هو الرمز الصامت `NO_REPLY` / `no_reply` بالضبط، أو `ANNOUNCE_SKIP` بالضبط، فإن OpenClaw يتعمد كتم الإعلان بدلًا من نشر تقدم أقدم لم يعد صالحًا.
    - إذا انتهت مهلة الطفل بعد مكالمات أدوات فقط، فقد يختزل الإعلان ذلك إلى ملخص قصير للتقدم الجزئي بدلًا من إعادة عرض خرج الأدوات الخام.

    التصحيح:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [الوكلاء الفرعيون](/ar/tools/subagents)، [المهام الخلفية](/ar/automation/tasks)، [أدوات الجلسة](/ar/concepts/session-tool).

  </Accordion>

  <Accordion title="لا تعمل Cron أو التذكيرات. ما الذي يجب أن أتحقق منه؟">
    تعمل Cron داخل عملية Gateway. إذا لم يكن Gateway يعمل باستمرار،
    فلن تعمل الوظائف المجدولة.

    قائمة التحقق:

    - أكّد أن Cron مفعّل (`cron.enabled`) وأن `OPENCLAW_SKIP_CRON` غير مضبوط.
    - تحقّق من أن Gateway يعمل على مدار الساعة طوال أيام الأسبوع (من دون سكون/إعادة تشغيل).
    - تحقّق من إعدادات المنطقة الزمنية للوظيفة (`--tz` مقابل المنطقة الزمنية للمضيف).

    التصحيح:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    الوثائق: [وظائف Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="تم تشغيل Cron، لكن لم يُرسل شيء إلى القناة. لماذا؟">
    تحقّق أولًا من وضع التسليم:

    - `--no-deliver` / `delivery.mode: "none"` يعني أنه لا يُتوقع وجود رسالة خارجية.
    - غياب هدف إعلان صالح أو وجود هدف غير صالح (`channel` / `to`) يعني أن المشغّل تخطى التسليم الصادر.
    - تعني حالات فشل مصادقة القناة (`unauthorized` و`Forbidden`) أن المشغّل حاول التسليم لكن بيانات الاعتماد منعته.
    - النتيجة المعزولة الصامتة (`NO_REPLY` / `no_reply` فقط) تُعامل على أنها غير قابلة للتسليم عمدًا، لذلك يكتم المشغّل أيضًا تسليم الرجوع إلى الطابور.

    بالنسبة إلى وظائف Cron المعزولة، فإن المشغّل يملك التسليم النهائي. ويُتوقع من الوكيل
    أن يعيد ملخصًا نصيًا عاديًا ليقوم المشغّل بإرساله. إن `--no-deliver` يُبقي
    هذه النتيجة داخلية؛ ولا يسمح للوكيل بالإرسال مباشرةً باستخدام
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

    يمكن لـ Cron المعزولة أن تحتفظ بتحويل نموذج وقت التشغيل وتعيد المحاولة عندما
    يرمي التشغيل النشط `LiveSessionModelSwitchError`. وتحتفظ إعادة المحاولة
    بالموفّر/النموذج المُبدّل إليه، وإذا كان التبديل يحمل تجاوز ملف مصادقة جديدًا،
    فإن Cron تحتفظ به أيضًا قبل إعادة المحاولة.

    قواعد الاختيار ذات الصلة:

    - يفوز تجاوز نموذج hook في Gmail أولًا عند انطباقه.
    - ثم `model` لكل وظيفة.
    - ثم أي تجاوز نموذج مخزن لجلسة Cron.
    - ثم اختيار النموذج العادي للوكيل/الافتراضي.

    حلقة إعادة المحاولة محدودة. بعد المحاولة الأولية بالإضافة إلى محاولتي تبديل،
    تُجهض Cron بدلًا من الدخول في حلقة لا نهائية.

    التصحيح:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    الوثائق: [وظائف Cron](/ar/automation/cron-jobs)، [Cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="كيف أثبّت Skills على Linux؟">
    استخدم أوامر `openclaw skills` الأصلية أو أسقط Skills داخل مساحة العمل. لا تتوفر واجهة Skills الخاصة بـ macOS على Linux.
    تصفّح Skills على [https://clawhub.ai](https://clawhub.ai).

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

    تقوم عملية التثبيت الأصلية `openclaw skills install` بالكتابة إلى دليل `skills/`
    في مساحة العمل النشطة. ثبّت CLI المنفصل `clawhub` فقط إذا كنت تريد نشر
    Skills الخاصة بك أو مزامنتها. ولأجل التثبيتات المشتركة عبر الوكلاء، ضع Skill تحت
    `~/.openclaw/skills` واستخدم `agents.defaults.skills` أو
    `agents.list[].skills` إذا كنت تريد تضييق نطاق الوكلاء الذين يمكنهم رؤيتها.

  </Accordion>

  <Accordion title="هل يمكن لـ OpenClaw تشغيل المهام وفق جدول أو باستمرار في الخلفية؟">
    نعم. استخدم مجدول Gateway:

    - **وظائف Cron** للمهام المجدولة أو المتكررة (تستمر عبر إعادة التشغيل).
    - **Heartbeat** من أجل فحوصات دورية "للجلسة الرئيسية".
    - **الوظائف المعزولة** للوكلاء المستقلين الذين ينشرون ملخصات أو يسلّمون إلى الدردشات.

    الوثائق: [وظائف Cron](/ar/automation/cron-jobs)، [الأتمتة والمهام](/ar/automation)،
    [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل Skills الخاصة بـ Apple macOS فقط من Linux؟">
    ليس مباشرةً. يتم تقييد Skills الخاصة بـ macOS بواسطة `metadata.openclaw.os` بالإضافة إلى الملفات الثنائية المطلوبة، ولا تظهر Skills في مطالبة النظام إلا عندما تكون مؤهلة على **مضيف Gateway**. على Linux، لن تُحمّل Skills الخاصة بـ `darwin` فقط (مثل `apple-notes` و`apple-reminders` و`things-mac`) ما لم تتجاوز هذا التقييد.

    لديك ثلاثة أنماط مدعومة:

    **الخيار A - تشغيل Gateway على جهاز Mac (الأبسط).**
    شغّل Gateway حيث توجد الملفات الثنائية الخاصة بـ macOS، ثم اتصل من Linux في [الوضع البعيد](#gateway-ports-already-running-and-remote-mode) أو عبر Tailscale. تُحمّل Skills بشكل طبيعي لأن مضيف Gateway يعمل بنظام macOS.

    **الخيار B - استخدام Node يعمل على macOS (من دون SSH).**
    شغّل Gateway على Linux، ثم اقترن مع Node يعمل على macOS (تطبيق شريط القوائم)، واضبط **Node Run Commands** على "Always Ask" أو "Always Allow" على جهاز Mac. يمكن لـ OpenClaw أن يتعامل مع Skills الخاصة بـ macOS فقط على أنها مؤهلة عندما تكون الملفات الثنائية المطلوبة موجودة على Node. ويشغّل الوكيل تلك Skills عبر أداة `nodes`. وإذا اخترت "Always Ask"، فإن الموافقة على "Always Allow" في المطالبة تضيف ذلك الأمر إلى قائمة السماح.

    **الخيار C - تمرير الملفات الثنائية الخاصة بـ macOS عبر SSH (متقدم).**
    أبقِ Gateway على Linux، لكن اجعل الملفات الثنائية المطلوبة في CLI تُحل إلى أغلفة SSH تعمل على جهاز Mac. ثم تجاوز Skill للسماح بـ Linux حتى تظل مؤهلة.

    1. أنشئ غلاف SSH للملف الثنائي (مثال: `memo` لـ Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. ضع الغلاف على `PATH` على مضيف Linux (على سبيل المثال `~/bin/memo`).
    3. تجاوز بيانات Skill الوصفية (في مساحة العمل أو `~/.openclaw/skills`) للسماح بـ Linux:

       ```markdown
       ---
       name: apple-notes
       description: إدارة Apple Notes عبر CLI `memo` على macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. ابدأ جلسة جديدة حتى يتم تحديث لقطة Skills.

  </Accordion>

  <Accordion title="هل لديكم تكامل مع Notion أو HeyGen؟">
    ليس مضمّنًا حاليًا.

    الخيارات:

    - **Skill / Plugin مخصص:** الأفضل للوصول الموثوق إلى API (كل من Notion وHeyGen لديهما APIs).
    - **أتمتة المتصفح:** تعمل من دون شيفرة، لكنها أبطأ وأكثر هشاشة.

    إذا كنت تريد الحفاظ على السياق لكل عميل (سير عمل الوكالة)، فهناك نمط بسيط:

    - صفحة Notion واحدة لكل عميل (السياق + التفضيلات + العمل النشط).
    - اطلب من الوكيل جلب تلك الصفحة عند بداية الجلسة.

    إذا كنت تريد تكاملًا أصليًا، فافتح طلب ميزة أو ابنِ Skill
    تستهدف تلك APIs.

    ثبّت Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    تصل عمليات التثبيت الأصلية إلى دليل `skills/` في مساحة العمل النشطة. أما بالنسبة إلى Skills المشتركة عبر الوكلاء، فضعها في `~/.openclaw/skills/<name>/SKILL.md`. وإذا كان ينبغي أن ترى بعض الوكلاء فقط التثبيت المشترك، فاضبط `agents.defaults.skills` أو `agents.list[].skills`. وتتوقع بعض Skills وجود ملفات ثنائية مثبتة عبر Homebrew؛ وعلى Linux يعني هذا Linuxbrew (راجع إدخال الأسئلة الشائعة الخاص بـ Homebrew على Linux أعلاه). راجع [Skills](/ar/tools/skills)، و[إعداد Skills](/ar/tools/skills-config)، و[ClawHub](/ar/tools/clawhub).

  </Accordion>

  <Accordion title="كيف أستخدم Chrome المسجّل دخوله بالفعل مع OpenClaw؟">
    استخدم ملف Browser الشخصي المضمّن `user`، والذي يرتبط عبر Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    إذا كنت تريد اسمًا مخصصًا، فأنشئ ملف MCP صريحًا:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    يمكن لهذا المسار استخدام متصفح المضيف المحلي أو Browser Node متصل. وإذا كان Gateway يعمل في مكان آخر، فإمّا أن تشغّل مضيف Node على جهاز المتصفح أو تستخدم CDP بعيدًا بدلًا من ذلك.

    الحدود الحالية لـ `existing-session` / `user`:

    - الإجراءات تعتمد على المرجع، وليس على محددات CSS
    - تتطلب عمليات الرفع `ref` / `inputRef` وتدعم حاليًا ملفًا واحدًا في كل مرة
    - ما تزال `responsebody` وتصدير PDF واعتراض التنزيلات والإجراءات الدفعية تتطلب متصفحًا مُدارًا أو ملف CDP خام

  </Accordion>
</AccordionGroup>

## العزل والذاكرة

<AccordionGroup>
  <Accordion title="هل توجد وثيقة مخصصة للعزل؟">
    نعم. راجع [العزل](/ar/gateway/sandboxing). وللإعداد الخاص بـ Docker (Gateway كامل داخل Docker أو صور العزل)، راجع [Docker](/ar/install/docker).
  </Accordion>

  <Accordion title="يبدو Docker محدودًا - كيف أفعّل الميزات الكاملة؟">
    تعتمد الصورة الافتراضية نهج الأمان أولًا وتعمل تحت المستخدم `node`، لذلك فهي لا
    تتضمن حزم النظام أو Homebrew أو المتصفحات المضمّنة. وللحصول على إعداد أكثر اكتمالًا:

    - اجعل `/home/node` مستمرًا باستخدام `OPENCLAW_HOME_VOLUME` حتى تبقى الذاكرات المؤقتة.
    - ضمّن تبعيات النظام داخل الصورة باستخدام `OPENCLAW_DOCKER_APT_PACKAGES`.
    - ثبّت متصفحات Playwright عبر CLI المضمّن:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - اضبط `PLAYWRIGHT_BROWSERS_PATH` وتأكد من أن المسار مستمر.

    الوثائق: [Docker](/ar/install/docker)، [Browser](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل يمكنني إبقاء الرسائل المباشرة شخصية لكن جعل المجموعات عامة/معزولة باستخدام وكيل واحد؟">
    نعم - إذا كانت حركة المرور الخاصة بك هي **الرسائل المباشرة** وكانت الحركة العامة هي **المجموعات**.

    استخدم `agents.defaults.sandbox.mode: "non-main"` بحيث تعمل جلسات المجموعات/القنوات (المفاتيح غير الرئيسية) داخل Docker، بينما تظل جلسة الرسائل المباشرة الرئيسية على المضيف. ثم قيّد الأدوات المتاحة في الجلسات المعزولة عبر `tools.sandbox.tools`.

    شرح الإعداد + مثال على الإعدادات: [المجموعات: رسائل مباشرة شخصية + مجموعات عامة](/ar/channels/groups#pattern-personal-dms-public-groups-single-agent)

    مرجع الإعدادات الأساسي: [إعدادات Gateway](/ar/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="كيف أربط مجلدًا من المضيف داخل العزل؟">
    اضبط `agents.defaults.sandbox.docker.binds` على `["host:path:mode"]` (مثل `"/home/user/src:/src:ro"`). يتم دمج الارتباطات العامة وارتباطات كل وكيل؛ ويتم تجاهل ارتباطات كل وكيل عندما تكون `scope: "shared"`. استخدم `:ro` لأي شيء حساس، وتذكر أن الارتباطات تتجاوز جدران نظام ملفات العزل.

    يقوم OpenClaw بالتحقق من مصادر bind مقابل كل من المسار المُطبَّع والمسار القانوني الذي يتم حله عبر أعمق أصل موجود. وهذا يعني أن محاولات الإفلات عبر أصل symlink تظل مغلقة افتراضيًا حتى عندما لا يكون الجزء الأخير من المسار موجودًا بعد، كما أن فحوصات الجذر المسموح به تظل مطبقة بعد حل symlink.

    راجع [العزل](/ar/gateway/sandboxing#custom-bind-mounts) و[العزل مقابل سياسة الأداة مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) للاطلاع على أمثلة وملاحظات الأمان.

  </Accordion>

  <Accordion title="كيف تعمل الذاكرة؟">
    ذاكرة OpenClaw هي ببساطة ملفات Markdown في مساحة عمل الوكيل:

    - ملاحظات يومية في `memory/YYYY-MM-DD.md`
    - ملاحظات منسقة طويلة الأمد في `MEMORY.md` (للجلسات الرئيسية/الخاصة فقط)

    كما يشغّل OpenClaw **تفريغًا صامتًا للذاكرة قبل Compaction** لتذكير النموذج
    بكتابة ملاحظات دائمة قبل Compaction التلقائي. ولا يعمل هذا إلا عندما تكون مساحة العمل
    قابلة للكتابة (أما البيئات المعزولة للقراءة فقط فتتخطاه). راجع [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="الذاكرة تستمر في نسيان الأشياء. كيف أجعلها ثابتة؟">
    اطلب من الروبوت **كتابة الحقيقة في الذاكرة**. يجب أن تذهب الملاحظات طويلة الأمد إلى `MEMORY.md`،
    بينما يذهب السياق قصير الأمد إلى `memory/YYYY-MM-DD.md`.

    ما يزال هذا مجالًا نعمل على تحسينه. ومن المفيد تذكير النموذج بتخزين الذكريات؛
    فهو سيعرف ما الذي يجب فعله. وإذا استمر في النسيان، فتحقق من أن Gateway يستخدم مساحة العمل نفسها
    في كل تشغيل.

    الوثائق: [الذاكرة](/ar/concepts/memory)، [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="هل تستمر الذاكرة إلى الأبد؟ ما الحدود؟">
    تعيش ملفات الذاكرة على القرص وتستمر إلى أن تحذفها. والحد هنا هو
    مساحة التخزين لديك، وليس النموذج. أما **سياق الجلسة** فلا يزال محدودًا بنافذة سياق
    النموذج، لذلك قد يتم ضغط المحادثات الطويلة أو اقتطاعها. ولهذا السبب
    يوجد البحث في الذاكرة - فهو يعيد فقط الأجزاء ذات الصلة إلى السياق.

    الوثائق: [الذاكرة](/ar/concepts/memory)، [السياق](/ar/concepts/context).

  </Accordion>

  <Accordion title="هل يتطلب البحث الدلالي في الذاكرة مفتاح OpenAI API؟">
    فقط إذا كنت تستخدم **تضمينات OpenAI**. تغطي Codex OAuth الدردشة/الإكمالات و
    **لا** تمنح وصولًا إلى التضمينات، لذا فإن **تسجيل الدخول باستخدام Codex (OAuth أو
    تسجيل دخول Codex CLI)** لا يساعد في البحث الدلالي في الذاكرة. ولا تزال تضمينات OpenAI
    تحتاج إلى مفتاح API حقيقي (`OPENAI_API_KEY` أو `models.providers.openai.apiKey`).

    إذا لم تضبط موفّرًا صراحةً، فسيختار OpenClaw موفّرًا تلقائيًا عندما
    يتمكن من حل مفتاح API (ملفات المصادقة، أو `models.providers.*.apiKey`، أو متغيرات البيئة).
    وهو يفضّل OpenAI إذا أمكن حل مفتاح OpenAI، وإلا Gemini إذا أمكن حل مفتاح Gemini،
    ثم Voyage، ثم Mistral. وإذا لم يكن أي مفتاح بعيد متاحًا، فسيظل البحث في
    الذاكرة معطّلًا حتى تقوم بتكوينه. وإذا كان لديك مسار نموذج محلي
    مضبوط وموجود، فإن OpenClaw
    يفضّل `local`. كما أن Ollama مدعوم عندما تضبط صراحةً
    `memorySearch.provider = "ollama"`.

    إذا كنت تفضّل البقاء محليًا، فاضبط `memorySearch.provider = "local"` (واختياريًا
    `memorySearch.fallback = "none"`). وإذا كنت تريد تضمينات Gemini، فاضبط
    `memorySearch.provider = "gemini"` ووفّر `GEMINI_API_KEY` (أو
    `memorySearch.remote.apiKey`). نحن ندعم نماذج التضمين من **OpenAI وGemini وVoyage وMistral وOllama أو local**
    - راجع [الذاكرة](/ar/concepts/memory) للحصول على تفاصيل الإعداد.

  </Accordion>
</AccordionGroup>

## مكان وجود الأشياء على القرص

<AccordionGroup>
  <Accordion title="هل تُحفَظ كل البيانات المستخدمة مع OpenClaw محليًا؟">
    لا - **حالة OpenClaw محلية**، لكن **الخدمات الخارجية ما تزال ترى ما ترسله إليها**.

    - **محلي افتراضيًا:** تعيش الجلسات وملفات الذاكرة والإعدادات ومساحة العمل على مضيف Gateway
      (`~/.openclaw` + دليل مساحة العمل لديك).
    - **بعيد بالضرورة:** الرسائل التي ترسلها إلى موفري النماذج (Anthropic/OpenAI/إلخ) تذهب إلى
      APIs الخاصة بهم، كما أن منصات الدردشة (WhatsApp/Telegram/Slack/إلخ) تخزن بيانات الرسائل على
      خوادمها.
    - **أنت تتحكم في الأثر:** يؤدي استخدام النماذج المحلية إلى إبقاء المطالبات على جهازك، لكن
      حركة القنوات ما تزال تمر عبر خوادم القناة.

    ذو صلة: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="أين يخزن OpenClaw بياناته؟">
    كل شيء يعيش تحت `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`):

    | المسار                                                            | الغرض                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | الإعداد الرئيسي (JSON5)                                            |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | استيراد OAuth قديم (يُنسخ إلى ملفات المصادقة عند أول استخدام)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | ملفات المصادقة (OAuth، ومفاتيح API، و`keyRef`/`tokenRef` الاختياريان) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | حمولة سرية اختيارية معتمدة على الملف لموفري `file` في SecretRef     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | ملف توافق قديم (تُزال منه إدخالات `api_key` الثابتة)               |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | حالة الموفّر (مثل `whatsapp/<accountId>/creds.json`)               |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | حالة كل وكيل (agentDir + الجلسات)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | سجل المحادثات والحالة (لكل وكيل)                                   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | بيانات الجلسة الوصفية (لكل وكيل)                                   |

    المسار القديم لوكيل واحد: `~/.openclaw/agent/*` (يُرحَّل بواسطة `openclaw doctor`).

    أما **مساحة العمل** لديك (`AGENTS.md` وملفات الذاكرة وSkills وما إلى ذلك) فهي منفصلة ويجري تكوينها عبر `agents.defaults.workspace` (الافتراضي: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="أين يجب أن توجد AGENTS.md / SOUL.md / USER.md / MEMORY.md؟">
    تعيش هذه الملفات في **مساحة عمل الوكيل**، وليس في `~/.openclaw`.

    - **مساحة العمل (لكل وكيل)**: `AGENTS.md` و`SOUL.md` و`IDENTITY.md` و`USER.md`،
      و`MEMORY.md` (أو المسار القديم الاحتياطي `memory.md` عندما لا يكون `MEMORY.md` موجودًا)،
      و`memory/YYYY-MM-DD.md`، و`HEARTBEAT.md` اختياري.
    - **دليل الحالة (`~/.openclaw`)**: الإعدادات، وحالة القناة/الموفّر، وملفات المصادقة، والجلسات، والسجلات،
      وSkills المشتركة (`~/.openclaw/skills`).

    مساحة العمل الافتراضية هي `~/.openclaw/workspace`، ويمكن ضبطها عبر:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    إذا كان الروبوت "ينسى" بعد إعادة التشغيل، فتأكد من أن Gateway يستخدم نفس
    مساحة العمل في كل تشغيل (وتذكّر: يستخدم الوضع البعيد مساحة عمل **مضيف Gateway**
    وليس مساحة عمل حاسوبك المحمول المحلي).

    نصيحة: إذا كنت تريد سلوكًا أو تفضيلًا دائمًا، فاطلب من الروبوت **كتابته في
    AGENTS.md أو MEMORY.md** بدلًا من الاعتماد على سجل الدردشة.

    راجع [مساحة عمل الوكيل](/ar/concepts/agent-workspace) و[الذاكرة](/ar/concepts/memory).

  </Accordion>

  <Accordion title="استراتيجية النسخ الاحتياطي الموصى بها">
    ضع **مساحة عمل الوكيل** في مستودع git **خاص** واحتفظ بنسخة احتياطية منها في مكان
    خاص (مثل GitHub الخاص). فهذا يلتقط ملفات الذاكرة وAGENTS/SOUL/USER
    ويتيح لك استعادة "عقل" المساعد لاحقًا.

    **لا** تُجرِ commit لأي شيء تحت `~/.openclaw` (بيانات الاعتماد، أو الجلسات، أو الرموز المميزة، أو الحمولات السرية المشفرة).
    وإذا كنت تحتاج إلى استعادة كاملة، فانسخ مساحة العمل ودليل الحالة
    احتياطيًا بشكل منفصل (راجع سؤال الترحيل أعلاه).

    الوثائق: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Accordion>

  <Accordion title="كيف أزيل OpenClaw بالكامل؟">
    راجع الدليل المخصص: [إلغاء التثبيت](/ar/install/uninstall).
  </Accordion>

  <Accordion title="هل يمكن للوكلاء العمل خارج مساحة العمل؟">
    نعم. إن مساحة العمل هي **cwd الافتراضي** ومرساة الذاكرة، وليست عزلًا صارمًا.
    تُحل المسارات النسبية داخل مساحة العمل، لكن يمكن للمسارات المطلقة الوصول إلى
    مواقع أخرى على المضيف ما لم يكن العزل مفعّلًا. وإذا كنت بحاجة إلى عزل، فاستخدم
    [`agents.defaults.sandbox`](/ar/gateway/sandboxing) أو إعدادات العزل لكل وكيل. وإذا كنت
    تريد أن يكون المستودع هو دليل العمل الافتراضي، فوجّه
    `workspace` لذلك الوكيل إلى جذر المستودع. إن مستودع OpenClaw هو مجرد
    شيفرة مصدرية؛ لذا أبقِ مساحة العمل منفصلة ما لم تكن تريد عمدًا أن يعمل الوكيل بداخله.

    مثال (المستودع كـ cwd افتراضي):

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

## أساسيات الإعدادات

<AccordionGroup>
  <Accordion title="ما تنسيق الإعدادات؟ وأين توجد؟">
    يقرأ OpenClaw ملف إعدادات اختياريًا بصيغة **JSON5** من `$OPENCLAW_CONFIG_PATH` (الافتراضي: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    وإذا كان الملف مفقودًا، فإنه يستخدم إعدادات افتراضية آمنة إلى حد ما (بما في ذلك مساحة عمل افتراضية هي `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='ضبطت gateway.bind: "lan" (أو "tailnet") والآن لا يوجد شيء يستمع / تقول واجهة المستخدم unauthorized'>
    تتطلب أوضاع الربط غير loopback **مسار مصادقة صالح لـ Gateway**. وعمليًا يعني ذلك:

    - مصادقة shared-secret: رمز مميز أو كلمة مرور
    - `gateway.auth.mode: "trusted-proxy"` خلف وكيل عكسي مدرك للهوية ومكوَّن بشكل صحيح وغير مربوط بـ loopback

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

    - لا يؤدي `gateway.remote.token` / `.password` إلى تمكين مصادقة Gateway المحلية بمفردهما.
    - يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كخيار احتياطي فقط عندما لا يكون `gateway.auth.*` مضبوطًا.
    - بالنسبة إلى مصادقة كلمة المرور، اضبط `gateway.auth.mode: "password"` مع `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`) بدلًا من ذلك.
    - إذا تم تكوين `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef وتعذر حلهما، فإن الحل يفشل بشكل مغلق افتراضيًا (من دون إخفاء احتياطي بعيد).
    - تُجري إعدادات shared-secret في Control UI المصادقة عبر `connect.params.auth.token` أو `connect.params.auth.password` (المخزَّنين في إعدادات التطبيق/واجهة المستخدم). أما الأوضاع المعتمدة على الهوية مثل Tailscale Serve أو `trusted-proxy` فتستخدم رؤوس الطلبات بدلًا من ذلك. تجنب وضع shared secrets داخل عناوين URL.
    - مع `gateway.auth.mode: "trusted-proxy"`، فإن الوكلاء العكسية على المضيف نفسه والمربوطة بـ loopback ما تزال **لا** تفي بمصادقة trusted-proxy. يجب أن يكون trusted proxy مصدرًا غير loopback ومكوَّنًا.

  </Accordion>

  <Accordion title="لماذا أحتاج إلى رمز مميز على localhost الآن؟">
    يفرض OpenClaw مصادقة Gateway افتراضيًا، بما في ذلك loopback. وفي المسار الافتراضي المعتاد، يعني ذلك مصادقة الرمز المميز: فإذا لم يتم تكوين مسار مصادقة صريح، فإن بدء تشغيل Gateway يحل إلى وضع الرمز المميز ويولّد واحدًا تلقائيًا ويحفظه في `gateway.auth.token`، لذلك **يجب على عملاء WS المحليين إجراء المصادقة**. وهذا يمنع العمليات المحلية الأخرى من استدعاء Gateway.

    إذا كنت تفضّل مسار مصادقة مختلفًا، فيمكنك اختيار وضع كلمة المرور صراحةً (أو `trusted-proxy` للوكلاء العكسية غير loopback والمدركة للهوية). وإذا كنت **حقًا** تريد loopback مفتوحًا، فاضبط `gateway.auth.mode: "none"` صراحةً في إعداداتك. ويمكن لـ Doctor أن يولّد رمزًا مميزًا لك في أي وقت: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="هل يجب أن أعيد التشغيل بعد تغيير الإعدادات؟">
    يراقب Gateway الإعدادات ويدعم إعادة التحميل السريع:

    - `gateway.reload.mode: "hybrid"` (الافتراضي): يطبّق التغييرات الآمنة فورًا، ويعيد التشغيل للتغييرات الحرجة
    - كما أن الأوضاع `hot` و`restart` و`off` مدعومة أيضًا

  </Accordion>

  <Accordion title="كيف أعطّل العبارات الطريفة في CLI؟">
    اضبط `cli.banner.taglineMode` في الإعدادات:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: يخفي نص العبارة التعريفية لكنه يُبقي سطر عنوان الشعار/الإصدار.
    - `default`: يستخدم `All your chats, one OpenClaw.` في كل مرة.
    - `random`: عبارات تعريفية طريفة/موسمية متناوبة (السلوك الافتراضي).
    - إذا كنت لا تريد أي شعار إطلاقًا، فاضبط متغير البيئة `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="كيف أفعّل البحث في الويب (وجلب الويب)؟">
    يعمل `web_fetch` من دون مفتاح API. أما `web_search` فيعتمد على
    الموفّر الذي اخترته:

    - يتطلب الموفّرون المعتمدون على API مثل Brave وExa وFirecrawl وGemini وGrok وKimi وMiniMax Search وPerplexity وTavily إعداد مفتاح API المعتاد.
    - لا يحتاج Ollama Web Search إلى مفتاح، لكنه يستخدم مضيف Ollama الذي قمت بتكوينه ويتطلب `ollama signin`.
    - لا يحتاج DuckDuckGo إلى مفتاح، لكنه تكامل غير رسمي قائم على HTML.
    - SearXNG لا يحتاج إلى مفتاح/ويمكن استضافته ذاتيًا؛ اضبط `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl`.

    **الموصى به:** شغّل `openclaw configure --section web` واختر موفّرًا.
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

    أصبح إعداد البحث في الويب الخاص بكل موفّر موجودًا الآن تحت `plugins.entries.<plugin>.config.webSearch.*`.
    وما تزال مسارات الموفّر القديمة `tools.web.search.*` تُحمَّل مؤقتًا من أجل التوافق، لكن لا ينبغي استخدامها في الإعدادات الجديدة.
    يوجد إعداد الرجوع إلى Firecrawl لجلب الويب تحت `plugins.entries.firecrawl.config.webFetch.*`.

    ملاحظات:

    - إذا كنت تستخدم قوائم السماح، فأضف `web_search`/`web_fetch`/`x_search` أو `group:web`.
    - يكون `web_fetch` مفعّلًا افتراضيًا (ما لم يتم تعطيله صراحةً).
    - إذا لم يتم تحديد `tools.web.fetch.provider`، فإن OpenClaw يكتشف تلقائيًا أول موفّر رجوع جاهز للجلب من بيانات الاعتماد المتاحة. والموفّر المضمّن اليوم هو Firecrawl.
    - تقرأ العمليات الخلفية متغيرات البيئة من `~/.openclaw/.env` (أو من بيئة الخدمة).

    الوثائق: [أدوات الويب](/ar/tools/web).

  </Accordion>

  <Accordion title="لقد مسح config.apply إعداداتي. كيف أستعيدها وأتجنب هذا؟">
    يستبدل `config.apply` **الإعدادات بالكامل**. وإذا أرسلت كائنًا جزئيًا، فسيُزال كل شيء
    آخر.

    الاستعادة:

    - استعدها من نسخة احتياطية (git أو نسخة من `~/.openclaw/openclaw.json`).
    - إذا لم تكن لديك نسخة احتياطية، فأعد تشغيل `openclaw doctor` وأعد تكوين القنوات/النماذج.
    - إذا كان هذا غير متوقع، فافتح بلاغ خطأ وأدرج آخر إعدادات معروفة لديك أو أي نسخة احتياطية.
    - يمكن لوكيل برمجي محلي في كثير من الأحيان إعادة بناء إعدادات عاملة من السجلات أو السجل.

    تجنّبه:

    - استخدم `openclaw config set` للتغييرات الصغيرة.
    - استخدم `openclaw configure` للتعديلات التفاعلية.
    - استخدم `config.schema.lookup` أولًا عندما لا تكون متأكدًا من المسار الدقيق أو شكل الحقل؛ فهو يعيد عقدة مخطط سطحية بالإضافة إلى ملخصات الأبناء المباشرين للتعمق.
    - استخدم `config.patch` لتعديلات RPC الجزئية؛ وأبقِ `config.apply` لاستبدال الإعدادات الكاملة فقط.
    - إذا كنت تستخدم أداة `gateway` المخصصة للمالك فقط من تشغيل وكيل، فستظل ترفض الكتابة إلى `tools.exec.ask` / `tools.exec.security` (بما في ذلك الأسماء المستعارة القديمة `tools.bash.*` التي تُطبَّع إلى مسارات exec المحمية نفسها).

    الوثائق: [الإعدادات](/cli/config)، [Configure](/cli/configure)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="كيف أشغّل Gateway مركزيًا مع عمال متخصصين عبر الأجهزة؟">
    النمط الشائع هو **Gateway واحد** (مثل Raspberry Pi) بالإضافة إلى **Nodes** و**وكلاء**:

    - **Gateway (مركزي):** يملك القنوات (Signal/WhatsApp)، والتوجيه، والجلسات.
    - **Nodes (الأجهزة):** تتصل أجهزة Mac/iOS/Android كأجهزة طرفية وتكشف الأدوات المحلية (`system.run` و`canvas` و`camera`).
    - **Agents (العمال):** عقول/مساحات عمل منفصلة لأدوار متخصصة (مثل "عمليات Hetzner" أو "البيانات الشخصية").
    - **الوكلاء الفرعيون:** شغّل عملاً في الخلفية من وكيل رئيسي عندما تريد التوازي.
    - **TUI:** اتصل بـ Gateway وبدّل بين الوكلاء/الجلسات.

    الوثائق: [Nodes](/ar/nodes)، [الوصول البعيد](/ar/gateway/remote)، [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [TUI](/web/tui).

  </Accordion>

  <Accordion title="هل يمكن لمتصفح OpenClaw أن يعمل في وضع headless؟">
    نعم. إنه خيار ضمن الإعدادات:

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

    القيمة الافتراضية هي `false` (مع واجهة مرئية). ومن المرجح أكثر أن يثير وضع headless فحوصات مكافحة الروبوت في بعض المواقع. راجع [Browser](/ar/tools/browser).

    يستخدم وضع headless **محرك Chromium نفسه** ويعمل مع معظم عمليات الأتمتة (النماذج، والنقرات، والكشط، وتسجيلات الدخول). والاختلافات الرئيسية هي:

    - لا توجد نافذة متصفح مرئية (استخدم لقطات الشاشة إذا كنت تحتاج إلى عناصر مرئية).
    - بعض المواقع أكثر تشددًا بشأن الأتمتة في وضع headless (CAPTCHAs، ومكافحة الروبوت).
      على سبيل المثال، غالبًا ما يحظر X/Twitter الجلسات headless.

  </Accordion>

  <Accordion title="كيف أستخدم Brave للتحكم في المتصفح؟">
    اضبط `browser.executablePath` على الملف الثنائي لـ Brave لديك (أو أي متصفح آخر قائم على Chromium) ثم أعد تشغيل Gateway.
    راجع أمثلة الإعدادات الكاملة في [Browser](/ar/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways البعيدة وNodes

<AccordionGroup>
  <Accordion title="كيف تنتشر الأوامر بين Telegram وGateway وNodes؟">
    تتعامل **Gateway** مع رسائل Telegram. وتشغّل Gateway الوكيل
    ثم فقط تستدعي Nodes عبر **Gateway WebSocket** عندما تكون هناك حاجة إلى أداة Node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    لا ترى Nodes حركة المرور الواردة من الموفّر؛ فهي تستقبل فقط استدعاءات RPC الخاصة بـ Node.

  </Accordion>

  <Accordion title="كيف يمكن لوكيلي الوصول إلى حاسوبي إذا كان Gateway مستضافًا عن بُعد؟">
    الإجابة المختصرة: **اقرن حاسوبك باعتباره Node**. يعمل Gateway في مكان آخر، لكنه يستطيع
    استدعاء أدوات `node.*` (الشاشة، الكاميرا، النظام) على جهازك المحلي عبر Gateway WebSocket.

    الإعداد النموذجي:

    1. شغّل Gateway على المضيف الذي يعمل دائمًا (VPS/خادم منزلي).
    2. ضع مضيف Gateway + حاسوبك على نفس Tailnet.
    3. تأكد من أن Gateway WS قابلة للوصول (ربط tailnet أو نفق SSH).
    4. افتح تطبيق macOS محليًا واتصل في وضع **Remote over SSH** (أو عبر tailnet مباشر)
       حتى يتمكن من التسجيل باعتباره Node.
    5. وافق على Node في Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    لا يلزم أي جسر TCP منفصل؛ إذ تتصل Nodes عبر Gateway WebSocket.

    تذكير أمني: إن إقران Node يعمل على macOS يتيح `system.run` على ذلك الجهاز. لا
    تقرن إلا الأجهزة التي تثق بها، وراجع [الأمان](/ar/gateway/security).

    الوثائق: [Nodes](/ar/nodes)، [بروتوكول Gateway](/ar/gateway/protocol)، [الوضع البعيد على macOS](/ar/platforms/mac/remote)، [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="Tailscale متصل لكنني لا أتلقى أي ردود. ماذا الآن؟">
    تحقّق من الأساسيات:

    - تعمل Gateway: `openclaw gateway status`
    - صحة Gateway: `openclaw status`
    - صحة القناة: `openclaw channels status`

    ثم تحقّق من المصادقة والتوجيه:

    - إذا كنت تستخدم Tailscale Serve، فتأكد من أن `gateway.auth.allowTailscale` مضبوط بشكل صحيح.
    - إذا كنت تتصل عبر نفق SSH، فأكّد أن النفق المحلي قائم ويشير إلى المنفذ الصحيح.
    - أكّد أن قوائم السماح لديك (DM أو المجموعة) تتضمن حسابك.

    الوثائق: [Tailscale](/ar/gateway/tailscale)، [الوصول البعيد](/ar/gateway/remote)، [القنوات](/ar/channels).

  </Accordion>

  <Accordion title="هل يمكن لنسختين من OpenClaw التحدث إلى بعضهما البعض (محلية + VPS)؟">
    نعم. لا يوجد جسر "روبوت إلى روبوت" مضمّن، لكن يمكنك توصيل ذلك بعدة
    طرق موثوقة:

    **الأبسط:** استخدم قناة دردشة عادية يستطيع الروبوتان الوصول إليها (Telegram/Slack/WhatsApp).
    واجعل الروبوت A يرسل رسالة إلى الروبوت B، ثم دع الروبوت B يرد كالمعتاد.

    **جسر CLI (عام):** شغّل برنامجًا نصيًا يستدعي Gateway الأخرى باستخدام
    `openclaw agent --message ... --deliver`، مستهدفًا دردشة يستمع فيها الروبوت الآخر.
    وإذا كان أحد الروبوتين يعمل على VPS بعيد، فوجّه CLI لديك إلى Gateway البعيدة تلك
    عبر SSH/Tailscale (راجع [الوصول البعيد](/ar/gateway/remote)).

    نمط مثالي (شغّله من جهاز يمكنه الوصول إلى Gateway المستهدفة):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    نصيحة: أضف حاجزًا وقائيًا حتى لا يدخل الروبوتان في حلقة لا نهائية (الرد عند الإشارة فقط، أو
    قوائم سماح القنوات، أو قاعدة "لا ترد على رسائل الروبوت").

    الوثائق: [الوصول البعيد](/ar/gateway/remote)، [Agent CLI](/cli/agent)، [إرسال الوكيل](/ar/tools/agent-send).

  </Accordion>

  <Accordion title="هل أحتاج إلى VPSات منفصلة لوكلاء متعددين؟">
    لا. يمكن لـ Gateway واحدة استضافة وكلاء متعددين، لكل واحد منهم مساحة العمل، والنماذج الافتراضية،
    والتوجيه الخاص به. وهذا هو الإعداد الطبيعي، كما أنه أرخص بكثير وأبسط من تشغيل
    VPS واحدة لكل وكيل.

    استخدم VPSات منفصلة فقط عندما تحتاج إلى عزل صارم (حدود أمنية) أو
    إعدادات مختلفة جدًا لا تريد مشاركتها. وخلاف ذلك، فأبقِ Gateway واحدة
    واستخدم عدة وكلاء أو وكلاء فرعيين.

  </Accordion>

  <Accordion title="هل توجد فائدة من استخدام Node على حاسوبي المحمول الشخصي بدلًا من SSH من VPS؟">
    نعم - تُعد Nodes الطريقة الأساسية للوصول إلى حاسوبك المحمول من Gateway بعيدة، وهي
    تتيح أكثر من مجرد وصول إلى shell. تعمل Gateway على macOS/Linux (وWindows عبر WSL2)، وهي
    خفيفة الوزن (يكفي VPS صغير أو جهاز من فئة Raspberry Pi؛ و4 GB RAM أكثر من كافية)، لذا فإن
    الإعداد الشائع هو مضيف يعمل دائمًا بالإضافة إلى حاسوبك المحمول باعتباره Node.

    - **لا حاجة إلى SSH وارد.** تتصل Nodes إلى الخارج مع Gateway WebSocket وتستخدم اقتران الأجهزة.
    - **ضوابط تنفيذ أكثر أمانًا.** يتم تقييد `system.run` بواسطة قوائم السماح/الموافقات الخاصة بـ Node على ذلك الحاسوب المحمول.
    - **مزيد من أدوات الجهاز.** تكشف Nodes عن `canvas` و`camera` و`screen` بالإضافة إلى `system.run`.
    - **أتمتة متصفح محلية.** أبقِ Gateway على VPS، لكن شغّل Chrome محليًا عبر مضيف Node على الحاسوب المحمول، أو اربط Chrome المحلي على المضيف عبر Chrome MCP.

    إن SSH مناسب للوصول المؤقت إلى shell، لكن Nodes أبسط لسير عمل الوكلاء المستمر
    وأتمتة الأجهزة.

    الوثائق: [Nodes](/ar/nodes)، [Nodes CLI](/cli/nodes)، [Browser](/ar/tools/browser).

  </Accordion>

  <Accordion title="هل تُشغّل Nodes خدمة Gateway؟">
    لا. يجب تشغيل **Gateway واحدة** فقط لكل مضيف ما لم تكن تشغّل عمدًا ملفات تعريف معزولة (راجع [Gateways متعددة](/ar/gateway/multiple-gateways)). إن Nodes أجهزة طرفية تتصل
    بـ Gateway (مثل Nodes الخاصة بـ iOS/Android، أو "وضع Node" على macOS داخل تطبيق شريط القوائم). وبالنسبة إلى
    مضيفات Node بدون واجهة وتحكم CLI، راجع [Node host CLI](/cli/node).

    يتطلب الأمر إعادة تشغيل كاملة عند تغيير `gateway` أو `discovery` أو `canvasHost`.

  </Accordion>

  <Accordion title="هل توجد طريقة API / RPC لتطبيق الإعدادات؟">
    نعم.

    - `config.schema.lookup`: افحص شجرة فرعية واحدة من الإعدادات مع عقدة المخطط السطحية الخاصة بها، وتلميح واجهة المستخدم المطابق، وملخصات الأبناء المباشرين قبل الكتابة
    - `config.get`: اجلب اللقطة الحالية + hash
    - `config.patch`: تحديث جزئي آمن (المفضل لمعظم تعديلات RPC)؛ يعيد التحميل السريع عندما يكون ذلك ممكنًا ويعيد التشغيل عند الحاجة
    - `config.apply`: يتحقق من صحة الإعدادات الكاملة ويستبدلها؛ يعيد التحميل السريع عندما يكون ذلك ممكنًا ويعيد التشغيل عند الحاجة
    - ما تزال أداة وقت التشغيل `gateway` المخصصة للمالك فقط ترفض إعادة كتابة `tools.exec.ask` / `tools.exec.security`؛ كما أن الأسماء المستعارة القديمة `tools.bash.*` تُطبّع إلى مسارات exec المحمية نفسها

  </Accordion>

  <Accordion title="أقل إعدادات معقولة لأول تثبيت">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    يؤدي هذا إلى ضبط مساحة العمل لديك وتقييد من يمكنه تشغيل الروبوت.

  </Accordion>

  <Accordion title="كيف أُعد Tailscale على VPS وأتصل من جهاز Mac الخاص بي؟">
    الخطوات الدنيا:

    1. **ثبّت وسجّل الدخول على VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **ثبّت وسجّل الدخول على جهاز Mac لديك**
       - استخدم تطبيق Tailscale وسجّل الدخول إلى Tailnet نفسها.
    3. **فعّل MagicDNS (موصى به)**
       - في وحدة تحكم إدارة Tailscale، فعّل MagicDNS حتى يحصل VPS على اسم ثابت.
    4. **استخدم اسم مضيف Tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    إذا كنت تريد Control UI من دون SSH، فاستخدم Tailscale Serve على VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    يؤدي هذا إلى إبقاء Gateway مربوطة على loopback وكشف HTTPS عبر Tailscale. راجع [Tailscale](/ar/gateway/tailscale).

  </Accordion>

  <Accordion title="كيف أوصل Node على Mac بـ Gateway بعيدة (Tailscale Serve)؟">
    يكشف Serve **Control UI + WS الخاصة بـ Gateway**. وتتصل Nodes عبر نقطة نهاية Gateway WS نفسها.

    الإعداد الموصى به:

    1. **تأكد من أن VPS + Mac موجودان على Tailnet نفسها**.
    2. **استخدم تطبيق macOS في الوضع البعيد** (يمكن أن يكون هدف SSH هو اسم مضيف Tailnet).
       سيقوم التطبيق بإنشاء نفق لمنفذ Gateway والاتصال باعتباره Node.
    3. **وافق على Node** على Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    الوثائق: [بروتوكول Gateway](/ar/gateway/protocol)، [Discovery](/ar/gateway/discovery)، [الوضع البعيد على macOS](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل يجب أن أثبّت على حاسوب محمول ثانٍ أم أضيف Node فقط؟">
    إذا كنت تحتاج فقط إلى **أدوات محلية** (الشاشة/الكاميرا/exec) على الحاسوب المحمول الثاني، فأضفه باعتباره
    **Node**. فهذا يُبقي Gateway واحدة ويتجنب تكرار الإعدادات. أدوات Node المحلية
    حاليًا خاصة بـ macOS فقط، لكننا نخطط لتوسيعها إلى أنظمة تشغيل أخرى.

    لا تثبّت Gateway ثانية إلا عندما تحتاج إلى **عزل صارم** أو إلى روبوتين منفصلين تمامًا.

    الوثائق: [Nodes](/ar/nodes)، [Nodes CLI](/cli/nodes)، [Gateways متعددة](/ar/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## متغيرات البيئة وتحميل `.env`

<AccordionGroup>
  <Accordion title="كيف يحمّل OpenClaw متغيرات البيئة؟">
    يقرأ OpenClaw متغيرات البيئة من العملية الأصلية (shell، أو launchd/systemd، أو CI، إلخ) ويحمّل أيضًا:

    - `.env` من دليل العمل الحالي
    - ملف `.env` احتياطيًا عامًا من `~/.openclaw/.env` (ويُعرف أيضًا باسم `$OPENCLAW_STATE_DIR/.env`)

    لا يقوم أي من ملفي `.env` بتجاوز متغيرات البيئة الموجودة مسبقًا.

    يمكنك أيضًا تعريف متغيرات بيئة مضمنة في الإعدادات (تُطبّق فقط إذا كانت مفقودة من بيئة العملية):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    راجع [/environment](/ar/help/environment) للاطلاع على ترتيب الأولوية الكامل والمصادر.

  </Accordion>

  <Accordion title="لقد شغّلت Gateway عبر الخدمة واختفت متغيرات البيئة الخاصة بي. ماذا الآن؟">
    هناك إصلاحان شائعان:

    1. ضع المفاتيح المفقودة في `~/.openclaw/.env` حتى يتم التقاطها حتى عندما لا ترث الخدمة بيئة shell الخاصة بك.
    2. فعّل استيراد shell (تسهيل اختياري):

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

    يؤدي هذا إلى تشغيل shell تسجيل الدخول لديك واستيراد المفاتيح المتوقعة المفقودة فقط (من دون تجاوز أي شيء مطلقًا). مكافئات متغيرات البيئة:
    `OPENCLAW_LOAD_SHELL_ENV=1` و`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='لقد ضبطت COPILOT_GITHUB_TOKEN، لكن حالة النماذج تعرض "Shell env: off." لماذا؟'>
    يوضح `openclaw models status` ما إذا كان **استيراد بيئة shell** مفعّلًا. إن ظهور "Shell env: off"
    **لا** يعني أن متغيرات البيئة لديك مفقودة - بل يعني فقط أن OpenClaw لن يحمّل
    shell تسجيل الدخول لديك تلقائيًا.

    إذا كانت Gateway تعمل كخدمة (launchd/systemd)، فلن ترث
    بيئة shell الخاصة بك. أصلح ذلك بإحدى الطرق التالية:

    1. ضع الرمز المميز في `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. أو فعّل استيراد shell (`env.shellEnv.enabled: true`).
    3. أو أضفه إلى كتلة `env` في إعداداتك (يُطبَّق فقط إذا كان مفقودًا).

    ثم أعد تشغيل Gateway وتحقق مرة أخرى:

    ```bash
    openclaw models status
    ```

    تتم قراءة رموز Copilot من `COPILOT_GITHUB_TOKEN` (وأيضًا `GH_TOKEN` / `GITHUB_TOKEN`).
    راجع [/concepts/model-providers](/ar/concepts/model-providers) و[/environment](/ar/help/environment).

  </Accordion>
</AccordionGroup>

## الجلسات والمحادثات المتعددة

<AccordionGroup>
  <Accordion title="كيف أبدأ محادثة جديدة؟">
    أرسل `/new` أو `/reset` كرسالة مستقلة. راجع [إدارة الجلسات](/ar/concepts/session).
  </Accordion>

  <Accordion title="هل تُعاد تعيين الجلسات تلقائيًا إذا لم أرسل /new أبدًا؟">
    يمكن أن تنتهي صلاحية الجلسات بعد `session.idleMinutes`، لكن هذا **معطّل افتراضيًا** (القيمة الافتراضية **0**).
    اضبطه على قيمة موجبة لتمكين انتهاء الصلاحية بسبب الخمول. وعند تفعيله، تبدأ **الرسالة التالية**
    بعد فترة الخمول معرف جلسة جديدًا لمفتاح الدردشة ذلك.
    ولا يؤدي هذا إلى حذف النصوص - بل يبدأ جلسة جديدة فقط.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="هل توجد طريقة لإنشاء فريق من نُسخ OpenClaw (مدير تنفيذي واحد والعديد من الوكلاء)؟">
    نعم، عبر **التوجيه متعدد الوكلاء** و**الوكلاء الفرعيين**. يمكنك إنشاء وكيل
    منسق واحد وعدة وكلاء عاملين لكل منهم مساحة العمل والنماذج الخاصة به.

    ومع ذلك، فمن الأفضل النظر إلى هذا على أنه **تجربة ممتعة**. فهو يستهلك رموزًا كثيرًا
    وغالبًا ما يكون أقل كفاءة من استخدام روبوت واحد مع جلسات منفصلة. أما النموذج المعتاد الذي
    نتصوره فهو روبوت واحد تتحدث إليه، مع جلسات مختلفة للعمل المتوازي. كما يمكن لذلك
    الروبوت أيضًا تشغيل وكلاء فرعيين عند الحاجة.

    الوثائق: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [الوكلاء الفرعيون](/ar/tools/subagents)، [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="لماذا تم اقتطاع السياق في منتصف المهمة؟ كيف أمنع ذلك؟">
    إن سياق الجلسة محدود بنافذة النموذج. ويمكن للمحادثات الطويلة، أو مخرجات الأدوات الكبيرة، أو كثرة
    الملفات أن تؤدي إلى Compaction أو الاقتطاع.

    ما الذي يساعد:

    - اطلب من الروبوت تلخيص الحالة الحالية وكتابتها في ملف.
    - استخدم `/compact` قبل المهام الطويلة، و`/new` عند تبديل الموضوعات.
    - احتفظ بالسياق المهم في مساحة العمل واطلب من الروبوت قراءته مرة أخرى.
    - استخدم وكلاء فرعيين للأعمال الطويلة أو المتوازية حتى تظل الدردشة الرئيسية أصغر.
    - اختر نموذجًا يملك نافذة سياق أكبر إذا كان هذا يحدث كثيرًا.

  </Accordion>

  <Accordion title="كيف أعيد تعيين OpenClaw بالكامل لكن مع إبقائه مثبتًا؟">
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

    - يقدّم الإعداد الأولي أيضًا خيار **Reset** إذا اكتشف إعدادات موجودة. راجع [الإعداد الأولي (CLI)](/ar/start/wizard).
    - إذا كنت قد استخدمت ملفات تعريف (`--profile` / `OPENCLAW_PROFILE`)، فأعد تعيين كل دليل حالة (القيم الافتراضية هي `~/.openclaw-<profile>`).
    - إعادة التعيين في وضع التطوير: `openclaw gateway --dev --reset` (خاص بالتطوير فقط؛ يمسح إعدادات التطوير + بيانات الاعتماد + الجلسات + مساحة العمل).

  </Accordion>

  <Accordion title='أتلقى أخطاء "context too large" - كيف أعيد التعيين أو أجري Compaction؟'>
    استخدم أحد هذه الخيارات:

    - **Compaction** (يُبقي المحادثة لكنه يلخص الأدوار الأقدم):

      ```
      /compact
      ```

      أو `/compact <instructions>` لتوجيه الملخص.

    - **إعادة التعيين** (معرف جلسة جديد لمفتاح الدردشة نفسه):

      ```
      /new
      /reset
      ```

    إذا استمر حدوث ذلك:

    - فعّل أو اضبط **تشذيب الجلسة** (`agents.defaults.contextPruning`) لقص مخرجات الأدوات القديمة.
    - استخدم نموذجًا يملك نافذة سياق أكبر.

    الوثائق: [Compaction](/ar/concepts/compaction)، [تشذيب الجلسة](/ar/concepts/session-pruning)، [إدارة الجلسات](/ar/concepts/session).

  </Accordion>

  <Accordion title='لماذا أرى "LLM request rejected: messages.content.tool_use.input field required"؟'>
    هذا خطأ تحقق من صحة لدى الموفّر: أصدر النموذج كتلة `tool_use` من دون
    `input` المطلوب. وعادةً ما يعني ذلك أن سجل الجلسة قديم أو تالف (غالبًا بعد سلاسل طويلة
    أو تغيير في الأداة/المخطط).

    الحل: ابدأ جلسة جديدة باستخدام `/new` (كقيمة رسالة مستقلة).

  </Accordion>

  <Accordion title="لماذا أتلقى رسائل Heartbeat كل 30 دقيقة؟">
    تعمل Heartbeats كل **30m** افتراضيًا (**1h** عند استخدام مصادقة OAuth). اضبطها أو عطّلها:

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

    إذا كان `HEARTBEAT.md` موجودًا لكنه فارغ فعليًا (أسطر فارغة فقط وعناوين markdown
    مثل `# Heading`)، فإن OpenClaw يتخطى تشغيل Heartbeat لتوفير استدعاءات API.
    وإذا كان الملف مفقودًا، فإن Heartbeat ما تزال تعمل ويقرر النموذج ما الذي يجب فعله.

    تستخدم التجاوزات لكل وكيل `agents.list[].heartbeat`. الوثائق: [Heartbeat](/ar/gateway/heartbeat).

  </Accordion>

  <Accordion title='هل أحتاج إلى إضافة "حساب روبوت" إلى مجموعة WhatsApp؟'>
    لا. يعمل OpenClaw على **حسابك الخاص**، لذا إذا كنت في المجموعة، يمكن لـ OpenClaw رؤيتها.
    وبشكل افتراضي، يتم حظر الردود في المجموعات إلى أن تسمح للمرسلين (`groupPolicy: "allowlist"`).

    إذا كنت تريد أن تتمكن **أنت فقط** من تشغيل الردود في المجموعات:

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
    الخيار 1 (الأسرع): تتبع السجلات وأرسل رسالة اختبار في المجموعة:

    ```bash
    openclaw logs --follow --json
    ```

    ابحث عن `chatId` (أو `from`) الذي ينتهي بـ `@g.us`، مثل:
    `1234567890-1234567890@g.us`.

    الخيار 2 (إذا كان مكوّنًا/موجودًا في قائمة السماح بالفعل): اعرض المجموعات من الإعدادات:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    الوثائق: [WhatsApp](/ar/channels/whatsapp)، [Directory](/cli/directory)، [Logs](/cli/logs).

  </Accordion>

  <Accordion title="لماذا لا يرد OpenClaw في مجموعة؟">
    هناك سببان شائعان:

    - تفعيل الإشارة مفعّل (الافتراضي). يجب أن تقوم بعمل @mention للروبوت (أو تطابق `mentionPatterns`).
    - لقد قمت بتكوين `channels.whatsapp.groups` من دون `"*"` ولم تتم إضافة المجموعة إلى قائمة السماح.

    راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).

  </Accordion>

  <Accordion title="هل تشارك المجموعات/المحادثات سياقها مع الرسائل المباشرة؟">
    تُدمج الدردشات المباشرة في الجلسة الرئيسية افتراضيًا. أما المجموعات/القنوات فلها مفاتيح جلسات خاصة بها، كما أن موضوعات Telegram / محادثات Discord هي جلسات منفصلة. راجع [المجموعات](/ar/channels/groups) و[رسائل المجموعات](/ar/channels/group-messages).
  </Accordion>

  <Accordion title="كم عدد مساحات العمل والوكلاء الذين يمكنني إنشاؤهم؟">
    لا توجد حدود صارمة. العشرات (بل حتى المئات) مقبولة، لكن انتبه إلى:

    - **نمو القرص:** تعيش الجلسات + النصوص تحت `~/.openclaw/agents/<agentId>/sessions/`.
    - **تكلفة الرموز:** زيادة عدد الوكلاء تعني زيادة استخدام النماذج بشكل متزامن.
    - **العبء التشغيلي:** ملفات المصادقة، ومساحات العمل، وتوجيه القنوات لكل وكيل.

    نصائح:

    - احتفظ بمساحة عمل **نشطة** واحدة لكل وكيل (`agents.defaults.workspace`).
    - قم بتشذيب الجلسات القديمة (احذف JSONL أو إدخالات التخزين) إذا نما استخدام القرص.
    - استخدم `openclaw doctor` لاكتشاف مساحات العمل الشاردة وعدم تطابق الملفات الشخصية.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل عدة روبوتات أو دردشات في الوقت نفسه (Slack)، وكيف يجب أن أُعد ذلك؟">
    نعم. استخدم **التوجيه متعدد الوكلاء** لتشغيل عدة وكلاء معزولين وتوجيه الرسائل الواردة حسب
    القناة/الحساب/النظير. Slack مدعوم كقناة ويمكن ربطه بوكلاء محددين.

    إن الوصول إلى المتصفح قوي، لكنه ليس "افعل كل ما يستطيع الإنسان فعله" - فمكافحة الروبوت، وCAPTCHA، وMFA
    لا تزال قادرة على حظر الأتمتة. وللحصول على أكثر تحكم موثوق في المتصفح، استخدم Chrome MCP المحلي على المضيف،
    أو استخدم CDP على الجهاز الذي يشغّل المتصفح فعليًا.

    إعداد أفضل الممارسات:

    - مضيف Gateway يعمل دائمًا (VPS/Mac mini).
    - وكيل واحد لكل دور (bindings).
    - قناة (أو قنوات) Slack مرتبطة بهؤلاء الوكلاء.
    - متصفح محلي عبر Chrome MCP أو Node عند الحاجة.

    الوثائق: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [Slack](/ar/channels/slack)،
    [Browser](/ar/tools/browser)، [Nodes](/ar/nodes).

  </Accordion>
</AccordionGroup>

## النماذج: القيم الافتراضية، والاختيار، والأسماء المستعارة، والتبديل

<AccordionGroup>
  <Accordion title='ما هو "النموذج الافتراضي"؟'>
    النموذج الافتراضي في OpenClaw هو أي نموذج تضبطه على أنه:

    ```
    agents.defaults.model.primary
    ```

    تتم الإشارة إلى النماذج بصيغة `provider/model` (مثال: `openai/gpt-5.4`). وإذا حذفت الموفّر، فسيحاول OpenClaw أولًا مطابقة اسم مستعار، ثم مطابقة فريدة بين الموفّرين المكوَّنين لذلك المعرّف الدقيق للنموذج، وبعد ذلك فقط يعود إلى الموفّر الافتراضي المكوَّن كمسار توافق قديم ومهجور. وإذا لم يعد ذلك الموفّر يكشف النموذج الافتراضي المكوَّن، فإن OpenClaw يعود إلى أول موفّر/نموذج مكوَّن بدلًا من إظهار افتراضي قديم من موفّر تمت إزالته. ومع ذلك، يجب عليك **ضبط `provider/model` صراحةً**.

  </Accordion>

  <Accordion title="ما النموذج الذي توصون به؟">
    **الافتراضي الموصى به:** استخدم أقوى نموذج من أحدث جيل متاح في مجموعة الموفّرين لديك.
    **للوكلاء المفعّلة بالأدوات أو المدخلات غير الموثوقة:** أعطِ أولوية لقوة النموذج على التكلفة.
    **للدردشة الروتينية/منخفضة المخاطر:** استخدم نماذج احتياطية أرخص ووجّه حسب دور الوكيل.

    لدى MiniMax وثائقها الخاصة: [MiniMax](/ar/providers/minimax) و
    [النماذج المحلية](/ar/gateway/local-models).

    القاعدة العامة: استخدم **أفضل نموذج يمكنك تحمّل تكلفته** للأعمال عالية المخاطر، ونموذجًا أرخص
    للدردشة الروتينية أو الملخصات. ويمكنك توجيه النماذج لكل وكيل واستخدام وكلاء فرعيين من أجل
    الموازاة في المهام الطويلة (كل وكيل فرعي يستهلك رموزًا). راجع [النماذج](/ar/concepts/models) و
    [الوكلاء الفرعيون](/ar/tools/subagents).

    تحذير قوي: النماذج الأضعف/المبالغ في تكميمها أكثر عرضة لحقن
    المطالبات والسلوك غير الآمن. راجع [الأمان](/ar/gateway/security).

    مزيد من السياق: [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="كيف أبدّل النماذج من دون مسح إعداداتي؟">
    استخدم **أوامر النموذج** أو عدّل حقول **النموذج** فقط. تجنب استبدال الإعدادات بالكامل.

    الخيارات الآمنة:

    - `/model` في الدردشة (سريع، لكل جلسة)
    - `openclaw models set ...` (يحدّث إعدادات النموذج فقط)
    - `openclaw configure --section model` (تفاعلي)
    - عدّل `agents.defaults.model` في `~/.openclaw/openclaw.json`

    تجنب `config.apply` مع كائن جزئي ما لم تكن تقصد استبدال الإعدادات كلها.
    بالنسبة إلى تعديلات RPC، افحص أولًا باستخدام `config.schema.lookup` وفضّل `config.patch`. إذ تمنحك حمولة lookup المسار المُطبّع، ووثائق/قيود المخطط السطحية، وملخصات الأبناء المباشرين
    للتحديثات الجزئية.
    وإذا كنت قد كتبت فوق الإعدادات، فاستعدها من نسخة احتياطية أو أعد تشغيل `openclaw doctor` للإصلاح.

    الوثائق: [النماذج](/ar/concepts/models)، [Configure](/cli/configure)، [الإعدادات](/cli/config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج مستضافة ذاتيًا (llama.cpp، وvLLM، وOllama)؟">
    نعم. يُعد Ollama أسهل مسار للنماذج المحلية.

    أسرع إعداد:

    1. ثبّت Ollama من `https://ollama.com/download`
    2. اسحب نموذجًا محليًا مثل `ollama pull gemma4`
    3. إذا كنت تريد نماذج سحابية أيضًا، فشغّل `ollama signin`
    4. شغّل `openclaw onboard` واختر `Ollama`
    5. اختر `Local` أو `Cloud + Local`

    ملاحظات:

    - يمنحك `Cloud + Local` النماذج السحابية بالإضافة إلى نماذج Ollama المحلية
    - النماذج السحابية مثل `kimi-k2.5:cloud` لا تحتاج إلى سحب محلي
    - للتبديل اليدوي، استخدم `openclaw models list` و`openclaw models set ollama/<model>`

    ملاحظة أمنية: النماذج الأصغر أو المكمّاة بشكل كبير أكثر عرضة لحقن
    المطالبات. ونحن نوصي بشدة باستخدام **نماذج كبيرة** لأي روبوت يمكنه استخدام الأدوات.
    وإذا كنت لا تزال تريد نماذج صغيرة، ففعّل العزل وقوائم السماح الصارمة للأدوات.

    الوثائق: [Ollama](/ar/providers/ollama)، [النماذج المحلية](/ar/gateway/local-models)،
    [موفرو النماذج](/ar/concepts/model-providers)، [الأمان](/ar/gateway/security)،
    [العزل](/ar/gateway/sandboxing).

  </Accordion>

  <Accordion title="ما النماذج التي تستخدمها OpenClaw وFlawd وKrill؟">
    - قد تختلف هذه البيئات وقد تتغير بمرور الوقت؛ ولا توجد توصية ثابتة بشأن الموفّر.
    - تحقّق من إعداد وقت التشغيل الحالي على كل Gateway باستخدام `openclaw models status`.
    - بالنسبة إلى الوكلاء الحسّاسين أمنيًا/المفعّلين بالأدوات، استخدم أقوى نموذج من أحدث جيل متاح.
  </Accordion>

  <Accordion title="كيف أبدّل النماذج أثناء التشغيل (من دون إعادة تشغيل)؟">
    استخدم الأمر `/model` كرسالة مستقلة:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    هذه هي الأسماء المستعارة المضمنة. ويمكن إضافة أسماء مستعارة مخصصة عبر `agents.defaults.models`.

    يمكنك عرض النماذج المتاحة باستخدام `/model` أو `/model list` أو `/model status`.

    يعرض `/model` (وكذلك `/model list`) منتقيًا مضغوطًا ومرقّمًا. اختر حسب الرقم:

    ```
    /model 3
    ```

    يمكنك أيضًا فرض ملف مصادقة معيّن للموفّر (لكل جلسة):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نصيحة: يعرض `/model status` الوكيل النشط، وملف `auth-profiles.json` المستخدم، وملف المصادقة الذي ستجري محاولته بعد ذلك.
    كما يعرض نقطة نهاية الموفّر المكوَّنة (`baseUrl`) ووضع API (`api`) عند توفرهما.

    **كيف ألغي تثبيت ملف شخصي قمت بتثبيته باستخدام @profile؟**

    أعد تشغيل `/model` **من دون** لاحقة `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    إذا كنت تريد الرجوع إلى الإعداد الافتراضي، فاختره من `/model` (أو أرسل `/model <default provider/model>`).
    استخدم `/model status` لتأكيد أي ملف مصادقة نشط.

  </Accordion>

  <Accordion title="هل يمكنني استخدام GPT 5.2 للمهام اليومية وCodex 5.3 للبرمجة؟">
    نعم. اضبط أحدهما كافتراضي وبدّل حسب الحاجة:

    - **تبديل سريع (لكل جلسة):** `/model gpt-5.4` للمهام اليومية، و`/model openai-codex/gpt-5.4` للبرمجة باستخدام Codex OAuth.
    - **افتراضي + تبديل:** اضبط `agents.defaults.model.primary` على `openai/gpt-5.4`، ثم بدّل إلى `openai-codex/gpt-5.4` عند البرمجة (أو بالعكس).
    - **الوكلاء الفرعيون:** وجّه مهام البرمجة إلى وكلاء فرعيين لديهم نموذج افتراضي مختلف.

    راجع [النماذج](/ar/concepts/models) و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أُكوّن الوضع السريع لـ GPT 5.4؟">
    استخدم إما مفتاح تبديل للجلسة أو افتراضيًا في الإعدادات:

    - **لكل جلسة:** أرسل `/fast on` بينما تستخدم الجلسة `openai/gpt-5.4` أو `openai-codex/gpt-5.4`.
    - **افتراضي لكل نموذج:** اضبط `agents.defaults.models["openai/gpt-5.4"].params.fastMode` على `true`.
    - **Codex OAuth أيضًا:** إذا كنت تستخدم أيضًا `openai-codex/gpt-5.4`، فاضبط العلامة نفسها هناك.

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

    بالنسبة إلى OpenAI، فإن الوضع السريع يُطابق `service_tier = "priority"` في طلبات Responses الأصلية المدعومة. كما أن تجاوزات `/fast` على مستوى الجلسة تتغلب على القيم الافتراضية في الإعدادات.

    راجع [التفكير والوضع السريع](/ar/tools/thinking) و[الوضع السريع في OpenAI](/ar/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='لماذا أرى "Model ... is not allowed" ثم لا يصل أي رد؟'>
    إذا كان `agents.defaults.models` مضبوطًا، فإنه يصبح **قائمة السماح** لأمر `/model` وأي
    تجاوزات على مستوى الجلسة. وسيؤدي اختيار نموذج غير موجود في تلك القائمة إلى إرجاع:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    يتم إرجاع هذا الخطأ **بدلًا من** رد عادي. الحل: أضف النموذج إلى
    `agents.defaults.models`، أو أزل قائمة السماح، أو اختر نموذجًا من `/model list`.

  </Accordion>

  <Accordion title='لماذا أرى "Unknown model: minimax/MiniMax-M2.7"؟'>
    هذا يعني أن **الموفّر غير مكوَّن** (لم يتم العثور على إعدادات موفّر MiniMax أو
    ملف مصادقة)، لذلك لا يمكن حل النموذج.

    قائمة التحقق من الإصلاح:

    1. قم بالترقية إلى إصدار OpenClaw حالي (أو شغّله من المصدر `main`)، ثم أعد تشغيل Gateway.
    2. تأكد من تكوين MiniMax (عبر المعالج أو JSON)، أو من وجود مصادقة MiniMax
       في env/ملفات المصادقة حتى يمكن حقن الموفّر المطابق
       (`MINIMAX_API_KEY` لـ `minimax`، أو `MINIMAX_OAUTH_TOKEN` أو MiniMax
       OAuth المخزَّن لـ `minimax-portal`).
    3. استخدم معرّف النموذج الدقيق (حساس لحالة الأحرف) لمسار المصادقة لديك:
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
    إن النماذج الاحتياطية مخصصة **للأخطاء**، لا "للمهام الصعبة"، لذا استخدم `/model` أو وكيلًا منفصلًا.

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

    - وكيل A الافتراضي: MiniMax
    - وكيل B الافتراضي: OpenAI
    - وجّه حسب الوكيل أو استخدم `/agent` للتبديل

    الوثائق: [النماذج](/ar/concepts/models)، [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [MiniMax](/ar/providers/minimax)، [OpenAI](/ar/providers/openai).

  </Accordion>

  <Accordion title="هل opus / sonnet / gpt اختصارات مضمّنة؟">
    نعم. يوفّر OpenClaw بعض الأسماء المختصرة الافتراضية (ولا تُطبَّق إلا عندما يكون النموذج موجودًا في `agents.defaults.models`):

    - `opus` ← `anthropic/claude-opus-4-6`
    - `sonnet` ← `anthropic/claude-sonnet-4-6`
    - `gpt` ← `openai/gpt-5.4`
    - `gpt-mini` ← `openai/gpt-5.4-mini`
    - `gpt-nano` ← `openai/gpt-5.4-nano`
    - `gemini` ← `google/gemini-3.1-pro-preview`
    - `gemini-flash` ← `google/gemini-3-flash-preview`
    - `gemini-flash-lite` ← `google/gemini-3.1-flash-lite-preview`

    إذا ضبطت اسمًا مستعارًا خاصًا بك يحمل الاسم نفسه، فستفوز قيمتك.

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

    وبعد ذلك، فإن `/model sonnet` (أو `/<alias>` عند وجود دعم) يُحل إلى معرّف ذلك النموذج.

  </Accordion>

  <Accordion title="كيف أضيف نماذج من موفّرين آخرين مثل OpenRouter أو Z.AI؟">
    OpenRouter (الدفع حسب الرمز؛ نماذج عديدة):

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

    إذا أشرت إلى `provider/model` لكن مفتاح الموفّر المطلوب مفقود، فستحصل على خطأ مصادقة في وقت التشغيل (مثل `No API key found for provider "zai"`).

    **لم يتم العثور على مفتاح API للموفّر بعد إضافة وكيل جديد**

    يعني هذا عادةً أن **الوكلاء الجدد** لديهم مخزن مصادقة فارغ. فالمصادقة تكون لكل وكيل
    وتُخزَّن في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    خيارات الإصلاح:

    - شغّل `openclaw agents add <id>` وقم بتكوين المصادقة أثناء المعالج.
    - أو انسخ `auth-profiles.json` من `agentDir` الخاص بالوكيل الرئيسي إلى `agentDir` الخاص بالوكيل الجديد.

    **لا** تعِد استخدام `agentDir` عبر الوكلاء؛ فهذا يسبب تصادمات في المصادقة/الجلسات.

  </Accordion>
</AccordionGroup>

## التحويل الاحتياطي للنموذج و"فشلت جميع النماذج"

<AccordionGroup>
  <Accordion title="كيف يعمل التحويل الاحتياطي؟">
    يحدث التحويل الاحتياطي على مرحلتين:

    1. **تدوير ملف المصادقة** داخل الموفّر نفسه.
    2. **الرجوع إلى النموذج** التالي في `agents.defaults.model.fallbacks`.

    تُطبّق فترات تهدئة على الملفات التي تفشل (تراجع أُسّي)، بحيث يمكن لـ OpenClaw مواصلة الرد حتى عندما يكون الموفّر مقيّدًا بالمعدل أو يفشل مؤقتًا.

    تشمل سلة حد المعدل أكثر من مجرد استجابات `429` العادية. يعامل OpenClaw
    أيضًا رسائل مثل `Too many concurrent requests`،
    و`ThrottlingException`، و`concurrency limit reached`،
    و`workers_ai ... quota limit exceeded`، و`resource exhausted`، وحدود
    نوافذ الاستخدام الدورية (`weekly/monthly limit reached`) على أنها حدود
    معدل تستحق التحويل الاحتياطي.

    بعض الاستجابات التي تبدو متعلقة بالفوترة ليست `402`، وبعض استجابات HTTP `402`
    تبقى أيضًا ضمن تلك السلة المؤقتة. وإذا أعاد موفّر ما
    نصًا صريحًا متعلقًا بالفوترة على `401` أو `403`، فلا يزال بإمكان OpenClaw إبقاؤه في
    مسار الفوترة، لكن مطابِقات النصوص الخاصة بكل موفّر تبقى محصورة في
    الموفّر الذي يملكها (على سبيل المثال OpenRouter `Key limit exceeded`). وإذا بدا نص
    رسالة `402` بدلًا من ذلك كأنه متعلق بنافذة استخدام قابلة لإعادة المحاولة أو
    بحد إنفاق مؤسسة/مساحة عمل (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`) فإن OpenClaw يتعامل معه على أنه
    `rate_limit` وليس تعطيل فوترة طويلًا.

    تختلف أخطاء تجاوز السياق: فالتواقيع مثل
    `request_too_large`، و`input exceeds the maximum number of tokens`،
    و`input token count exceeds the maximum number of input tokens`،
    و`input is too long for the model`، أو `ollama error: context length
    exceeded` تبقى على مسار Compaction/إعادة المحاولة بدلًا من التقدّم إلى
    الرجوع إلى نموذج احتياطي.

    إن نص الخطأ العام الخاص بالخادم أضيق عمدًا من "أي شيء يحتوي على
    unknown/error". يعامل OpenClaw بالفعل الأشكال المؤقتة المحصورة بالموفّر
    مثل رسالة Anthropic المجردة `An unknown error occurred`، ورسالة OpenRouter المجردة
    `Provider returned error`، وأخطاء سبب التوقف مثل `Unhandled stop reason:
    error`، وحمولات JSON `api_error` ذات النص المؤقت الخاص بالخادم
    (`internal server error`، و`unknown error, 520`، و`upstream error`، و`backend
    error`) وأخطاء انشغال الموفّر مثل `ModelNotReadyException` على أنها
    إشارات تستحق التحويل الاحتياطي بسبب انتهاء المهلة/التحميل الزائد عندما
    يتطابق سياق الموفّر.
    أما نص الرجوع الداخلي العام مثل `LLM request failed with an unknown
    error.` فيبقى متحفظًا ولا يؤدي بمفرده إلى الرجوع إلى نموذج احتياطي.

  </Accordion>

  <Accordion title='ماذا يعني "No credentials found for profile anthropic:default"؟'>
    يعني هذا أن النظام حاول استخدام معرّف ملف المصادقة `anthropic:default`، لكنه لم يتمكن من العثور على بيانات اعتماد له في مخزن المصادقة المتوقع.

    **قائمة التحقق من الإصلاح:**

    - **أكد مكان وجود ملفات المصادقة** (المسارات الجديدة مقابل القديمة)
      - الحالي: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - القديم: `~/.openclaw/agent/*` (يُرحّل بواسطة `openclaw doctor`)
    - **أكد أن متغير البيئة لديك محمّل بواسطة Gateway**
      - إذا كنت قد ضبطت `ANTHROPIC_API_KEY` في shell لكنك تشغّل Gateway عبر systemd/launchd، فقد لا ترثه. ضعه في `~/.openclaw/.env` أو فعّل `env.shellEnv`.
    - **تأكد من أنك تعدّل الوكيل الصحيح**
      - تعني إعدادات تعدد الوكلاء أنه قد تكون هناك عدة ملفات `auth-profiles.json`.
    - **تحقق سريعًا من حالة النموذج/المصادقة**
      - استخدم `openclaw models status` لمعرفة النماذج المكوّنة وما إذا كان الموفّرون قد تمت مصادقتهم.

    **قائمة التحقق من الإصلاح لعبارة "No credentials found for profile anthropic"**

    يعني هذا أن التشغيل مثبت على ملف مصادقة Anthropic، لكن Gateway
    لا تستطيع العثور عليه في مخزن المصادقة الخاص بها.

    - **استخدم Claude CLI**
      - شغّل `openclaw models auth login --provider anthropic --method cli --set-default` على مضيف Gateway.
    - **إذا كنت تريد استخدام مفتاح API بدلًا من ذلك**
      - ضع `ANTHROPIC_API_KEY` في `~/.openclaw/.env` على **مضيف Gateway**.
      - أزل أي ترتيب مثبت يفرض ملفًا مفقودًا:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **أكد أنك تشغّل الأوامر على مضيف Gateway**
      - في الوضع البعيد، تعيش ملفات المصادقة على جهاز Gateway، وليس على حاسوبك المحمول.

  </Accordion>

  <Accordion title="لماذا حاول أيضًا استخدام Google Gemini وفشل؟">
    إذا كان إعداد النموذج لديك يتضمن Google Gemini كنموذج احتياطي (أو إذا كنت قد بدّلت إلى اسم Gemini مختصر)، فسيحاول OpenClaw استخدامه أثناء الرجوع إلى نموذج احتياطي. وإذا لم تكن قد قمت بتكوين بيانات اعتماد Google، فسترى `No API key found for provider "google"`.

    الحل: إما أن توفّر مصادقة Google، أو أن تزيل/تتجنب نماذج Google في `agents.defaults.model.fallbacks` / الأسماء المستعارة حتى لا يوجّه الرجوع إليها.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    السبب: يحتوي سجل الجلسة على **كتل thinking من دون تواقيع** (وغالبًا يكون ذلك من
    بث متوقف/جزئي). تتطلب Google Antigravity تواقيع لكتل thinking.

    الحل: يقوم OpenClaw الآن بإزالة كتل thinking غير الموقعة لـ Google Antigravity Claude. وإذا استمرت في الظهور، فابدأ **جلسة جديدة** أو اضبط `/thinking off` لذلك الوكيل.

  </Accordion>
</AccordionGroup>

## ملفات المصادقة: ما هي وكيفية إدارتها

ذو صلة: [/concepts/oauth](/ar/concepts/oauth) (تدفقات OAuth، وتخزين الرموز المميزة، وأنماط الحسابات المتعددة)

<AccordionGroup>
  <Accordion title="ما هو ملف المصادقة؟">
    ملف المصادقة هو سجل بيانات اعتماد مسمّى (OAuth أو مفتاح API) مرتبط بموفّر. وتوجد الملفات في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="ما معرّفات الملفات النموذجية؟">
    يستخدم OpenClaw معرّفات مسبوقة بالموفّر مثل:

    - `anthropic:default` (شائع عندما لا توجد هوية بريد إلكتروني)
    - `anthropic:<email>` لهويات OAuth
    - معرّفات مخصصة تختارها أنت (مثل `anthropic:work`)

  </Accordion>

  <Accordion title="هل يمكنني التحكم في ملف المصادقة الذي تتم تجربته أولًا؟">
    نعم. تدعم الإعدادات بيانات وصفية اختيارية للملفات وترتيبًا لكل موفّر (`auth.order.<provider>`). هذا **لا** يخزن الأسرار؛ بل يربط المعرّفات بالموفّر/الوضع ويضبط ترتيب التدوير.

    قد يتخطى OpenClaw ملفًا ما مؤقتًا إذا كان ضمن **فترة تهدئة** قصيرة (حدود معدل/انتهاء مهلة/إخفاقات مصادقة) أو ضمن حالة **تعطيل** أطول (فوترة/رصيد غير كافٍ). ولمعاينة هذا، شغّل `openclaw models status --json` وتحقق من `auth.unusableProfiles`. الضبط: `auth.cooldowns.billingBackoffHours*`.

    يمكن أن تكون فترات التهدئة الخاصة بحد المعدل محصورة بنموذج معيّن. فالملف الذي يكون في فترة تهدئة
    لنموذج واحد قد يظل صالحًا لنموذج شقيق على الموفّر نفسه،
    بينما تظل نوافذ الفوترة/التعطيل تمنع الملف كله.

    يمكنك أيضًا ضبط ترتيب تجاوز **لكل وكيل** (مخزّن في `auth-state.json` لذلك الوكيل) عبر CLI:

    ```bash
    # يستخدم الوكيل الافتراضي المكوَّن افتراضيًا (احذف --agent)
    openclaw models auth order get --provider anthropic

    # ثبّت التدوير على ملف واحد (جرّب هذا الملف فقط)
    openclaw models auth order set --provider anthropic anthropic:default

    # أو اضبط ترتيبًا صريحًا (رجوع داخل الموفّر)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # امسح التجاوز (الرجوع إلى config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    ولاستهداف وكيل معين:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    وللتحقق مما ستتم تجربته فعليًا، استخدم:

    ```bash
    openclaw models status --probe
    ```

    إذا تم حذف ملف مخزن من الترتيب الصريح، فإن probe يعرض
    `excluded_by_auth_order` لذلك الملف بدلًا من تجربته بصمت.

  </Accordion>

  <Accordion title="OAuth مقابل مفتاح API - ما الفرق؟">
    يدعم OpenClaw كلا الأمرين:

    - **OAuth** يستفيد غالبًا من وصول الاشتراك (حيثما كان ذلك منطبقًا).
    - **مفاتيح API** تستخدم فوترة الدفع حسب الرمز.

    يدعم المعالج صراحةً Anthropic Claude CLI وOpenAI Codex OAuth ومفاتيح API.

  </Accordion>
</AccordionGroup>

## Gateway: المنافذ و"قيد التشغيل بالفعل" والوضع البعيد

<AccordionGroup>
  <Accordion title="ما المنفذ الذي تستخدمه Gateway؟">
    يتحكم `gateway.port` في المنفذ المفرد الموحّد لكل من WebSocket + HTTP (Control UI، وhooks، وما إلى ذلك).

    ترتيب الأولوية:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='لماذا يقول openclaw gateway status "Runtime: running" لكن "Connectivity probe: failed"؟'>
    لأن "running" هو عرض **المشرف** (launchd/systemd/schtasks). أما Connectivity probe فهو CLI الذي يتصل فعليًا بـ Gateway WebSocket.

    استخدم `openclaw gateway status` وثق بهذه الأسطر:

    - `Probe target:` (عنوان URL الذي استخدمه probe فعليًا)
    - `Listening:` (ما هو مربوط بالفعل على المنفذ)
    - `Last gateway error:` (السبب الجذري الشائع عندما تكون العملية حيّة لكن المنفذ لا يستمع)

  </Accordion>

  <Accordion title='لماذا يعرض openclaw gateway status قيمًا مختلفة لـ "Config (cli)" و"Config (service)"؟'>
    أنت تعدّل ملف إعدادات واحدًا بينما تعمل الخدمة على ملف آخر (وغالبًا يكون ذلك بسبب عدم تطابق `--profile` / `OPENCLAW_STATE_DIR`).

    الحل:

    ```bash
    openclaw gateway install --force
    ```

    شغّل ذلك من البيئة/قيمة `--profile` نفسها التي تريد أن تستخدمها الخدمة.

  </Accordion>

  <Accordion title='ماذا يعني "another gateway instance is already listening"؟'>
    يفرض OpenClaw قفل وقت تشغيل عبر ربط مستمع WebSocket فورًا عند بدء التشغيل (الافتراضي `ws://127.0.0.1:18789`). وإذا فشل الربط مع `EADDRINUSE`، فإنه يرمي `GatewayLockError` مشيرًا إلى أن نسخة أخرى تستمع بالفعل.

    الحل: أوقف النسخة الأخرى، أو حرر المنفذ، أو شغّل باستخدام `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="كيف أشغّل OpenClaw في الوضع البعيد (يتصل العميل بـ Gateway في مكان آخر)؟">
    اضبط `gateway.mode: "remote"` ووجّه إلى عنوان URL بعيد لـ WebSocket، مع إمكانية إضافة بيانات اعتماد بعيدة من نوع shared-secret:

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

    - لا يبدأ `openclaw gateway` إلا عندما تكون `gateway.mode` هي `local` (أو إذا مرّرت علامة تجاوز).
    - يراقب تطبيق macOS ملف الإعدادات ويبدّل الأوضاع مباشرةً عند تغيّر هذه القيم.
    - إن `gateway.remote.token` / `.password` هما بيانات اعتماد بعيدة من جهة العميل فقط؛ ولا يفعّلان مصادقة Gateway المحلية بمفردهما.

  </Accordion>

  <Accordion title='تعرض Control UI رسالة "unauthorized" (أو تستمر في إعادة الاتصال). ماذا الآن؟'>
    لا يتطابق مسار مصادقة Gateway لديك مع طريقة المصادقة في واجهة المستخدم.

    حقائق (من الشيفرة):

    - تحتفظ Control UI بالرمز المميز في `sessionStorage` لجلسة علامة التبويب الحالية وعنوان URL المحدد لـ Gateway، لذا تستمر عمليات التحديث داخل علامة التبويب نفسها في العمل من دون استعادة استمرارية تخزين رمز طويل الأمد في localStorage.
    - عند `AUTH_TOKEN_MISMATCH`، يمكن للعملاء الموثوقين محاولة إعادة محاولة واحدة محدودة باستخدام رمز جهاز مخزّن عندما تعيد Gateway تلميحات إعادة محاولة (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - تستخدم إعادة المحاولة بالرمز المخزّن الآن النطاقات المعتمدة المخزّنة مع رمز الجهاز. أما المستدعون الصريحون عبر `deviceToken` / `scopes` الصريحة فيحتفظون بمجموعة النطاقات المطلوبة الخاصة بهم بدلًا من وراثة النطاقات المخزّنة.
    - خارج مسار إعادة المحاولة هذا، يكون ترتيب أولوية مصادقة الاتصال على النحو التالي: shared token/password الصريح أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزّن، ثم bootstrap token.
    - تكون فحوصات نطاق bootstrap token مسبوقة بالدور. فقائمة السماح المضمنة الخاصة بمشغل bootstrap تلبّي فقط طلبات المشغل؛ أما الأدوار الأخرى مثل node أو غيرها من الأدوار غير الخاصة بالمشغل فلا تزال تحتاج إلى نطاقات تحت بادئة الدور الخاصة بها.

    الحل:

    - الأسرع: `openclaw dashboard` (يطبع ويَنسخ عنوان URL للوحة التحكم، ويحاول فتحه؛ ويعرض تلميح SSH إذا كان الوضع headless).
    - إذا لم يكن لديك رمز مميز بعد: `openclaw doctor --generate-gateway-token`.
    - إذا كان بعيدًا، فأنشئ النفق أولًا: `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`.
    - وضع shared-secret: اضبط `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`، ثم ألصق السر المطابق في إعدادات Control UI.
    - وضع Tailscale Serve: تأكد من أن `gateway.auth.allowTailscale` مفعّل وأنك تفتح عنوان Serve URL، وليس عنوان loopback/tailnet خامًا يتجاوز رؤوس هوية Tailscale.
    - وضع trusted-proxy: تأكد من أنك تمر عبر الوكيل المدرك للهوية وغير loopback الذي تم تكوينه، وليس عبر وكيل loopback على المضيف نفسه أو عنوان URL الخام الخاص بـ Gateway.
    - إذا استمر عدم التطابق بعد إعادة المحاولة الواحدة، فقم بتدوير/إعادة اعتماد رمز الجهاز المقترن:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - إذا كان استدعاء التدوير هذا يقول إنه تم رفضه، فتحقق من شيئين:
      - يمكن لجلسات الأجهزة المقترنة تدوير **جهازها الخاص فقط** ما لم يكن لديها أيضًا `operator.admin`
      - لا يمكن لقيم `--scope` الصريحة أن تتجاوز نطاقات المشغل الحالية لدى المستدعي
    - ما زلت عالقًا؟ شغّل `openclaw status --all` واتبع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting). راجع [لوحة التحكم](/web/dashboard) لمعرفة تفاصيل المصادقة.

  </Accordion>

  <Accordion title="ضبطت gateway.bind tailnet لكنه لا يستطيع الربط ولا يوجد شيء يستمع">
    يختار ربط `tailnet` عنوان IP من Tailscale من واجهات الشبكة لديك (100.64.0.0/10). وإذا لم يكن الجهاز على Tailscale (أو إذا كانت الواجهة متوقفة)، فلن يوجد شيء يمكن الربط عليه.

    الحل:

    - ابدأ Tailscale على ذلك المضيف (حتى يحصل على عنوان 100.x)، أو
    - بدّل إلى `gateway.bind: "loopback"` / `"lan"`.

    ملاحظة: `tailnet` صريح. يفضّل `auto` وضع loopback؛ استخدم `gateway.bind: "tailnet"` عندما تريد ربطًا مخصصًا لـ tailnet فقط.

  </Accordion>

  <Accordion title="هل يمكنني تشغيل Gateways متعددة على المضيف نفسه؟">
    عادةً لا - إذ يمكن لـ Gateway واحدة تشغيل قنوات مراسلة ووكلاء متعددين. استخدم Gateways متعددة فقط عندما تحتاج إلى ازدواجية (مثل: روبوت إنقاذ) أو عزل صارم.

    نعم، لكن يجب عليك عزل:

    - `OPENCLAW_CONFIG_PATH` (إعدادات لكل نسخة)
    - `OPENCLAW_STATE_DIR` (حالة لكل نسخة)
    - `agents.defaults.workspace` (عزل مساحة العمل)
    - `gateway.port` (منافذ فريدة)

    إعداد سريع (موصى به):

    - استخدم `openclaw --profile <name> ...` لكل نسخة (ينشئ تلقائيًا `~/.openclaw-<name>`).
    - اضبط `gateway.port` فريدًا في إعدادات كل ملف تعريف (أو مرّر `--port` للتشغيل اليدوي).
    - ثبّت خدمة لكل ملف تعريف: `openclaw --profile <name> gateway install`.

    كما تضيف ملفات التعريف لاحقات إلى أسماء الخدمات (`ai.openclaw.<profile>`؛ والأنماط القديمة `com.openclaw.*` و`openclaw-gateway-<profile>.service` و`OpenClaw Gateway (<profile>)`).
    الدليل الكامل: [Gateways متعددة](/ar/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='ماذا يعني "invalid handshake" / الرمز 1008؟'>
    إن Gateway هو **خادم WebSocket**، ويتوقع أن تكون أول رسالة
    على الإطلاق هي إطار `connect`. وإذا استقبل أي شيء آخر، فإنه يغلق الاتصال
    بالرمز **1008** (مخالفة للسياسة).

    الأسباب الشائعة:

    - فتحت عنوان URL الخاص بـ **HTTP** في متصفح (`http://...`) بدلًا من عميل WS.
    - استخدمت المنفذ أو المسار الخطأ.
    - قام وكيل أو نفق بإزالة رؤوس المصادقة أو أرسل طلبًا ليس طلب Gateway.

    حلول سريعة:

    1. استخدم عنوان WS URL: `ws://<host>:18789` (أو `wss://...` إذا كان HTTPS).
    2. لا تفتح منفذ WS في علامة تبويب متصفح عادية.
    3. إذا كانت المصادقة مفعلة، فأدرج الرمز المميز/كلمة المرور في إطار `connect`.

    إذا كنت تستخدم CLI أو TUI، فيجب أن يبدو عنوان URL بالشكل التالي:

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

    يمكنك ضبط مسار ثابت عبر `logging.file`. ويتم التحكم في مستوى سجل الملفات عبر `logging.level`. أما درجة تفصيل وحدة التحكم فيتحكم بها `--verbose` و`logging.consoleLevel`.

    أسرع طريقة لعرض آخر السجلات:

    ```bash
    openclaw logs --follow
    ```

    سجلات الخدمة/المشرف (عندما تعمل Gateway عبر launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` و`gateway.err.log` (الافتراضي: `~/.openclaw/logs/...`؛ وتستخدم ملفات التعريف `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    راجع [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting) للمزيد.

  </Accordion>

  <Accordion title="كيف أبدأ/أوقف/أعيد تشغيل خدمة Gateway؟">
    استخدم أدوات المساعدة الخاصة بـ gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا كنت تشغّل Gateway يدويًا، فيمكن لـ `openclaw gateway --force` استعادة المنفذ. راجع [Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="أغلقت الطرفية على Windows - كيف أعيد تشغيل OpenClaw؟">
    توجد **طريقتا تثبيت على Windows**:

    **1) WSL2 (موصى به):** تعمل Gateway داخل Linux.

    افتح PowerShell، وادخل إلى WSL، ثم أعد التشغيل:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا لم تكن قد ثبّتت الخدمة مطلقًا، فابدأها في الواجهة الأمامية:

    ```bash
    openclaw gateway run
    ```

    **2) Windows الأصلي (غير موصى به):** تعمل Gateway مباشرة في Windows.

    افتح PowerShell وشغّل:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    إذا كنت تشغّله يدويًا (من دون خدمة)، فاستخدم:

    ```powershell
    openclaw gateway run
    ```

    الوثائق: [Windows (WSL2)](/ar/platforms/windows)، [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="Gateway تعمل لكن الردود لا تصل أبدًا. ما الذي يجب أن أتحقق منه؟">
    ابدأ بفحص سريع للصحة:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    الأسباب الشائعة:

    - لم يتم تحميل مصادقة النموذج على **مضيف Gateway** (تحقق من `models status`).
    - يقود الاقتران/قائمة السماح الخاصة بالقناة إلى حظر الردود (تحقق من إعدادات القناة + السجلات).
    - WebChat/لوحة التحكم مفتوحة من دون الرمز المميز الصحيح.

    إذا كنت في الوضع البعيد، فتأكد من أن اتصال النفق/Tailscale قائم وأن
    Gateway WebSocket قابلة للوصول.

    الوثائق: [القنوات](/ar/channels)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)، [الوصول البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - ماذا الآن؟'>
    يعني هذا عادةً أن واجهة المستخدم فقدت اتصال WebSocket. تحقّق مما يلي:

    1. هل Gateway تعمل؟ `openclaw gateway status`
    2. هل Gateway سليمة؟ `openclaw status`
    3. هل تملك واجهة المستخدم الرمز المميز الصحيح؟ `openclaw dashboard`
    4. إذا كان الوضع بعيدًا، فهل رابط النفق/Tailscale قائم؟

    ثم اعرض آخر السجلات:

    ```bash
    openclaw logs --follow
    ```

    الوثائق: [لوحة التحكم](/web/dashboard)، [الوصول البعيد](/ar/gateway/remote)، [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting).

  </Accordion>

  <Accordion title="يفشل Telegram setMyCommands. ما الذي يجب أن أتحقق منه؟">
    ابدأ بالسجلات وحالة القناة:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    ثم طابق الخطأ:

    - `BOT_COMMANDS_TOO_MUCH`: تحتوي قائمة Telegram على عدد كبير جدًا من الإدخالات. يقوم OpenClaw بالفعل بقصها إلى حد Telegram ثم يعيد المحاولة بعدد أقل من الأوامر، لكن بعض إدخالات القائمة ما تزال بحاجة إلى إزالة. قلّل من أوامر Plugin/Skill/الأوامر المخصصة، أو عطّل `channels.telegram.commands.native` إذا لم تكن بحاجة إلى القائمة.
    - `TypeError: fetch failed` أو `Network request for 'setMyCommands' failed!` أو أخطاء شبكة مشابهة: إذا كنت على VPS أو خلف وكيل، فتأكد من أن HTTPS الصادر مسموح وأن DNS يعمل مع `api.telegram.org`.

    إذا كانت Gateway بعيدة، فتأكد من أنك تنظر إلى السجلات على مضيف Gateway.

    الوثائق: [Telegram](/ar/channels/telegram)، [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting).

  </Accordion>

  <Accordion title="تعرض TUI مخرجات فارغة. ما الذي يجب أن أتحقق منه؟">
    تأكد أولًا من أن Gateway قابلة للوصول وأن الوكيل قادر على العمل:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    في TUI، استخدم `/status` لمعرفة الحالة الحالية. وإذا كنت تتوقع ردودًا في قناة دردشة،
    فتأكد من أن التسليم مفعّل (`/deliver on`).

    الوثائق: [TUI](/web/tui)، [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أوقف Gateway تمامًا ثم أبدأها؟">
    إذا كنت قد ثبّت الخدمة:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    يؤدي هذا إلى إيقاف/بدء **الخدمة الخاضعة للإشراف** (launchd على macOS، وsystemd على Linux).
    استخدم هذا عندما تعمل Gateway في الخلفية كعملية daemon.

    إذا كنت تشغّله في الواجهة الأمامية، فأوقفه باستخدام Ctrl-C، ثم:

    ```bash
    openclaw gateway run
    ```

    الوثائق: [دليل تشغيل خدمة Gateway](/ar/gateway).

  </Accordion>

  <Accordion title="اشرحها ببساطة: openclaw gateway restart مقابل openclaw gateway">
    - `openclaw gateway restart`: يعيد تشغيل **الخدمة الخلفية** (launchd/systemd).
    - `openclaw gateway`: يشغّل Gateway **في الواجهة الأمامية** لهذه الجلسة الطرفية.

    إذا كنت قد ثبّت الخدمة، فاستخدم أوامر gateway. واستخدم `openclaw gateway` عندما
    تريد تشغيلًا لمرة واحدة في الواجهة الأمامية.

  </Accordion>

  <Accordion title="أسرع طريقة للحصول على مزيد من التفاصيل عند فشل شيء ما">
    ابدأ Gateway باستخدام `--verbose` للحصول على مزيد من التفاصيل في وحدة التحكم. ثم افحص ملف السجل بحثًا عن مصادقة القناة، وتوجيه النموذج، وأخطاء RPC.
  </Accordion>
</AccordionGroup>

## الوسائط والمرفقات

<AccordionGroup>
  <Accordion title="ولّدت Skill صورة/PDF، لكن لم يتم إرسال أي شيء">
    يجب أن تتضمن المرفقات الصادرة من الوكيل سطر `MEDIA:<path-or-url>` (في سطر مستقل). راجع [إعداد مساعد OpenClaw](/ar/start/openclaw) و[إرسال الوكيل](/ar/tools/agent-send).

    الإرسال عبر CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    تحقّق أيضًا من:

    - أن القناة المستهدفة تدعم الوسائط الصادرة وليست محجوبة بواسطة قوائم السماح.
    - أن الملف ضمن حدود الحجم الخاصة بالموفّر (تتم إعادة تحجيم الصور إلى حد أقصى 2048px).
    - إن `tools.fs.workspaceOnly=true` يُبقي عمليات الإرسال بالمسار المحلي محصورة في مساحة العمل، وtemp/media-store، والملفات التي تم التحقق من صلاحيتها داخل العزل.
    - إن `tools.fs.workspaceOnly=false` يسمح لـ `MEDIA:` بإرسال الملفات المحلية على المضيف التي يستطيع الوكيل قراءتها بالفعل، لكن فقط للوسائط بالإضافة إلى أنواع المستندات الآمنة (الصور، والصوت، والفيديو، وPDF، ومستندات Office). أما النص العادي والملفات الشبيهة بالأسرار فما تزال محجوبة.

    راجع [الصور](/ar/nodes/images).

  </Accordion>
</AccordionGroup>

## الأمان والتحكم في الوصول

<AccordionGroup>
  <Accordion title="هل من الآمن تعريض OpenClaw للرسائل المباشرة الواردة؟">
    تعامل مع الرسائل المباشرة الواردة على أنها مدخلات غير موثوقة. وقد صُممت القيم الافتراضية لتقليل المخاطر:

    - السلوك الافتراضي في القنوات القادرة على DM هو **الاقتران**:
      - يتلقى المرسلون غير المعروفين رمز اقتران؛ ولا يعالج الروبوت رسالتهم.
      - وافق باستخدام: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - يتم تحديد الطلبات المعلقة عند **3 لكل قناة**؛ تحقّق من `openclaw pairing list --channel <channel> [--account <id>]` إذا لم يصل الرمز.
    - يتطلب فتح DM للعامة موافقة صريحة (`dmPolicy: "open"` وقائمة سماح `"*"`).

    شغّل `openclaw doctor` لإظهار سياسات DM التي تنطوي على مخاطر.

  </Accordion>

  <Accordion title="هل يُعد حقن المطالبات مصدر قلق فقط للروبوتات العامة؟">
    لا. إن حقن المطالبات يتعلق **بالمحتوى غير الموثوق**، وليس فقط بمن يمكنه مراسلة الروبوت مباشرة.
    فإذا كان مساعدك يقرأ محتوى خارجيًا (بحث/جلب الويب، وصفحات المتصفح، والرسائل الإلكترونية،
    والمستندات، والمرفقات، والسجلات الملصقة)، فقد يتضمن هذا المحتوى تعليمات تحاول
    اختطاف النموذج. ويمكن أن يحدث هذا حتى لو كنت **أنت المرسل الوحيد**.

    يكمن الخطر الأكبر عند تفعيل الأدوات: إذ يمكن خداع النموذج
    لتسريب السياق أو استدعاء الأدوات نيابةً عنك. وقلّل نطاق الضرر عبر:

    - استخدام وكيل "قارئ" للقراءة فقط أو معطّل الأدوات لتلخيص المحتوى غير الموثوق
    - إبقاء `web_search` / `web_fetch` / `browser` معطلة للوكلاء المفعّلين بالأدوات
    - معاملة النصوص المفككة من الملفات/المستندات على أنها غير موثوقة أيضًا: إذ يقوم كل من
      `input_file` في OpenResponses واستخراج مرفقات الوسائط بتغليف النص المستخرج داخل
      علامات حدود واضحة للمحتوى الخارجي بدلًا من تمرير نص الملف الخام
    - العزل وقوائم السماح الصارمة للأدوات

    التفاصيل: [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل ينبغي أن يملك الروبوت بريده الإلكتروني أو حساب GitHub أو رقم هاتفه الخاص؟">
    نعم، في معظم البيئات. إن عزل الروبوت بحسابات وأرقام هواتف منفصلة
    يقلل نطاق الضرر إذا حدث خطأ ما. كما يجعل هذا من الأسهل تدوير
    بيانات الاعتماد أو إلغاء الوصول دون التأثير في حساباتك الشخصية.

    ابدأ بشكل صغير. امنح الوصول فقط إلى الأدوات والحسابات التي تحتاجها فعليًا، ثم وسّع
    لاحقًا إذا لزم الأمر.

    الوثائق: [الأمان](/ar/gateway/security)، [الاقتران](/ar/channels/pairing).

  </Accordion>

  <Accordion title="هل يمكنني منحه استقلالية على رسائلي النصية وهل هذا آمن؟">
    نحن **لا** نوصي بالاستقلالية الكاملة على رسائلك الشخصية. والنمط الأكثر أمانًا هو:

    - أبقِ الرسائل المباشرة في **وضع الاقتران** أو ضمن قائمة سماح محكمة.
    - استخدم **رقمًا أو حسابًا منفصلًا** إذا كنت تريده أن يرسل نيابةً عنك.
    - دعه يصوغ الرسالة، ثم **وافق قبل الإرسال**.

    إذا كنت تريد التجربة، فافعل ذلك على حساب مخصص وأبقِه معزولًا. راجع
    [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج أرخص لمهام المساعد الشخصي؟">
    نعم، **إذا** كان الوكيل للدردشة فقط وكانت المدخلات موثوقة. فالطبقات الأصغر
    أكثر عرضة لاختطاف التعليمات، لذا تجنبها للوكلاء المفعّلين بالأدوات
    أو عند قراءة محتوى غير موثوق. وإذا اضطررت إلى استخدام نموذج أصغر، فقيّد
    الأدوات وشغّله داخل عزل. راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="شغّلت /start في Telegram لكنني لم أحصل على رمز اقتران">
    تُرسَل رموز الاقتران **فقط** عندما يرسل مرسل غير معروف رسالة إلى الروبوت ويكون
    `dmPolicy: "pairing"` مفعّلًا. ولا يؤدي `/start` بمفرده إلى توليد رمز.

    تحقّق من الطلبات المعلقة:

    ```bash
    openclaw pairing list telegram
    ```

    إذا كنت تريد وصولًا فوريًا، فأضف معرّف المرسل لديك إلى قائمة السماح أو اضبط `dmPolicy: "open"`
    لذلك الحساب.

  </Accordion>

  <Accordion title="WhatsApp: هل سيراسل جهات اتصالي؟ كيف يعمل الاقتران؟">
    لا. إن سياسة DM الافتراضية في WhatsApp هي **الاقتران**. يحصل المرسلون غير المعروفين فقط على رمز اقتران ولا **تُعالج** رسالتهم. ولا يرد OpenClaw إلا على الدردشات التي يستقبلها أو على الإرسالات الصريحة التي تشغّلها أنت.

    وافق على الاقتران باستخدام:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    اعرض الطلبات المعلقة:

    ```bash
    openclaw pairing list whatsapp
    ```

    مطالبة رقم الهاتف في المعالج: تُستخدم لضبط **قائمة السماح/المالك** الخاصة بك بحيث يُسمح برسائلك المباشرة. ولا تُستخدم للإرسال التلقائي. وإذا كنت تشغّله على رقم WhatsApp الشخصي لديك، فاستخدم ذلك الرقم وفعّل `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## أوامر الدردشة، وإيقاف المهام، و"لن يتوقف"

<AccordionGroup>
  <Accordion title="كيف أوقف ظهور رسائل النظام الداخلية في الدردشة؟">
    لا تظهر معظم الرسائل الداخلية أو رسائل الأدوات إلا عند تفعيل **verbose** أو **trace** أو **reasoning**
    لتلك الجلسة.

    أصلح ذلك في الدردشة التي ترى فيها هذه الرسائل:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    إذا ظلت مزعجة، فتحقّق من إعدادات الجلسة في Control UI واضبط verbose
    على **inherit**. وتأكد أيضًا من أنك لا تستخدم ملف تعريف روبوت مع `verboseDefault` مضبوط
    على `on` في الإعدادات.

    الوثائق: [التفكير وverbose](/ar/tools/thinking)، [الأمان](/ar/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="كيف أوقف/ألغي مهمة قيد التشغيل؟">
    أرسل أيًا مما يلي **كرسالة مستقلة** (من دون slash):

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

    هذه مُشغّلات إيقاف، وليست أوامر slash.

    بالنسبة إلى العمليات في الخلفية (من أداة exec)، يمكنك أن تطلب من الوكيل تشغيل:

    ```
    process action:kill sessionId:XXX
    ```

    نظرة عامة على أوامر slash: راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

    يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`، لكن بعض الاختصارات (مثل `/status`) تعمل أيضًا ضمن السطر للمرسلين الموجودين في قائمة السماح.

  </Accordion>

  <Accordion title='كيف أرسل رسالة Discord من Telegram؟ ("Cross-context messaging denied")'>
    يحظر OpenClaw المراسلة **عبر الموفّرين المختلفين** افتراضيًا. فإذا كان استدعاء أداة مرتبطًا
    بـ Telegram، فلن يرسل إلى Discord ما لم تسمح بذلك صراحةً.

    فعّل المراسلة عبر الموفّرين المختلفين لهذا الوكيل:

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

    أعد تشغيل Gateway بعد تعديل الإعدادات.

  </Accordion>

  <Accordion title='لماذا يبدو وكأن الروبوت "يتجاهل" الرسائل السريعة المتتالية؟'>
    يتحكم وضع الطابور في كيفية تفاعل الرسائل الجديدة مع تشغيل ما يزال قيد التنفيذ. استخدم `/queue` لتغيير الأوضاع:

    - `steer` - تعيد الرسائل الجديدة توجيه المهمة الحالية
    - `followup` - تشغّل الرسائل واحدة تلو الأخرى
    - `collect` - يجمع الرسائل ويرد مرة واحدة (الافتراضي)
    - `steer-backlog` - يعيد التوجيه الآن، ثم يعالج الأعمال المتراكمة
    - `interrupt` - يوقف التشغيل الحالي ويبدأ من جديد

    يمكنك إضافة خيارات مثل `debounce:2s cap:25 drop:summarize` لأوضاع المتابعة.

  </Accordion>
</AccordionGroup>

## متفرقات

<AccordionGroup>
  <Accordion title='ما النموذج الافتراضي لـ Anthropic عند استخدام مفتاح API؟'>
    في OpenClaw، تُعد بيانات الاعتماد واختيار النموذج أمرين منفصلين. إن ضبط `ANTHROPIC_API_KEY` (أو تخزين مفتاح Anthropic API في ملفات المصادقة) يفعّل المصادقة، لكن النموذج الافتراضي الفعلي هو ما تضبطه أنت في `agents.defaults.model.primary` (على سبيل المثال، `anthropic/claude-sonnet-4-6` أو `anthropic/claude-opus-4-6`). وإذا رأيت `No credentials found for profile "anthropic:default"`، فهذا يعني أن Gateway لم تتمكن من العثور على بيانات اعتماد Anthropic في `auth-profiles.json` المتوقع للوكيل الذي يعمل.
  </Accordion>
</AccordionGroup>

---

ما زلت عالقًا؟ اسأل في [Discord](https://discord.com/invite/clawd) أو افتح [مناقشة على GitHub](https://github.com/openclaw/openclaw/discussions).
