---
read_when:
    - تحتاج إلى سلوك مفصل لـ `openclaw onboard`
    - أنت تقوم بتصحيح نتائج onboarding أو بدمج عملاء onboarding
sidebarTitle: CLI reference
summary: مرجع كامل لتدفق إعداد CLI، وإعداد المصادقة/النموذج، والمخرجات، والبنى الداخلية
title: مرجع إعداد CLI
x-i18n:
    generated_at: "2026-04-25T18:23:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967fd6734d8facaa732b40567c33e48434208bf861d102adc8a4ee042f13041
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

هذه الصفحة هي المرجع الكامل لـ `openclaw onboard`.
للاطلاع على الدليل المختصر، راجع [Onboarding (CLI)](/ar/start/wizard).

## ما الذي يفعله المعالج

يقودك الوضع المحلي (الافتراضي) خلال:

- إعداد النموذج والمصادقة (OpenAI Code subscription OAuth، وAnthropic Claude CLI أو مفتاح API، بالإضافة إلى خيارات MiniMax وGLM وOllama وMoonshot وStepFun وAI Gateway)
- موقع مساحة العمل وملفات bootstrap
- إعدادات Gateway (المنفذ، والربط، والمصادقة، وTailscale)
- القنوات والمزوّدون (Telegram وWhatsApp وDiscord وGoogle Chat وMattermost وSignal وBlueBubbles وغيرها من إضافات القنوات المجمعة)
- تثبيت الخدمة الخلفية (LaunchAgent، أو systemd user unit، أو Scheduled Task أصلي في Windows مع fallback إلى مجلد Startup)
- فحص الصحة
- إعداد Skills

يُكوّن الوضع البعيد هذا الجهاز للاتصال بـ Gateway موجود في مكان آخر.
ولا يقوم بتثبيت أي شيء أو تعديله على المضيف البعيد.

## تفاصيل التدفق المحلي

<Steps>
  <Step title="اكتشاف الإعدادات الحالية">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر Keep أو Modify أو Reset.
    - لا تؤدي إعادة تشغيل المعالج إلى مسح أي شيء ما لم تختر Reset صراحةً (أو تمرّر `--reset`).
    - يضبط CLI الخيار `--reset` افتراضيًا على `config+creds+sessions`؛ استخدم `--reset-scope full` لإزالة مساحة العمل أيضًا.
    - إذا كانت الإعدادات غير صالحة أو تحتوي على مفاتيح قديمة، فسيتوقف المعالج ويطلب منك تشغيل `openclaw doctor` قبل المتابعة.
    - يستخدم Reset الأمر `trash` ويعرض النطاقات التالية:
      - الإعدادات فقط
      - الإعدادات + بيانات الاعتماد + الجلسات
      - إعادة تعيين كاملة (تزيل مساحة العمل أيضًا)

  </Step>
  <Step title="النموذج والمصادقة">
    - توجد مصفوفة الخيارات الكاملة في [خيارات المصادقة والنموذج](#خيارات-المصادقة-والنموذج).

  </Step>
  <Step title="مساحة العمل">
    - الافتراضي هو `~/.openclaw/workspace` (قابل للتكوين).
    - يزرع ملفات مساحة العمل المطلوبة لطقس bootstrap الخاص بأول تشغيل.
    - تخطيط مساحة العمل: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - يطلب المنفذ، والربط، ووضع المصادقة، وإتاحة Tailscale.
    - الموصى به: إبقاء مصادقة الرمز المميز مفعّلة حتى مع loopback حتى تضطر عملاء WS المحليون إلى المصادقة.
    - في وضع الرمز المميز، يوفّر الإعداد التفاعلي:
      - **توليد/تخزين رمز مميز نصي صريح** (الافتراضي)
      - **استخدام SecretRef** (اختياري)
    - في وضع كلمة المرور، يدعم الإعداد التفاعلي أيضًا التخزين النصي الصريح أو SecretRef.
    - مسار SecretRef غير التفاعلي للرمز المميز: `--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير env غير فارغ في بيئة عملية onboarding.
      - لا يمكن دمجه مع `--gateway-token`.
    - عطّل المصادقة فقط إذا كنت تثق تمامًا بكل عملية محلية.
    - لا تزال عمليات الربط غير الخاصة بـ loopback تتطلب المصادقة.

  </Step>
  <Step title="القنوات">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول QR اختياري
    - [Telegram](/ar/channels/telegram): رمز bot
    - [Discord](/ar/channels/discord): رمز bot
    - [Google Chat](/ar/channels/googlechat): JSON لحساب خدمة + جمهور Webhook
    - [Mattermost](/ar/channels/mattermost): رمز bot + عنوان URL أساسي
    - [Signal](/ar/channels/signal): تثبيت اختياري لـ `signal-cli` + إعداد الحساب
    - [BlueBubbles](/ar/channels/bluebubbles): موصى به لـ iMessage؛ عنوان URL للخادم + كلمة مرور + Webhook
    - [iMessage](/ar/channels/imessage): مسار `imsg` CLI القديم + وصول إلى قاعدة البيانات
    - أمان DM: الإعداد الافتراضي هو pairing. ترسل أول DM رمزًا؛ وافق عبر
      `openclaw pairing approve <channel> <code>` أو استخدم allowlists.
  </Step>
  <Step title="تثبيت الخدمة الخلفية">
    - macOS: LaunchAgent
      - يتطلب جلسة مستخدم مسجّل الدخول؛ وللاستخدام دون واجهة، استخدم LaunchDaemon مخصصًا (غير مرفق).
    - Linux وWindows عبر WSL2: systemd user unit
      - يحاول المعالج تنفيذ `loginctl enable-linger <user>` حتى يبقى gateway يعمل بعد تسجيل الخروج.
      - قد يطلب sudo (يكتب إلى `/var/lib/systemd/linger`)؛ ويحاول أولًا دون sudo.
    - Windows الأصلي: Scheduled Task أولًا
      - إذا تم رفض إنشاء المهمة، يعود OpenClaw إلى عنصر تسجيل دخول لكل مستخدم في مجلد Startup ويبدأ gateway فورًا.
      - تظل Scheduled Tasks مفضلة لأنها توفر حالة مشرف أفضل.
    - اختيار وقت التشغيل: Node (موصى به؛ ومطلوب لـ WhatsApp وTelegram). ولا يُنصح بـ Bun.

  </Step>
  <Step title="فحص الصحة">
    - يبدأ Gateway (إذا لزم الأمر) ويشغّل `openclaw health`.
    - يضيف `openclaw status --deep` مسبار صحة gateway الحي إلى مخرجات الحالة، بما في ذلك مسابير القنوات عندما تكون مدعومة.

  </Step>
  <Step title="Skills">
    - يقرأ Skills المتاحة ويفحص المتطلبات.
    - يتيح لك اختيار مدير Node: npm أو pnpm أو bun.
    - يثبّت التبعيات الاختيارية (يستخدم بعضها Homebrew على macOS).

  </Step>
  <Step title="الإنهاء">
    - ملخص وخطوات تالية، بما في ذلك خيارات تطبيقات iOS وAndroid وmacOS.

  </Step>
</Steps>

<Note>
إذا لم تُكتشف أي واجهة GUI، يطبع المعالج تعليمات إعادة توجيه منفذ SSH لـ Control UI بدلًا من فتح متصفح.
إذا كانت أصول Control UI مفقودة، يحاول المعالج بناءها؛ والمسار الاحتياطي هو `pnpm ui:build` (مع تثبيت تلقائي لتبعيات UI).
</Note>

## تفاصيل الوضع البعيد

يُكوّن الوضع البعيد هذا الجهاز للاتصال بـ Gateway موجود في مكان آخر.

<Info>
لا يقوم الوضع البعيد بتثبيت أي شيء أو تعديله على المضيف البعيد.
</Info>

ما الذي تعيّنه:

- عنوان URL لـ Gateway البعيد (`ws://...`)
- الرمز المميز إذا كانت مصادقة Gateway البعيد مطلوبة (موصى به)

<Note>
- إذا كان gateway مقيدًا على loopback فقط، فاستخدم SSH tunneling أو tailnet.
- تلميحات الاكتشاف:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## خيارات المصادقة والنموذج

<AccordionGroup>
  <Accordion title="مفتاح API لـ Anthropic">
    يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يحفظه لاستخدام الخدمة الخلفية.
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    تدفق المتصفح؛ الصق `code#state`.

    يضبط `agents.defaults.model` على `openai-codex/gpt-5.5` عندما لا يكون النموذج معيّنًا أو يكون بالفعل من عائلة OpenAI.

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    تدفق pairing في المتصفح باستخدام رمز جهاز قصير العمر.

    يضبط `agents.defaults.model` على `openai-codex/gpt-5.5` عندما لا يكون النموذج معيّنًا أو يكون بالفعل من عائلة OpenAI.

  </Accordion>
  <Accordion title="مفتاح API لـ OpenAI">
    يستخدم `OPENAI_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يخزن بيانات الاعتماد في ملفات تعريف المصادقة.

    يضبط `agents.defaults.model` على `openai/gpt-5.5` عندما لا يكون النموذج معيّنًا، أو يكون `openai/*`، أو `openai-codex/*`.

  </Accordion>
  <Accordion title="مفتاح API لـ xAI (Grok)">
    يطلب `XAI_API_KEY` ويكوّن xAI كمزوّد نماذج.
  </Accordion>
  <Accordion title="OpenCode">
    يطلب `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`) ويتيح لك اختيار فهرس Zen أو Go.
    عنوان URL للإعداد: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="مفتاح API (عام)">
    يخزن المفتاح لك.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    يطلب `AI_GATEWAY_API_KEY`.
    مزيد من التفاصيل: [Vercel AI Gateway](/ar/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    يطلب معرّف الحساب، ومعرّف gateway، و`CLOUDFLARE_AI_GATEWAY_API_KEY`.
    مزيد من التفاصيل: [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    تُكتب الإعدادات تلقائيًا. الإعداد الافتراضي المستضاف هو `MiniMax-M2.7`؛ ويستخدم إعداد مفتاح API
    `minimax/...`، بينما يستخدم إعداد OAuth الصيغة `minimax-portal/...`.
    مزيد من التفاصيل: [MiniMax](/ar/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    تُكتب الإعدادات تلقائيًا لـ StepFun standard أو Step Plan على نقاط النهاية الصينية أو العالمية.
    يتضمن Standard حاليًا `step-3.5-flash`، كما يتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    مزيد من التفاصيل: [StepFun](/ar/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (متوافق مع Anthropic)">
    يطلب `SYNTHETIC_API_KEY`.
    مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (نماذج سحابية ومحلية مفتوحة)">
    يطلب أولًا `Cloud + Local` أو `Cloud only` أو `Local only`.
    يستخدم `Cloud only` المفتاح `OLLAMA_API_KEY` مع `https://ollama.com`.
    تطلب الأوضاع المدعومة بالمضيف عنوان URL الأساسي (الافتراضي `http://127.0.0.1:11434`)، وتكتشف النماذج المتاحة، وتقترح الإعدادات الافتراضية.
    كما يتحقق `Cloud + Local` مما إذا كان مضيف Ollama ذلك مسجّل الدخول للوصول السحابي.
    مزيد من التفاصيل: [Ollama](/ar/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot وKimi Coding">
    تُكتب إعدادات Moonshot (Kimi K2) وKimi Coding تلقائيًا.
    مزيد من التفاصيل: [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot).
  </Accordion>
  <Accordion title="مزوّد مخصص">
    يعمل مع نقاط النهاية المتوافقة مع OpenAI والمتوافقة مع Anthropic.

    يدعم onboarding التفاعلي خيارات تخزين مفتاح API نفسها مثل تدفقات مفاتيح API لمزوّدين آخرين:
    - **ألصق مفتاح API الآن** (نص صريح)
    - **استخدم مرجع سر** (مرجع env أو مرجع مزوّد مُكوَّن، مع تحقق تمهيدي)

    الأعلام غير التفاعلية:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (اختياري؛ يعود إلى `CUSTOM_API_KEY`)
    - `--custom-provider-id` (اختياري)
    - `--custom-compatibility <openai|anthropic>` (اختياري؛ الافتراضي `openai`)

  </Accordion>
  <Accordion title="تخطي">
    يترك المصادقة غير مكوّنة.
  </Accordion>
</AccordionGroup>

سلوك النموذج:

- اختر النموذج الافتراضي من الخيارات المكتشفة، أو أدخل المزوّد والنموذج يدويًا.
- عندما يبدأ onboarding من اختيار مصادقة مزوّد، يفضّل منتقي النماذج
  ذلك المزوّد تلقائيًا. وبالنسبة إلى Volcengine وBytePlus، تطابق الأفضلية نفسها
  أيضًا متغيرات coding-plan الخاصة بهما (`volcengine-plan/*`,
  `byteplus-plan/*`).
- إذا كانت تصفية المزوّد المفضّل هذه ستؤدي إلى قائمة فارغة، يعود المنتقي إلى
  الفهرس الكامل بدلًا من إظهار عدم وجود نماذج.
- يشغّل المعالج فحصًا للنموذج ويصدر تحذيرًا إذا كان النموذج المكوَّن غير معروف أو كانت المصادقة مفقودة.

مسارات بيانات الاعتماد وملفات التعريف:

- ملفات تعريف المصادقة (مفاتيح API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- استيراد OAuth القديم: `~/.openclaw/credentials/oauth.json`

وضع تخزين بيانات الاعتماد:

- يحفظ سلوك onboarding الافتراضي مفاتيح API كقيم نصية صريحة في ملفات تعريف المصادقة.
- يفعّل `--secret-input-mode ref` وضع المرجع بدلًا من تخزين المفتاح كنص صريح.
  في الإعداد التفاعلي، يمكنك اختيار أحد الخيارين:
  - مرجع متغير بيئة (على سبيل المثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - مرجع مزوّد مُكوَّن (`file` أو `exec`) مع اسم مستعار للمزوّد + معرّف
- يشغّل وضع المرجع التفاعلي تحققًا تمهيديًا سريعًا قبل الحفظ.
  - مراجع Env: يتحقق من اسم المتغير + وجود قيمة غير فارغة في بيئة onboarding الحالية.
  - مراجع المزوّد: يتحقق من إعدادات المزوّد ويحل المعرّف المطلوب.
  - إذا فشل التحقق التمهيدي، يعرض onboarding الخطأ ويتيح لك إعادة المحاولة.
- في الوضع غير التفاعلي، يكون `--secret-input-mode ref` مدعومًا عبر env فقط.
  - عيّن متغير env الخاص بالمزوّد في بيئة عملية onboarding.
  - تتطلب أعلام المفاتيح المضمنة (مثل `--openai-api-key`) تعيين متغير env هذا؛ وإلا يفشل onboarding سريعًا.
  - بالنسبة إلى المزوّدات المخصصة، يخزن وضع `ref` غير التفاعلي `models.providers.<id>.apiKey` بالشكل `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - في حالة المزوّد المخصص هذه، يتطلب `--custom-api-key` تعيين `CUSTOM_API_KEY`؛ وإلا يفشل onboarding سريعًا.
- تدعم بيانات اعتماد مصادقة Gateway خياري النص الصريح وSecretRef في الإعداد التفاعلي:
  - وضع الرمز المميز: **توليد/تخزين رمز مميز نصي صريح** (الافتراضي) أو **استخدام SecretRef**.
  - وضع كلمة المرور: نص صريح أو SecretRef.
- مسار SecretRef غير التفاعلي للرمز المميز: `--gateway-token-ref-env <ENV_VAR>`.
- تستمر الإعدادات النصية الصريحة الحالية في العمل من دون تغيير.

<Note>
نصيحة للخوادم وبيئات دون واجهة: أكمل OAuth على جهاز يحتوي على متصفح، ثم انسخ
ملف `auth-profiles.json` الخاص بذلك الوكيل (على سبيل المثال
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو المسار المطابق
`$OPENCLAW_STATE_DIR/...`) إلى مضيف gateway. ويُعد `credentials/oauth.json`
مصدر استيراد قديمًا فقط.
</Note>

## المخرجات والبنى الداخلية

الحقول النموذجية في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` عند تمرير `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (إذا تم اختيار MiniMax)
- `tools.profile` (يضبط onboarding المحلي هذا الحقل افتراضيًا إلى `"coding"` عندما لا يكون معيّنًا؛ وتُحفظ القيم الصريحة الموجودة كما هي)
- `gateway.*` (الوضع، والربط، والمصادقة، وTailscale)
- `session.dmScope` (يضبط onboarding المحلي هذا الحقل افتراضيًا إلى `per-channel-peer` عندما لا يكون معيّنًا؛ وتُحفظ القيم الصريحة الموجودة كما هي)
- `channels.telegram.botToken`، و`channels.discord.token`، و`channels.matrix.*`، و`channels.signal.*`، و`channels.imessage.*`
- allowlists الخاصة بالقنوات (Slack وDiscord وMatrix وMicrosoft Teams) عندما توافق عليها أثناء المطالبات (تُحل الأسماء إلى معرّفات عند الإمكان)
- `skills.install.nodeManager`
  - يقبل العلم `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - لا يزال بالإمكان تعيين `skills.install.nodeManager: "yarn"` يدويًا لاحقًا في config.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

يكتب `openclaw agents add` إلى `agents.list[]` وإلى `bindings` الاختيارية.

توجد بيانات اعتماد WhatsApp تحت `~/.openclaw/credentials/whatsapp/<accountId>/`.
وتُخزَّن الجلسات تحت `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
تُسلَّم بعض القنوات على شكل Plugins. وعند اختيارها أثناء الإعداد، يطلب المعالج
تثبيت Plugin (عبر npm أو مسار محلي) قبل تكوين القناة.
</Note>

واجهة RPC لمعالج Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

يمكن للعملاء (تطبيق macOS وControl UI) عرض الخطوات من دون إعادة تنفيذ منطق onboarding.

سلوك إعداد Signal:

- ينزّل أصل الإصدار المناسب
- يخزّنه تحت `~/.openclaw/tools/signal-cli/<version>/`
- يكتب `channels.signal.cliPath` في config
- تتطلب إصدارات JVM وجود Java 21
- تُستخدم الإصدارات الأصلية عندما تكون متاحة
- يستخدم Windows نظام WSL2 ويتبع تدفق `signal-cli` الخاص بـ Linux داخل WSL

## مستندات ذات صلة

- مركز onboarding: [Onboarding (CLI)](/ar/start/wizard)
- الأتمتة والبرامج النصية: [أتمتة CLI](/ar/start/wizard-cli-automation)
- مرجع الأوامر: [`openclaw onboard`](/ar/cli/onboard)
