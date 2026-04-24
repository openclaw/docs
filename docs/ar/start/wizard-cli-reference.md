---
read_when:
    - تحتاج إلى سلوك تفصيلي لـ openclaw onboard
    - أنت تقوم بتصحيح نتائج onboarding أو دمج عملاء onboarding
sidebarTitle: CLI reference
summary: المرجع الكامل لتدفق إعداد CLI، وإعداد المصادقة/النموذج، والمخرجات، والداخليات
title: مرجع إعداد CLI
x-i18n:
    generated_at: "2026-04-24T08:06:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4b9377e84a6f8063f20a80fe08b5ea2eccdd5b329ec8dfd9d16cbf425d01f66
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

هذه الصفحة هي المرجع الكامل لـ `openclaw onboard`.
أما الدليل المختصر، فراجع [الإعداد الأولي (CLI)](/ar/start/wizard).

## ما الذي يفعله المعالج

في الوضع المحلي (الافتراضي) يرشدك خلال:

- إعداد النموذج والمصادقة (اشتراك OpenAI Code عبر OAuth، وAnthropic Claude CLI أو مفتاح API، بالإضافة إلى خيارات MiniMax وGLM وOllama وMoonshot وStepFun وAI Gateway)
- موقع مساحة العمل وملفات bootstrap
- إعدادات Gateway ‏(المنفذ، والربط، والمصادقة، وtailscale)
- القنوات والمزوّدون (Telegram، وWhatsApp، وDiscord، وGoogle Chat، وMattermost، وSignal، وBlueBubbles، وغيرها من Plugins القنوات المضمّنة)
- تثبيت daemon ‏(LaunchAgent، أو systemd user unit، أو Scheduled Task أصلي في Windows مع احتياط مجلد Startup)
- الفحص الصحي
- إعداد Skills

يُكوِّن الوضع البعيد هذا الجهاز للاتصال بـ gateway موجود في مكان آخر.
وهو لا يثبّت أو يغيّر أي شيء على المضيف البعيد.

## تفاصيل التدفق المحلي

<Steps>
  <Step title="اكتشاف التكوين الموجود">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر Keep، أو Modify، أو Reset.
    - لا تؤدي إعادة تشغيل المعالج إلى مسح أي شيء ما لم تختر Reset صراحةً (أو تمرر `--reset`).
    - يستخدم CLI ‏`--reset` افتراضيًا النطاق `config+creds+sessions`؛ استخدم `--reset-scope full` لإزالة مساحة العمل أيضًا.
    - إذا كان التكوين غير صالح أو يحتوي على مفاتيح قديمة، يتوقف المعالج ويطلب منك تشغيل `openclaw doctor` قبل المتابعة.
    - يستخدم Reset الأمر `trash` ويعرض النطاقات التالية:
      - التكوين فقط
      - التكوين + بيانات الاعتماد + الجلسات
      - إعادة تعيين كاملة (تزيل مساحة العمل أيضًا)
  </Step>
  <Step title="النموذج والمصادقة">
    - توجد مصفوفة الخيارات الكاملة في [خيارات المصادقة والنموذج](#خيارات-المصادقة-والنموذج).
  </Step>
  <Step title="مساحة العمل">
    - الافتراضي `~/.openclaw/workspace` ‏(قابل للتكوين).
    - يزرع ملفات مساحة العمل اللازمة لطقس bootstrap في التشغيل الأول.
    - تخطيط مساحة العمل: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - يطلب المنفذ، والربط، ووضع المصادقة، وتعريض tailscale.
    - الموصى به: أبقِ مصادقة الرمز المميز مفعلة حتى على loopback بحيث يجب أن تصادق عملاء WS المحليون.
    - في وضع token، يعرض الإعداد التفاعلي:
      - **Generate/store plaintext token** ‏(الافتراضي)
      - **Use SecretRef** ‏(اختياري)
    - في وضع password، يدعم الإعداد التفاعلي أيضًا التخزين كنص صريح أو SecretRef.
    - المسار غير التفاعلي لـ token SecretRef: ‏`--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير env غير فارغ في بيئة عملية onboarding.
      - لا يمكن دمجه مع `--gateway-token`.
    - لا تعطّل المصادقة إلا إذا كنت تثق بالكامل في كل عملية محلية.
    - لا تزال عمليات الربط غير loopback تتطلب مصادقة.
  </Step>
  <Step title="القنوات">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول QR اختياري
    - [Telegram](/ar/channels/telegram): رمز البوت المميز
    - [Discord](/ar/channels/discord): رمز البوت المميز
    - [Google Chat](/ar/channels/googlechat): JSON لحساب خدمة + جمهور Webhook
    - [Mattermost](/ar/channels/mattermost): رمز البوت المميز + base URL
    - [Signal](/ar/channels/signal): تثبيت اختياري لـ `signal-cli` + تكوين الحساب
    - [BlueBubbles](/ar/channels/bluebubbles): موصى به لـ iMessage؛ عنوان URL للخادم + كلمة المرور + Webhook
    - [iMessage](/ar/channels/imessage): المسار القديم لـ CLI ‏`imsg` + الوصول إلى قاعدة البيانات
    - أمان الرسائل الخاصة: الافتراضي هو الاقتران. ترسل أول رسالة خاصة رمزًا؛ وافق عليه عبر
      `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.
  </Step>
  <Step title="تثبيت daemon">
    - macOS: ‏LaunchAgent
      - يتطلب جلسة مستخدم مسجّل الدخول؛ وبالنسبة إلى الوضع من دون رأس، استخدم LaunchDaemon مخصصًا (غير مشحون).
    - Linux وWindows عبر WSL2: ‏systemd user unit
      - يحاول المعالج تنفيذ `loginctl enable-linger <user>` حتى يستمر gateway بعد تسجيل الخروج.
      - قد يطلب sudo ‏(يكتب إلى `/var/lib/systemd/linger`)؛ ويحاول أولًا من دون sudo.
    - Windows الأصلي: ‏Scheduled Task أولًا
      - إذا تم رفض إنشاء المهمة، يعود OpenClaw إلى عنصر تسجيل دخول لكل مستخدم في مجلد Startup ويبدأ gateway فورًا.
      - تبقى Scheduled Tasks مفضلة لأنها توفر حالة إشراف أفضل.
    - اختيار Runtime: ‏Node ‏(موصى به؛ ومطلوب لـ WhatsApp وTelegram). ولا يوصى باستخدام Bun.
  </Step>
  <Step title="الفحص الصحي">
    - يبدأ gateway ‏(إذا لزم الأمر) ويشغّل `openclaw health`.
    - يضيف `openclaw status --deep` فحص السلامة الحي لـ gateway إلى خرج الحالة، بما في ذلك فحوصات القنوات عندما تكون مدعومة.
  </Step>
  <Step title="Skills">
    - يقرأ Skills المتاحة ويفحص المتطلبات.
    - يتيح لك اختيار مدير Node: ‏npm، أو pnpm، أو bun.
    - يثبّت التبعيات الاختيارية (بعضها يستخدم Homebrew على macOS).
  </Step>
  <Step title="الإنهاء">
    - ملخص وخطوات تالية، بما في ذلك خيارات iOS وAndroid وتطبيق macOS.
  </Step>
</Steps>

<Note>
إذا لم يتم اكتشاف أي واجهة رسومية، يطبع المعالج تعليمات إعادة توجيه منفذ SSH الخاصة بـ Control UI بدلًا من فتح متصفح.
وإذا كانت أصول Control UI مفقودة، يحاول المعالج بناءها؛ والاحتياط هو `pnpm ui:build` ‏(مع التثبيت التلقائي لتبعيات UI).
</Note>

## تفاصيل الوضع البعيد

يُكوِّن الوضع البعيد هذا الجهاز للاتصال بـ gateway موجود في مكان آخر.

<Info>
لا يقوم الوضع البعيد بتثبيت أو تعديل أي شيء على المضيف البعيد.
</Info>

ما الذي تضبطه:

- عنوان URL الخاص بـ Remote gateway ‏(`ws://...`)
- الرمز المميز إذا كانت مصادقة Remote gateway مطلوبة (موصى به)

<Note>
- إذا كان gateway على loopback فقط، فاستخدم نفق SSH أو tailnet.
- تلميحات الاكتشاف:
  - macOS: ‏Bonjour ‏(`dns-sd`)
  - Linux: ‏Avahi ‏(`avahi-browse`)
</Note>

## خيارات المصادقة والنموذج

<AccordionGroup>
  <Accordion title="مفتاح Anthropic API">
    يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يحفظه لاستخدام daemon.
  </Accordion>
  <Accordion title="اشتراك OpenAI Code ‏(OAuth)">
    تدفق متصفح؛ الصق `code#state`.

    يضبط `agents.defaults.model` على `openai-codex/gpt-5.5` عندما يكون النموذج غير مضبوط أو من عائلة OpenAI بالفعل.

  </Accordion>
  <Accordion title="اشتراك OpenAI Code ‏(اقتران الجهاز)">
    تدفق اقتران عبر المتصفح باستخدام رمز جهاز قصير العمر.

    يضبط `agents.defaults.model` على `openai-codex/gpt-5.5` عندما يكون النموذج غير مضبوط أو من عائلة OpenAI بالفعل.

  </Accordion>
  <Accordion title="مفتاح OpenAI API">
    يستخدم `OPENAI_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يخزن بيانات الاعتماد في ملفات تعريف المصادقة.

    يضبط `agents.defaults.model` على `openai/gpt-5.4` عندما يكون النموذج غير مضبوط، أو من نوع `openai/*`، أو `openai-codex/*`.

  </Accordion>
  <Accordion title="مفتاح xAI ‏(Grok) API">
    يطلب `XAI_API_KEY` ويكوّن xAI كمزوّد نماذج.
  </Accordion>
  <Accordion title="OpenCode">
    يطلب `OPENCODE_API_KEY` ‏(أو `OPENCODE_ZEN_API_KEY`) ويتيح لك اختيار فهرس Zen أو Go.
    عنوان URL للإعداد: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="مفتاح API ‏(عام)">
    يخزن المفتاح من أجلك.
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
    يُكتب التكوين تلقائيًا. الافتراضي المستضاف هو `MiniMax-M2.7`؛ يستخدم إعداد API-key
    `minimax/...`، بينما يستخدم إعداد OAuth الصيغة `minimax-portal/...`.
    مزيد من التفاصيل: [MiniMax](/ar/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    يُكتب التكوين تلقائيًا لـ StepFun القياسي أو Step Plan على نقاط النهاية الصينية أو العالمية.
    يتضمن القياسي حاليًا `step-3.5-flash`، كما يتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    مزيد من التفاصيل: [StepFun](/ar/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic ‏(متوافق مع Anthropic)">
    يطلب `SYNTHETIC_API_KEY`.
    مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama ‏(نماذج سحابية ومحلية مفتوحة)">
    يطلب أولًا `Cloud + Local`، أو `Cloud only`، أو `Local only`.
    تستخدم `Cloud only` المفتاح `OLLAMA_API_KEY` مع `https://ollama.com`.
    وتطلب الأوضاع المدعومة بالمضيف base URL ‏(الافتراضي `http://127.0.0.1:11434`)، وتكتشف النماذج المتاحة، وتقترح قيمًا افتراضية.
    كما يفحص `Cloud + Local` ما إذا كان مضيف Ollama مسجّل الدخول للوصول السحابي.
    مزيد من التفاصيل: [Ollama](/ar/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot وKimi Coding">
    تُكتب تكوينات Moonshot ‏(Kimi K2) وKimi Coding تلقائيًا.
    مزيد من التفاصيل: [Moonshot AI ‏(Kimi + Kimi Coding)](/ar/providers/moonshot).
  </Accordion>
  <Accordion title="مزوّد مخصص">
    يعمل مع نقاط نهاية متوافقة مع OpenAI ومتوافقة مع Anthropic.

    يدعم onboarding التفاعلي خيارات تخزين مفتاح API نفسها كما في تدفقات مفاتيح API الخاصة بالمزوّدات الأخرى:
    - **Paste API key now** ‏(نص صريح)
    - **Use secret reference** ‏(مرجع env أو مرجع مزوّد مكوّن، مع تحقق preflight)

    الأعلام غير التفاعلية:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` ‏(اختياري؛ ويعود إلى `CUSTOM_API_KEY`)
    - `--custom-provider-id` ‏(اختياري)
    - `--custom-compatibility <openai|anthropic>` ‏(اختياري؛ والافتراضي `openai`)

  </Accordion>
  <Accordion title="تخطي">
    يترك المصادقة غير مكوّنة.
  </Accordion>
</AccordionGroup>

سلوك النموذج:

- اختر النموذج الافتراضي من الخيارات المكتشفة، أو أدخل المزوّد والنموذج يدويًا.
- عندما يبدأ onboarding من اختيار مصادقة مزوّد، فإن محدد النموذج يفضّل
  ذلك المزوّد تلقائيًا. وبالنسبة إلى Volcengine وBytePlus، يطابق التفضيل نفسه
  أيضًا متغيرات coding-plan الخاصة بهما (`volcengine-plan/*`,
  `byteplus-plan/*`).
- إذا كانت تصفية المزوّد المفضّل ستؤدي إلى قائمة فارغة، يعود المحدد إلى
  الفهرس الكامل بدلًا من إظهار عدم وجود نماذج.
- يُجري المعالج فحصًا للنموذج ويحذر إذا كان النموذج المكوّن غير معروف أو يفتقر إلى المصادقة.

مسارات بيانات الاعتماد وملفات التعريف:

- ملفات تعريف المصادقة (مفاتيح API + OAuth): ‏`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- استيراد OAuth القديم: ‏`~/.openclaw/credentials/oauth.json`

وضع تخزين بيانات الاعتماد:

- السلوك الافتراضي في onboarding هو حفظ مفاتيح API كقيم نصية صريحة في ملفات تعريف المصادقة.
- يؤدي `--secret-input-mode ref` إلى تفعيل وضع المراجع بدلًا من تخزين المفاتيح كنص صريح.
  في الإعداد التفاعلي، يمكنك اختيار أحد الخيارين:
  - مرجع متغير بيئة (مثل `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - مرجع مزوّد مكوّن (`file` أو `exec`) مع الاسم المستعار للمزوّد + المعرّف
- يشغّل وضع المرجع التفاعلي تحقق preflight سريعًا قبل الحفظ.
  - مراجع Env: يتحقق من اسم المتغير + وجود قيمة غير فارغة في بيئة onboarding الحالية.
  - مراجع المزوّد: يتحقق من تكوين المزوّد ويحل المعرّف المطلوب.
  - إذا فشل preflight، يعرض onboarding الخطأ ويتيح لك إعادة المحاولة.
- في الوضع غير التفاعلي، يكون `--secret-input-mode ref` مدعومًا عبر env فقط.
  - اضبط متغير env الخاص بالمزوّد في بيئة عملية onboarding.
  - تتطلب أعلام المفاتيح المضمّنة (مثل `--openai-api-key`) أن يكون متغير env هذا مضبوطًا؛ وإلا يفشل onboarding سريعًا.
  - بالنسبة إلى المزوّدات المخصصة، يخزن وضع `ref` غير التفاعلي `models.providers.<id>.apiKey` على هيئة `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - في حالة المزوّد المخصص هذه، يتطلب `--custom-api-key` أن يكون `CUSTOM_API_KEY` مضبوطًا؛ وإلا يفشل onboarding سريعًا.
- تدعم بيانات اعتماد مصادقة Gateway خيارات النص الصريح وSecretRef في الإعداد التفاعلي:
  - وضع token: ‏**Generate/store plaintext token** ‏(الافتراضي) أو **Use SecretRef**.
  - وضع password: نص صريح أو SecretRef.
- المسار غير التفاعلي لـ token SecretRef: ‏`--gateway-token-ref-env <ENV_VAR>`.
- تستمر الإعدادات النصية الصريحة الموجودة في العمل من دون تغيير.

<Note>
نصيحة خاصة بالوضع من دون رأس والخوادم: أكمل OAuth على جهاز يملك متصفحًا، ثم انسخ
`auth-profiles.json` الخاص بذلك الوكيل (مثل
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو المسار المطابق
`$OPENCLAW_STATE_DIR/...`) إلى مضيف gateway. أما `credentials/oauth.json`
فهو مجرد مصدر استيراد قديم.
</Note>

## المخرجات والداخليات

الحقول المعتادة في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` ‏(إذا تم اختيار MiniMax)
- `tools.profile` ‏(يضبط onboarding المحلي هذا افتراضيًا على `"coding"` عند عدم ضبطه؛ وتُحفظ القيم الصريحة الموجودة)
- `gateway.*` ‏(الوضع، والربط، والمصادقة، وtailscale)
- `session.dmScope` ‏(يضبط onboarding المحلي هذا افتراضيًا على `per-channel-peer` عند عدم ضبطه؛ وتُحفظ القيم الصريحة الموجودة)
- `channels.telegram.botToken` و`channels.discord.token` و`channels.matrix.*` و`channels.signal.*` و`channels.imessage.*`
- قوائم سماح القنوات (Slack، وDiscord، وMatrix، وMicrosoft Teams) عندما تشترك فيها أثناء المطالبات (وتُحل الأسماء إلى معرّفات عندما يكون ذلك ممكنًا)
- `skills.install.nodeManager`
  - يقبل العلم `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - لا يزال بالإمكان ضبط `skills.install.nodeManager: "yarn"` يدويًا لاحقًا في التكوين.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

يكتب `openclaw agents add` القيم `agents.list[]` و`bindings` الاختيارية.

تُحفظ بيانات اعتماد WhatsApp تحت `~/.openclaw/credentials/whatsapp/<accountId>/`.
وتُخزَّن الجلسات تحت `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
يتم تسليم بعض القنوات على شكل Plugins. وعند اختيارها أثناء الإعداد، يطلب المعالج
تثبيت Plugin ‏(من npm أو من مسار محلي) قبل تكوين القناة.
</Note>

Gateway wizard RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

يمكن للعملاء (تطبيق macOS وControl UI) عرض الخطوات من دون إعادة تنفيذ منطق onboarding.

سلوك إعداد Signal:

- ينزّل أصل الإصدار المناسب
- يخزّنه تحت `~/.openclaw/tools/signal-cli/<version>/`
- يكتب `channels.signal.cliPath` في التكوين
- تتطلب بنيات JVM وجود Java 21
- تُستخدم البنيات الأصلية عندما تكون متاحة
- يستخدم Windows ‏WSL2 ويتبع تدفق Linux ‏signal-cli داخل WSL

## وثائق ذات صلة

- مركز onboarding: [الإعداد الأولي (CLI)](/ar/start/wizard)
- الأتمتة والسكربتات: [أتمتة CLI](/ar/start/wizard-cli-automation)
- مرجع الأوامر: [`openclaw onboard`](/ar/cli/onboard)
