---
read_when:
    - تثبيت جديد، أو تعثر في الإعداد الأولي، أو أخطاء عند التشغيل الأول
    - اختيار المصادقة واشتراكات المزوّدين
    - تعذر الوصول إلى docs.openclaw.ai، أو تعذر فتح لوحة المعلومات، أو تعثر التثبيت
sidebarTitle: First-run FAQ
summary: 'الأسئلة الشائعة: البدء السريع وإعداد التشغيل الأول — التثبيت، والإعداد الأولي، والمصادقة، والاشتراكات، والإخفاقات الأولية'
title: 'الأسئلة الشائعة: إعداد التشغيل الأول'
x-i18n:
    generated_at: "2026-04-24T07:45:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68dd2d2c306735dc213a25c4d2a3e5c20e2a707ffca553f3e7503d75efd74f5c
    source_path: help/faq-first-run.md
    workflow: 15
---

  أسئلة وأجوبة البدء السريع والتشغيل الأول. وبالنسبة إلى العمليات اليومية، والنماذج، والمصادقة، والجلسات،
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## البدء السريع وإعداد التشغيل الأول

  <AccordionGroup>
  <Accordion title="أنا عالق، ما أسرع طريقة للخروج من المشكلة؟">
    استخدم وكيل ذكاء اصطناعي محليًا يمكنه **رؤية جهازك**. فهذا أكثر فعالية بكثير من السؤال
    في Discord، لأن معظم حالات «أنا عالق» تكون **مشكلات في الإعدادات أو البيئة المحلية**
    لا يستطيع المساعدون عن بُعد فحصها.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    يمكن لهذه الأدوات قراءة المستودع، وتشغيل الأوامر، وفحص السجلات، والمساعدة في إصلاح
    الإعداد على مستوى جهازك (PATH، والخدمات، والأذونات، وملفات المصادقة). امنحها
    **نسخة المصدر الكاملة** عبر التثبيت القابل للاختراق (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يؤدي هذا إلى تثبيت OpenClaw **من نسخة git checkout**، بحيث يمكن للوكيل قراءة الشيفرة + الوثائق
    والاستدلال بشأن الإصدار الدقيق الذي تشغله. ويمكنك دائمًا العودة إلى الإصدار المستقر لاحقًا
    عبر إعادة تشغيل المثبت من دون `--install-method git`.

    نصيحة: اطلب من الوكيل أن **يخطط للإصلاح ويشرف عليه** (خطوة بخطوة)، ثم ينفذ فقط
    الأوامر الضرورية. فهذا يبقي التغييرات صغيرة وأسهل في التدقيق.

    إذا اكتشفت خطأ حقيقيًا أو أصلحت شيئًا، فالرجاء تقديم issue على GitHub أو إرسال PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    ابدأ بهذه الأوامر (وشارك المخرجات عند طلب المساعدة):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    ما الذي تفعله:

    - `openclaw status`: لقطة سريعة لسلامة gateway/الوكيل + الإعدادات الأساسية.
    - `openclaw models status`: يفحص مصادقة المزوّد + توفر النماذج.
    - `openclaw doctor`: يتحقق من مشكلات الإعدادات/الحالة الشائعة ويصلحها.

    فحوصات CLI أخرى مفيدة: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    حلقة تصحيح سريعة: [أول 60 ثانية إذا كان هناك شيء معطل](#first-60-seconds-if-something-is-broken).
    وثائق التثبيت: [التثبيت](/ar/install)، [أعلام المثبت](/ar/install/installer)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="يواصل Heartbeat التخطي. ماذا تعني أسباب التخطي؟">
    أسباب تخطي Heartbeat الشائعة:

    - `quiet-hours`: خارج نافذة الساعات النشطة المضبوطة
    - `empty-heartbeat-file`: يوجد `HEARTBEAT.md` لكنه يحتوي فقط على هيكل فارغ/رؤوس فقط
    - `no-tasks-due`: وضع مهام `HEARTBEAT.md` نشط لكن لم يحِن موعد أي من فواصل المهام بعد
    - `alerts-disabled`: كل رؤية Heartbeat معطلة (`showOk` و`showAlerts` و`useIndicator` كلها متوقفة)

    في وضع المهام، لا يتم تقديم الطوابع الزمنية المستحقة إلا بعد اكتمال تشغيل Heartbeat
    فعليًا. ولا تضع التشغيلات المتخطاة علامة على اكتمال المهام.

    الوثائق: [Heartbeat](/ar/gateway/heartbeat)، [الأتمتة والمهام](/ar/automation).

  </Accordion>

  <Accordion title="الطريقة الموصى بها لتثبيت OpenClaw وإعداده">
    يوصي المستودع بالتشغيل من المصدر واستخدام الإعداد الأولي:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    يمكن للمعالج أيضًا بناء أصول واجهة المستخدم تلقائيًا. وبعد الإعداد الأولي، ستشغّل Gateway عادةً على المنفذ **18789**.

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

  <Accordion title="كيف أفتح لوحة المعلومات بعد الإعداد الأولي؟">
    يفتح المعالج متصفحك بعنوان URL نظيف (غير محمّل برمز) للوحة المعلومات مباشرةً بعد الإعداد الأولي، كما يطبع الرابط أيضًا في الملخص. أبقِ علامة التبويب هذه مفتوحة؛ وإذا لم تُفتح، فانسخ/ألصق عنوان URL المطبوع على الجهاز نفسه.
  </Accordion>

  <Accordion title="كيف أوثق لوحة المعلومات على localhost مقابل الوضع البعيد؟">
    **Localhost (الجهاز نفسه):**

    - افتح `http://127.0.0.1:18789/`.
    - إذا طلبت مصادقة السر المشترك، فألصق الرمز أو كلمة المرور المضبوطة في إعدادات Control UI.
    - مصدر الرمز: `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
    - مصدر كلمة المرور: `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
    - إذا لم يتم إعداد أي سر مشترك بعد، فأنشئ رمزًا عبر `openclaw doctor --generate-gateway-token`.

    **ليس على localhost:**

    - **Tailscale Serve** (موصى به): أبقِ الربط على local loopback، وشغّل `openclaw gateway --tailscale serve`، وافتح `https://<magicdns>/`. إذا كانت `gateway.auth.allowTailscale` تساوي `true`، فإن رؤوس الهوية تلبّي مصادقة Control UI/WebSocket (من دون لصق سر مشترك، بافتراض مضيف gateway موثوق)؛ أما واجهات HTTP API فما تزال تتطلب مصادقة السر المشترك إلا إذا استخدمت عمدًا وضع `none` للإدخال الخاص أو مصادقة HTTP من trusted-proxy.
      تتم موازاة محاولات مصادقة Serve المتزامنة السيئة من العميل نفسه قبل أن يسجل محدد المحاولات الفاشلة الإخفاق، لذا قد تُظهر إعادة المحاولة السيئة الثانية بالفعل `retry later`.
    - **ربط Tailnet**: شغّل `openclaw gateway --bind tailnet --token "<token>"` (أو اضبط مصادقة كلمة المرور)، وافتح `http://<tailscale-ip>:18789/`، ثم ألصق السر المشترك المطابق في إعدادات لوحة المعلومات.
    - **وكيل عكسي واعٍ بالهوية**: أبقِ Gateway خلف trusted proxy غير local loopback، واضبط `gateway.auth.mode: "trusted-proxy"`، ثم افتح عنوان URL الخاص بالوكيل.
    - **نفق SSH**: استخدم `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`. وما تزال مصادقة السر المشترك تنطبق عبر النفق؛ ألصق الرمز أو كلمة المرور المضبوطة إذا طُلب منك ذلك.

    راجع [لوحة المعلومات](/ar/web/dashboard) و[أسطح الويب](/ar/web) لمعرفة أوضاع الربط وتفاصيل المصادقة.

  </Accordion>

  <Accordion title="لماذا توجد إعدادات موافقة exec اثنتان لموافقات الدردشة؟">
    إنها تتحكم في طبقات مختلفة:

    - `approvals.exec`: يمرر مطالبات الموافقة إلى وجهات الدردشة
    - `channels.<channel>.execApprovals`: يجعل تلك القناة تعمل كعميل موافقة أصلي لموافقات exec

    ما تزال سياسة exec على المضيف هي بوابة الموافقة الحقيقية. أما إعدادات الدردشة فهي تتحكم فقط في مكان ظهور
    مطالبات الموافقة وكيفية رد الناس عليها.

    في معظم الإعدادات، **لا** تحتاج إلى كلتيهما:

    - إذا كانت الدردشة تدعم الأوامر والردود بالفعل، فإن `/approve` في الدردشة نفسها يعمل عبر المسار المشترك.
    - إذا كانت قناة أصلية مدعومة تستطيع استنتاج الموافقين بأمان، فإن OpenClaw يفعّل الآن تلقائيًا الموافقات الأصلية على الرسائل المباشرة أولًا عندما تكون `channels.<channel>.execApprovals.enabled` غير مضبوطة أو مضبوطة على `"auto"`.
    - عندما تتوفر بطاقات/أزرار الموافقة الأصلية، تكون واجهة المستخدم الأصلية هذه هي المسار الأساسي؛ ويجب ألا يضمّن الوكيل أمر `/approve` يدويًا إلا إذا كانت نتيجة الأداة تقول إن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.
    - استخدم `approvals.exec` فقط عندما يجب أيضًا تمرير المطالبات إلى دردشات أخرى أو غرف عمليات صريحة.
    - استخدم `channels.<channel>.execApprovals.target: "channel"` أو `"both"` فقط عندما تريد صراحةً نشر مطالبات الموافقة مرة أخرى داخل الغرفة/الموضوع الأصلي.
    - موافقات Plugin منفصلة مرة أخرى: فهي تستخدم `/approve` في الدردشة نفسها افتراضيًا، وتمرير `approvals.plugin` اختياريًا، وفقط بعض القنوات الأصلية تبقي معالجة plugin-approval-native فوق ذلك.

    النسخة القصيرة: التمرير مخصص للتوجيه، وإعداد العميل الأصلي مخصص لتجربة استخدام أغنى خاصة بالقناة.
    راجع [موافقات Exec](/ar/tools/exec-approvals).

  </Accordion>

  <Accordion title="ما بيئة التشغيل التي أحتاجها؟">
    Node **>= 22** مطلوب. ويوصى باستخدام `pnpm`. ولا يُنصح باستخدام Bun مع Gateway.
  </Accordion>

  <Accordion title="هل يعمل على Raspberry Pi؟">
    نعم. إن Gateway خفيف الوزن - فالوثائق تذكر أن **512MB-1GB من الذاكرة**، و**نواة واحدة**، وحوالي **500MB**
    من القرص تكفي للاستخدام الشخصي، كما تشير إلى أن **Raspberry Pi 4 يمكنه تشغيله**.

    وإذا كنت تريد مساحة إضافية (للسجلات، والوسائط، والخدمات الأخرى)، فإن **2GB موصى بها**، لكنها
    ليست حدًا أدنى صارمًا.

    نصيحة: يمكن لـ Pi/VPS صغير استضافة Gateway، ويمكنك إقران **Nodes** على حاسوبك المحمول/هاتفك من أجل
    الشاشة/الكاميرا/Canvas المحلية أو تنفيذ الأوامر. راجع [Nodes](/ar/nodes).

  </Accordion>

  <Accordion title="هل هناك نصائح لتثبيتات Raspberry Pi؟">
    النسخة القصيرة: إنه يعمل، لكن توقّع بعض الحواف الخشنة.

    - استخدم نظام تشغيل **64-bit** وأبقِ Node >= 22.
    - فضّل التثبيت **القابل للاختراق (git)** حتى تتمكن من رؤية السجلات والتحديث بسرعة.
    - ابدأ من دون قنوات/Skills، ثم أضفها واحدة تلو الأخرى.
    - إذا واجهت مشكلات غريبة في الملفات التنفيذية، فعادةً تكون مشكلة **توافق ARM**.

    الوثائق: [Linux](/ar/platforms/linux)، [التثبيت](/ar/install).

  </Accordion>

  <Accordion title="إنه عالق على wake up my friend / الإعداد الأولي لا يفقس. ماذا الآن؟">
    تعتمد تلك الشاشة على قابلية الوصول إلى Gateway ومصادقته. كما ترسل TUI أيضًا
    العبارة "Wake up, my friend!" تلقائيًا عند الفقس الأول. إذا رأيت هذا السطر **من دون رد**
    وبقيت الرموز عند 0، فهذا يعني أن الوكيل لم يعمل أبدًا.

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

    3. إذا بقي معلقًا، فشغّل:

    ```bash
    openclaw doctor
    ```

    إذا كان Gateway بعيدًا، فتأكد من أن اتصال النفق/Tailscale يعمل وأن واجهة المستخدم
    موجّهة إلى Gateway الصحيح. راجع [الوصول البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="هل يمكنني ترحيل الإعداد إلى جهاز جديد (Mac mini) من دون إعادة الإعداد الأولي؟">
    نعم. انسخ **دليل الحالة** و**مساحة العمل**، ثم شغّل Doctor مرة واحدة. فهذا
    يحافظ على بقاء البوت "تمامًا كما هو" (الذاكرة، وسجل الجلسات، والمصادقة، وحالة القنوات)
    ما دمت تنسخ **الموقعين** معًا:

    1. ثبّت OpenClaw على الجهاز الجديد.
    2. انسخ `$OPENCLAW_STATE_DIR` (الافتراضي: `~/.openclaw`) من الجهاز القديم.
    3. انسخ مساحة العمل الخاصة بك (الافتراضية: `~/.openclaw/workspace`).
    4. شغّل `openclaw doctor` وأعد تشغيل خدمة Gateway.

    يحافظ هذا على الإعدادات، وملفات تعريف المصادقة، وبيانات اعتماد WhatsApp، والجلسات، والذاكرة. وإذا كنت في
    الوضع البعيد، فتذكر أن مضيف gateway هو من يملك مخزن الجلسات ومساحة العمل.

    **مهم:** إذا كنت تلتزم/تدفع فقط مساحة عملك إلى GitHub، فأنت تنسخ احتياطيًا
    **الذاكرة + ملفات bootstrap**، لكنك **لا** تنسخ احتياطيًا سجل الجلسات أو المصادقة. فهذه تعيش
    تحت `~/.openclaw/` (على سبيل المثال `~/.openclaw/agents/<agentId>/sessions/`).

    ذو صلة: [الترحيل](/ar/install/migrating)، [أين توجد الأشياء على القرص](#where-things-live-on-disk)،
    [مساحة عمل الوكيل](/ar/concepts/agent-workspace)، [Doctor](/ar/gateway/doctor)،
    [الوضع البعيد](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين أرى ما الجديد في أحدث إصدار؟">
    تحقق من سجل التغييرات على GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    توجد أحدث الإدخالات في الأعلى. وإذا كان القسم العلوي موسومًا بـ **Unreleased**، فإن القسم المؤرخ التالي
    هو أحدث إصدار تم شحنه. وتُجمع الإدخالات تحت **Highlights** و**Changes** و
    **Fixes** (إضافة إلى أقسام الوثائق/الأقسام الأخرى عند الحاجة).

  </Accordion>

  <Accordion title="تعذر الوصول إلى docs.openclaw.ai (خطأ SSL)">
    تقوم بعض اتصالات Comcast/Xfinity بحظر `docs.openclaw.ai` بشكل غير صحيح عبر Xfinity
    Advanced Security. عطّلها أو أضف `docs.openclaw.ai` إلى قائمة السماح، ثم أعد المحاولة.
    نرجو مساعدتنا في رفع الحظر بالإبلاغ هنا: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    إذا كنت لا تزال غير قادر على الوصول إلى الموقع، فالوثائق معكوسة على GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="الفرق بين المستقر وbeta">
    إن **Stable** و**beta** هما **npm dist-tags**، وليسا خطي شيفرة منفصلين:

    - `latest` = المستقر
    - `beta` = إصدار مبكر للاختبار

    عادةً، يصل الإصدار المستقر إلى **beta** أولًا، ثم تنقل خطوة
    ترقية صريحة ذلك الإصدار نفسه إلى `latest`. ويمكن للمشرفين أيضًا
    النشر مباشرةً إلى `latest` عند الحاجة. ولهذا قد يشير beta وstable إلى **الإصدار نفسه**
    بعد الترقية.

    اطّلع على ما تغيّر:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    وللحصول على أوامر التثبيت المختصرة والفارق بين beta وdev، راجع الأكورديون أدناه.

  </Accordion>

  <Accordion title="كيف أثبت إصدار beta وما الفرق بين beta وdev؟">
    إن **Beta** هو npm dist-tag ‏`beta` (وقد يطابق `latest` بعد الترقية).
    أما **Dev** فهو الرأس المتحرك لفرع `main` ‏(git)؛ وعند نشره، يستخدم npm dist-tag ‏`dev`.

    أوامر مختصرة (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مثبّت Windows ‏(PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    مزيد من التفاصيل: [قنوات التطوير](/ar/install/development-channels) و[أعلام المثبت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أجرب أحدث الأجزاء؟">
    يوجد خياران:

    1. **قناة Dev (نسخة git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    يؤدي هذا إلى التبديل إلى الفرع `main` والتحديث من المصدر.

    2. **تثبيت قابل للاختراق (من موقع المثبت):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    يمنحك ذلك مستودعًا محليًا يمكنك تعديله، ثم تحديثه عبر git.

    إذا كنت تفضل نسخة clone نظيفة يدويًا، فاستخدم:

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

    - **التثبيت:** من دقيقتين إلى 5 دقائق
    - **الإعداد الأولي:** من 5 إلى 15 دقيقة بحسب عدد القنوات/النماذج التي تضبطها

    إذا تعلّق، فاستخدم [تعطل المثبت](#quick-start-and-first-run-setup)
    وحلقة التصحيح السريعة في [أنا عالق](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="المثبت عالق؟ كيف أحصل على مزيد من التغذية الراجعة؟">
    أعد تشغيل المثبت مع **مخرجات verbose**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    تثبيت Beta مع verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    لتثبيت قابل للاختراق (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    المكافئ في Windows ‏(PowerShell):

    ```powershell
    # لا يحتوي install.ps1 حتى الآن على علم -Verbose مخصص.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    مزيد من الخيارات: [أعلام المثبت](/ar/install/installer).

  </Accordion>

  <Accordion title="يقول تثبيت Windows إن git غير موجود أو إن openclaw غير معروف">
    توجد مشكلتان شائعتان في Windows:

    **1) خطأ npm ‏spawn git / git not found**

    - ثبّت **Git for Windows** وتأكد من أن `git` موجود على PATH.
    - أغلق PowerShell وأعد فتحه، ثم أعد تشغيل المثبت.

    **2) openclaw غير معروف بعد التثبيت**

    - مجلد npm global bin ليس موجودًا على PATH.
    - تحقق من المسار:

      ```powershell
      npm config get prefix
      ```

    - أضف ذلك الدليل إلى PATH الخاص بالمستخدم لديك (لا حاجة إلى اللاحقة `\bin` في Windows؛ وفي معظم الأنظمة يكون `%AppData%\npm`).
    - أغلق PowerShell وأعد فتحه بعد تحديث PATH.

    إذا كنت تريد أسلس إعداد على Windows، فاستخدم **WSL2** بدلًا من Windows الأصلي.
    الوثائق: [Windows](/ar/platforms/windows).

  </Accordion>

  <Accordion title="يعرض خرج exec في Windows نصًا صينيًا مشوّهًا - ماذا أفعل؟">
    يكون هذا عادةً بسبب عدم تطابق صفحة ترميز وحدة التحكم في shells الأصلية على Windows.

    الأعراض:

    - يعرض خرج `system.run`/`exec` النص الصيني بشكل مشوّه
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

    إذا كنت ما تزال تستطيع إعادة إنتاج هذه المشكلة على أحدث إصدار من OpenClaw، فتابعها/أبلغ عنها في:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="لم تجب الوثائق عن سؤالي - كيف أحصل على إجابة أفضل؟">
    استخدم **التثبيت القابل للاختراق (git)** بحيث يكون لديك المصدر والوثائق كاملين محليًا، ثم اسأل
    بوتك (أو Claude/Codex) _من ذلك المجلد_ حتى يتمكن من قراءة المستودع والإجابة بدقة.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    مزيد من التفاصيل: [التثبيت](/ar/install) و[أعلام المثبت](/ar/install/installer).

  </Accordion>

  <Accordion title="كيف أثبت OpenClaw على Linux؟">
    الإجابة القصيرة: اتبع دليل Linux، ثم شغّل الإعداد الأولي.

    - المسار السريع لـ Linux + تثبيت الخدمة: [Linux](/ar/platforms/linux).
    - الشرح الكامل: [البدء](/ar/start/getting-started).
    - المثبت + التحديثات: [التثبيت والتحديثات](/ar/install/updating).

  </Accordion>

  <Accordion title="كيف أثبت OpenClaw على VPS؟">
    أي Linux VPS يعمل. ثبّت على الخادم، ثم استخدم SSH/Tailscale للوصول إلى Gateway.

    الأدلة: [exe.dev](/ar/install/exe-dev)، [Hetzner](/ar/install/hetzner)، [Fly.io](/ar/install/fly).
    الوصول البعيد: [Gateway remote](/ar/gateway/remote).

  </Accordion>

  <Accordion title="أين توجد أدلة التثبيت السحابي/VPS؟">
    نحتفظ بـ **مركز استضافة** يضم المزوّدين الشائعين. اختر واحدًا واتبع الدليل:

    - [استضافة VPS](/ar/vps) (جميع المزوّدين في مكان واحد)
    - [Fly.io](/ar/install/fly)
    - [Hetzner](/ar/install/hetzner)
    - [exe.dev](/ar/install/exe-dev)

    كيف يعمل ذلك في السحابة: يعمل **Gateway على الخادم**، وتصل إليه
    من حاسوبك المحمول/هاتفك عبر Control UI (أو Tailscale/SSH). وتعيش حالتك + مساحة عملك
    على الخادم، لذا تعامل مع المضيف على أنه مصدر الحقيقة واحتفظ له بنسخة احتياطية.

    يمكنك إقران **Nodes** ‏(Mac/iOS/Android/headless) مع Gateway السحابي هذا للوصول إلى
    الشاشة/الكاميرا/Canvas المحلية أو تشغيل الأوامر على حاسوبك المحمول مع إبقاء
    Gateway في السحابة.

    المركز: [المنصات](/ar/platforms). الوصول البعيد: [Gateway remote](/ar/gateway/remote).
    Nodes: [Nodes](/ar/nodes)، [CLI الخاص بـ Nodes](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني أن أطلب من OpenClaw أن يحدّث نفسه؟">
    الإجابة القصيرة: **ممكن، لكنه غير موصى به**. يمكن لتدفق التحديث إعادة تشغيل
    Gateway (مما يقطع الجلسة النشطة)، وقد يحتاج إلى نسخة git checkout نظيفة،
    وقد يطلب تأكيدًا. والأكثر أمانًا: شغّل التحديثات من shell بصفتك المشغّل.

    استخدم CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    إذا كان لا بد من الأتمتة من داخل وكيل:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    الوثائق: [التحديث](/ar/cli/update)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="ماذا يفعل الإعداد الأولي فعليًا؟">
    يُعد `openclaw onboard` مسار الإعداد الموصى به. وفي **الوضع المحلي** يرشدك عبر:

    - **إعداد النموذج/المصادقة** (OAuth للمزوّد، ومفاتيح API، وsetup-token الخاص بـ Anthropic، إضافة إلى خيارات النماذج المحلية مثل LM Studio)
    - موقع **مساحة العمل** + ملفات bootstrap
    - **إعدادات Gateway** ‏(bind/port/auth/tailscale)
    - **القنوات** (WhatsApp وTelegram وDiscord وMattermost وSignal وiMessage، إضافة إلى Plugins القنوات المضمنة مثل QQ Bot)
    - **تثبيت daemon** ‏(LaunchAgent على macOS؛ ووحدة systemd للمستخدم على Linux/WSL2)
    - **فحوصات السلامة** واختيار **Skills**

    كما أنه يحذر إذا كان النموذج المضبوط غير معروف أو يفتقد المصادقة.

  </Accordion>

  <Accordion title="هل أحتاج إلى اشتراك Claude أو OpenAI لتشغيل هذا؟">
    لا. يمكنك تشغيل OpenClaw باستخدام **مفاتيح API** ‏(Anthropic/OpenAI/وغيرها) أو
    باستخدام **نماذج محلية فقط** بحيث تبقى بياناتك على جهازك. والاشتراكات (Claude
    Pro/Max أو OpenAI Codex) هي طرق اختيارية لمصادقة تلك المزوّدات.

    بالنسبة إلى Anthropic في OpenClaw، يكون التقسيم العملي كما يلي:

    - **مفتاح Anthropic API**: فوترة عادية لـ Anthropic API
    - **مصادقة Claude CLI / اشتراك Claude في OpenClaw**: أخبرنا فريق Anthropic
      أن هذا الاستخدام مسموح به مرة أخرى، ويتعامل OpenClaw مع استخدام `claude -p`
      على أنه مسموح لهذا التكامل ما لم تنشر Anthropic سياسة
      جديدة

    بالنسبة إلى مضيفات Gateway طويلة الأمد، ما تزال مفاتيح Anthropic API هي
    الإعداد الأكثر قابلية للتنبؤ. أما OpenAI Codex OAuth فهو مدعوم صراحةً للأدوات
    الخارجية مثل OpenClaw.

    يدعم OpenClaw أيضًا خيارات مستضافة أخرى على نمط الاشتراك، بما في ذلك
    **Qwen Cloud Coding Plan**، و**MiniMax Coding Plan**،
    و**Z.AI / GLM Coding Plan**.

    الوثائق: [Anthropic](/ar/providers/anthropic)، [OpenAI](/ar/providers/openai)،
    [Qwen Cloud](/ar/providers/qwen)،
    [MiniMax](/ar/providers/minimax)، [GLM Models](/ar/providers/glm)،
    [النماذج المحلية](/ar/gateway/local-models)، [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام اشتراك Claude Max من دون مفتاح API؟">
    نعم.

    أخبرنا فريق Anthropic أن استخدام Claude CLI على نمط OpenClaw مسموح به مرة أخرى، لذلك
    يتعامل OpenClaw مع مصادقة اشتراك Claude واستخدام `claude -p` على أنهما مسموحان
    لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. وإذا أردت
    إعدادًا جانبيًا على الخادم أكثر قابلية للتنبؤ، فاستخدم مفتاح Anthropic API بدلًا من ذلك.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك Claude (Claude Pro أو Max)؟">
    نعم.

    أخبرنا فريق Anthropic أن هذا الاستخدام مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع
    إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما مسموحان لهذا التكامل
    ما لم تنشر Anthropic سياسة جديدة.

    ما يزال Anthropic setup-token متاحًا كمسار رموز مميزة مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
    وبالنسبة إلى أعباء العمل الإنتاجية أو متعددة المستخدمين، تظل
    مصادقة مفتاح Anthropic API هي الخيار الأكثر أمانًا وقابلية للتنبؤ. وإذا كنت تريد خيارات
    مستضافة أخرى على نمط الاشتراك في OpenClaw، فراجع [OpenAI](/ar/providers/openai)، و[Qwen / Model
    Cloud](/ar/providers/qwen)، و[MiniMax](/ar/providers/minimax)، و[GLM
    Models](/ar/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="لماذا أرى HTTP 429 rate_limit_error من Anthropic؟">
    هذا يعني أن **الحصة/حد المعدل في Anthropic** قد استُنفِد لنافذة الوقت الحالية. وإذا كنت
    تستخدم **Claude CLI**، فانتظر حتى تُعاد تعيين النافذة أو قم بترقية خطتك. وإذا كنت
    تستخدم **مفتاح Anthropic API**، فتحقق من Anthropic Console
    للاستخدام/الفوترة وارفع الحدود عند الحاجة.

    إذا كانت الرسالة تحديدًا هي:
    `Extra usage is required for long context requests`، فهذا يعني أن الطلب يحاول استخدام
    النسخة التجريبية لسياق Anthropic البالغ 1M ‏(`context1m: true`). ولا يعمل ذلك إلا عندما
    تكون بيانات اعتمادك مؤهلة لفوترة السياق الطويل (فوترة مفتاح API أو
    مسار Claude-login الخاص بـ OpenClaw مع تفعيل Extra Usage).

    نصيحة: اضبط **نموذج رجوع** حتى يتمكن OpenClaw من مواصلة الرد أثناء خضوع أحد المزوّدين لحدود المعدل.
    راجع [النماذج](/ar/cli/models)، و[OAuth](/ar/concepts/oauth)، و
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ar/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="هل AWS Bedrock مدعوم؟">
    نعم. يحتوي OpenClaw على مزوّد **Amazon Bedrock (Converse)** مضمن. وعند وجود علامات بيئة AWS، يمكن لـ OpenClaw اكتشاف كتالوج Bedrock الخاص بالبث/النص تلقائيًا ودمجه كمزوّد ضمني `amazon-bedrock`؛ وإلا يمكنك تفعيل `plugins.entries.amazon-bedrock.config.discovery.enabled` صراحةً أو إضافة إدخال مزوّد يدوي. راجع [Amazon Bedrock](/ar/providers/bedrock) و[مزوّدو النماذج](/ar/providers/models). وإذا كنت تفضّل تدفق مفاتيح مُدارًا، فما يزال الوكيل المتوافق مع OpenAI أمام Bedrock خيارًا صالحًا.
  </Accordion>

  <Accordion title="كيف تعمل مصادقة Codex؟">
    يدعم OpenClaw **OpenAI Code (Codex)** عبر OAuth (تسجيل الدخول إلى ChatGPT). استخدم
    `openai-codex/gpt-5.5` لمصادقة Codex OAuth عبر مشغّل PI الافتراضي. واستخدم
    `openai/gpt-5.4` للوصول الحالي المباشر بمفتاح OpenAI API. ويُدعم الوصول المباشر
    إلى GPT-5.5 بمفتاح API بمجرد أن تفعّله OpenAI على API العام؛ أما اليوم
    فيستخدم GPT-5.5 الاشتراك/OAuth عبر `openai-codex/gpt-5.5` أو تشغيلات
    Codex app-server الأصلية مع `openai/gpt-5.5` و`embeddedHarness.runtime: "codex"`.
    راجع [مزوّدو النماذج](/ar/concepts/model-providers) و[الإعداد الأولي (CLI)](/ar/start/wizard).
  </Accordion>

  <Accordion title="لماذا ما يزال OpenClaw يذكر openai-codex؟">
    إن `openai-codex` هو معرّف المزوّد وملف تعريف المصادقة لـ ChatGPT/Codex OAuth.
    وهو أيضًا بادئة نموذج PI الصريحة لمصادقة Codex OAuth:

    - `openai/gpt-5.4` = مسار OpenAI الحالي المباشر بمفتاح API في PI
    - `openai/gpt-5.5` = مسار مفتاح API المباشر المستقبلي بمجرد أن تفعّل OpenAI ‏GPT-5.5 على API
    - `openai-codex/gpt-5.5` = مسار Codex OAuth في PI
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = مسار Codex app-server الأصلي
    - `openai-codex:...` = معرّف ملف تعريف مصادقة، وليس مرجع نموذج

    إذا كنت تريد مسار الفوترة/الحدود المباشر في OpenAI Platform، فاضبط
    `OPENAI_API_KEY`. وإذا كنت تريد مصادقة اشتراك ChatGPT/Codex، فسجّل الدخول باستخدام
    `openclaw models auth login --provider openai-codex` واستخدم
    مراجع النماذج `openai-codex/*` لتشغيلات PI.

  </Accordion>

  <Accordion title="لماذا قد تختلف حدود Codex OAuth عن ChatGPT على الويب؟">
    يستخدم Codex OAuth نوافذ حصة تعتمد على الخطة وتديرها OpenAI. وعمليًا،
    قد تختلف هذه الحدود عن تجربة موقع/تطبيق ChatGPT على الويب، حتى عندما
    يكون كلاهما مرتبطًا بالحساب نفسه.

    يمكن لـ OpenClaw عرض نوافذ الاستخدام/الحصة المرئية حاليًا للمزوّد في
    `openclaw models status`، لكنه لا يخترع ولا يطبّع استحقاقات ChatGPT-web
    إلى وصول مباشر لـ API. وإذا كنت تريد مسار الفوترة/الحدود المباشر في OpenAI Platform،
    فاستخدم `openai/*` مع مفتاح API.

  </Accordion>

  <Accordion title="هل تدعمون مصادقة اشتراك OpenAI (Codex OAuth)؟">
    نعم. يدعم OpenClaw بالكامل **OAuth الاشتراك لـ OpenAI Code (Codex)**.
    تسمح OpenAI صراحةً باستخدام OAuth الخاص بالاشتراك في الأدوات/التدفقات الخارجية
    مثل OpenClaw. ويمكن للإعداد الأولي تشغيل تدفق OAuth نيابةً عنك.

    راجع [OAuth](/ar/concepts/oauth)، و[مزوّدو النماذج](/ar/concepts/model-providers)، و[الإعداد الأولي (CLI)](/ar/start/wizard).

  </Accordion>

  <Accordion title="كيف أعد Gemini CLI OAuth؟">
    يستخدم Gemini CLI **تدفق مصادقة خاصًا بـ Plugin**، وليس معرّف عميل أو سرًا في `openclaw.json`.

    الخطوات:

    1. ثبّت Gemini CLI محليًا بحيث يكون `gemini` موجودًا على `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. فعّل Plugin: `openclaw plugins enable google`
    3. سجّل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. النموذج الافتراضي بعد تسجيل الدخول: `google-gemini-cli/gemini-3-flash-preview`
    5. إذا فشلت الطلبات، فاضبط `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف gateway

    يؤدي هذا إلى تخزين رموز OAuth في ملفات تعريف المصادقة على مضيف gateway. التفاصيل: [مزوّدو النماذج](/ar/concepts/model-providers).

  </Accordion>

  <Accordion title="هل النموذج المحلي مناسب للدردشات العفوية؟">
    عادةً لا. يحتاج OpenClaw إلى سياق كبير + أمان قوي؛ فالبطاقات الصغيرة تقتطع وتتسبب في تسريبات. وإذا اضطررت، فشغّل **أكبر** بناء نموذج يمكنك تشغيله محليًا (LM Studio) وراجع [/gateway/local-models](/ar/gateway/local-models). تزيد النماذج الأصغر/المكممة من خطر حقن المطالبات - راجع [الأمان](/ar/gateway/security).
  </Accordion>

  <Accordion title="كيف أبقي حركة مرور النماذج المستضافة ضمن منطقة محددة؟">
    اختر نقاط نهاية مثبتة على منطقة. يكشف OpenRouter خيارات مستضافة في الولايات المتحدة لـ MiniMax وKimi وGLM؛ اختر النسخة المستضافة في الولايات المتحدة للإبقاء على البيانات ضمن المنطقة. ولا يزال بإمكانك إدراج Anthropic/OpenAI إلى جانب هذه الخيارات باستخدام `models.mode: "merge"` بحيث تبقى عمليات الرجوع متاحة مع احترام المزوّد المقيّد بالمنطقة الذي تختاره.
  </Accordion>

  <Accordion title="هل يجب أن أشتري Mac Mini لتثبيت هذا؟">
    لا. يعمل OpenClaw على macOS أو Linux ‏(وWindows عبر WSL2). وMac mini اختياري - فبعض الأشخاص
    يشترونه كمضيف دائم التشغيل، لكن VPS صغيرًا أو خادمًا منزليًا أو صندوقًا من فئة Raspberry Pi يعمل أيضًا.

    لا تحتاج إلى Mac **إلا للأدوات الخاصة بـ macOS فقط**. وبالنسبة إلى iMessage، استخدم [BlueBubbles](/ar/channels/bluebubbles) (موصى به) - يعمل خادم BlueBubbles على أي Mac، ويمكن أن يعمل Gateway على Linux أو في مكان آخر. وإذا أردت أدوات أخرى خاصة بـ macOS فقط، فشغّل Gateway على Mac أو أقرن macOS Node.

    الوثائق: [BlueBubbles](/ar/channels/bluebubbles)، [Nodes](/ar/nodes)، [الوضع البعيد على Mac](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="هل أحتاج إلى Mac mini لدعم iMessage؟">
    تحتاج إلى **جهاز macOS ما** مسجل الدخول إلى Messages. وليس بالضرورة أن يكون Mac mini -
    أي Mac يعمل. **استخدم [BlueBubbles](/ar/channels/bluebubbles)** (موصى به) من أجل iMessage - يعمل خادم BlueBubbles على macOS، بينما يمكن أن يعمل Gateway على Linux أو في مكان آخر.

    الإعدادات الشائعة:

    - شغّل Gateway على Linux/VPS، وشغّل خادم BlueBubbles على أي Mac مسجل الدخول إلى Messages.
    - شغّل كل شيء على الـ Mac إذا كنت تريد أبسط إعداد على جهاز واحد.

    الوثائق: [BlueBubbles](/ar/channels/bluebubbles)، [Nodes](/ar/nodes)،
    [الوضع البعيد على Mac](/ar/platforms/mac/remote).

  </Accordion>

  <Accordion title="إذا اشتريت Mac mini لتشغيل OpenClaw، هل يمكنني وصله بـ MacBook Pro؟">
    نعم. يمكن لـ **Mac mini تشغيل Gateway**، ويمكن لـ MacBook Pro الاتصال بصفته
    **Node** ‏(جهازًا مرافقًا). ولا تقوم Nodes بتشغيل Gateway - بل توفر
    إمكانات إضافية مثل الشاشة/الكاميرا/Canvas و`system.run` على ذلك الجهاز.

    نمط شائع:

    - Gateway على Mac mini ‏(دائم التشغيل).
    - يشغّل MacBook Pro تطبيق macOS أو مضيف Node ويقترن بـ Gateway.
    - استخدم `openclaw nodes status` / `openclaw nodes list` لرؤيته.

    الوثائق: [Nodes](/ar/nodes)، [CLI الخاص بـ Nodes](/ar/cli/nodes).

  </Accordion>

  <Accordion title="هل يمكنني استخدام Bun؟">
    لا يُنصح باستخدام Bun. فنحن نرى أخطاء وقت تشغيل، خصوصًا مع WhatsApp وTelegram.
    استخدم **Node** من أجل Gateways مستقرة.

    وإذا كنت لا تزال تريد التجربة مع Bun، فافعل ذلك على Gateway غير إنتاجية
    ومن دون WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: ما الذي يوضع في allowFrom؟">
    إن `channels.telegram.allowFrom` هو **معرّف مستخدم Telegram الخاص بالمرسل البشري** (رقمي). وليس اسم مستخدم البوت.

    يطلب الإعداد معرّفات المستخدمين الرقمية فقط. وإذا كانت لديك بالفعل إدخالات `@username` قديمة في الإعدادات، فيمكن لـ `openclaw doctor --fix` محاولة تحليلها.

    الأكثر أمانًا (من دون بوت تابع لجهة خارجية):

    - أرسل رسالة مباشرة إلى بوتك، ثم شغّل `openclaw logs --follow` واقرأ `from.id`.

    Bot API الرسمي:

    - أرسل رسالة مباشرة إلى بوتك، ثم استدعِ `https://api.telegram.org/bot<bot_token>/getUpdates` واقرأ `message.from.id`.

    طرف ثالث (أقل خصوصية):

    - أرسل رسالة مباشرة إلى `@userinfobot` أو `@getidsbot`.

    راجع [/channels/telegram](/ar/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="هل يمكن لعدة أشخاص استخدام رقم WhatsApp واحد مع مثيلات OpenClaw مختلفة؟">
    نعم، عبر **التوجيه متعدد الوكلاء**. اربط الرسائل المباشرة في WhatsApp الخاصة بكل مرسل (peer من النوع `kind: "direct"`، ومعرّف E.164 للمرسل مثل `+15551234567`) بمعرّف `agentId` مختلف، بحيث يحصل كل شخص على مساحة عمله ومخزن جلساته الخاصين. وستظل الردود تخرج من **حساب WhatsApp نفسه**، كما أن التحكم في الوصول إلى الرسائل المباشرة (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) يكون عالميًا لكل حساب WhatsApp. راجع [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent) و[WhatsApp](/ar/channels/whatsapp).
  </Accordion>

  <Accordion title='هل يمكنني تشغيل وكيل "دردشة سريعة" ووكيل "Opus للبرمجة"؟'>
    نعم. استخدم التوجيه متعدد الوكلاء: امنح كل وكيل نموذجه الافتراضي الخاص، ثم اربط المسارات الواردة (حساب المزوّد أو peers محددين) بكل وكيل. يوجد مثال للإعدادات في [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent). راجع أيضًا [النماذج](/ar/concepts/models) و[الإعدادات](/ar/gateway/configuration).
  </Accordion>

  <Accordion title="هل يعمل Homebrew على Linux؟">
    نعم. يدعم Homebrew نظام Linux ‏(Linuxbrew). إعداد سريع:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    إذا كنت تشغّل OpenClaw عبر systemd، فتأكد من أن PATH الخاص بالخدمة يتضمن `/home/linuxbrew/.linuxbrew/bin` (أو بادئة brew الخاصة بك) بحيث يمكن تحليل الأدوات المثبتة عبر `brew` في shells غير التفاعلية.
    كما تضيف الإصدارات الحديثة أيضًا أدلة bin الشائعة للمستخدم في خدمات Linux systemd (على سبيل المثال `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) وتحترم `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, و`FNM_DIR` عند ضبطها.

  </Accordion>

  <Accordion title="الفرق بين تثبيت git القابل للاختراق وتثبيت npm">
    - **تثبيت git القابل للاختراق:** نسخة مصدر كاملة، قابلة للتحرير، وأفضل للمساهمين.
      تقوم بتشغيل عمليات البناء محليًا ويمكنك ترقيع الشيفرة/الوثائق.
    - **تثبيت npm:** تثبيت CLI عام، من دون مستودع، وهو الأفضل لمن يريد «مجرد تشغيله».
      تأتي التحديثات من npm dist-tags.

    الوثائق: [البدء](/ar/start/getting-started)، [التحديث](/ar/install/updating).

  </Accordion>

  <Accordion title="هل يمكنني التبديل بين تثبيتات npm وgit لاحقًا؟">
    نعم. ثبّت النكهة الأخرى، ثم شغّل Doctor بحيث تشير خدمة gateway إلى نقطة الدخول الجديدة.
    وهذا **لا يحذف بياناتك** - بل يغيّر فقط تثبيت شيفرة OpenClaw. وتبقى حالتك
    (`~/.openclaw`) ومساحة عملك (`~/.openclaw/workspace`) دون مساس.

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

    يكتشف Doctor عدم تطابق نقطة دخول خدمة gateway ويعرض إعادة كتابة إعداد الخدمة ليتوافق مع التثبيت الحالي (استخدم `--repair` في الأتمتة).

    نصائح النسخ الاحتياطي: راجع [استراتيجية النسخ الاحتياطي](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="هل يجب أن أشغّل Gateway على حاسوبي المحمول أم على VPS؟">
    الإجابة القصيرة: **إذا كنت تريد موثوقية على مدار الساعة طوال أيام الأسبوع، فاستخدم VPS**. وإذا كنت تريد
    أقل قدر من الاحتكاك ولا تمانع السكون/إعادة التشغيل، فشغّله محليًا.

    **الحاسوب المحمول (Gateway محلية)**

    - **الإيجابيات:** لا تكلفة خادم، وصول مباشر إلى الملفات المحلية، نافذة متصفح حية.
    - **السلبيات:** السكون/انقطاع الشبكة = انقطاعات، تحديثات/إعادات تشغيل نظام التشغيل تقطع العمل، ويجب أن يبقى الجهاز مستيقظًا.

    **VPS / السحابة**

    - **الإيجابيات:** دائم التشغيل، شبكة مستقرة، لا مشكلات سكون الحاسوب المحمول، وأسهل في الإبقاء عليه عاملًا.
    - **السلبيات:** غالبًا ما يعمل بلا واجهة (استخدم لقطات الشاشة)، وصول إلى الملفات عن بُعد فقط، ويجب عليك استخدام SSH للتحديثات.

    **ملاحظة خاصة بـ OpenClaw:** تعمل WhatsApp وTelegram وSlack وMattermost وDiscord جميعها بشكل جيد من VPS. والمقايضة الحقيقية الوحيدة هي **متصفح بلا واجهة** مقابل نافذة مرئية. راجع [المتصفح](/ar/tools/browser).

    **الافتراضي الموصى به:** VPS إذا كنت قد واجهت انقطاعات في gateway من قبل. أما التشغيل المحلي فهو رائع عندما تستخدم الـ Mac بنشاط وتريد الوصول إلى الملفات المحلية أو أتمتة واجهة المستخدم مع متصفح مرئي.

  </Accordion>

  <Accordion title="ما مدى أهمية تشغيل OpenClaw على جهاز مخصص؟">
    ليس مطلوبًا، لكنه **موصى به من أجل الموثوقية والعزل**.

    - **مضيف مخصص (VPS/Mac mini/Pi):** دائم التشغيل، انقطاعات أقل بسبب السكون/إعادة التشغيل، أذونات أنظف، وأسهل في الإبقاء عليه عاملًا.
    - **حاسوب محمول/مكتبي مشترك:** مناسب تمامًا للاختبار والاستخدام النشط، لكن توقّع توقفات عندما ينام الجهاز أو يتلقى تحديثات.

    إذا أردت أفضل ما في العالمين، فأبقِ Gateway على مضيف مخصص وأقرن حاسوبك المحمول كـ **Node** من أجل أدوات الشاشة/الكاميرا/exec المحلية. راجع [Nodes](/ar/nodes).
    ولإرشادات الأمان، اقرأ [الأمان](/ar/gateway/security).

  </Accordion>

  <Accordion title="ما الحد الأدنى لمتطلبات VPS ونظام التشغيل الموصى به؟">
    OpenClaw خفيف الوزن. وبالنسبة إلى Gateway أساسية + قناة دردشة واحدة:

    - **الحد الأدنى المطلق:** معالج افتراضي 1 vCPU، وذاكرة 1GB، وحوالي 500MB من القرص.
    - **الموصى به:** ‏1-2 vCPU، و2GB RAM أو أكثر لهامش إضافي (السجلات، والوسائط، والقنوات المتعددة). ويمكن أن تكون أدوات Node وأتمتة المتصفح شرهة للموارد.

    نظام التشغيل: استخدم **Ubuntu LTS** (أو أي Debian/Ubuntu حديث). فمسار تثبيت Linux مختبر بأفضل شكل هناك.

    الوثائق: [Linux](/ar/platforms/linux)، [استضافة VPS](/ar/vps).

  </Accordion>

  <Accordion title="هل يمكنني تشغيل OpenClaw داخل VM وما المتطلبات؟">
    نعم. تعامل مع VM كما تتعامل مع VPS: يجب أن تكون دائمة التشغيل، وقابلة للوصول، وأن تملك
    ذاكرة كافية لـ Gateway وأي قنوات تقوم بتفعيلها.

    إرشادات أساسية:

    - **الحد الأدنى المطلق:** معالج افتراضي 1 vCPU، وذاكرة 1GB.
    - **الموصى به:** ‏2GB RAM أو أكثر إذا كنت تشغّل قنوات متعددة، أو أتمتة متصفح، أو أدوات وسائط.
    - **نظام التشغيل:** Ubuntu LTS أو Debian/Ubuntu حديث آخر.

    إذا كنت تستخدم Windows، فإن **WSL2 هو أسهل إعداد على نمط VM** ويمتلك أفضل
    توافق مع الأدوات. راجع [Windows](/ar/platforms/windows)، [استضافة VPS](/ar/vps).
    وإذا كنت تشغّل macOS داخل VM، فراجع [macOS VM](/ar/install/macos-vm).

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية (النماذج، والجلسات، وgateway، والأمان، والمزيد)
- [نظرة عامة على التثبيت](/ar/install)
- [البدء](/ar/start/getting-started)
- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
