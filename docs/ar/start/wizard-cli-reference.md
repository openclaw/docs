---
read_when:
    - أنت بحاجة إلى سلوك مفصل لأمر `openclaw onboard`
    - أنت تقوم بتصحيح نتائج الإعداد الأولي أو دمج عملاء الإعداد الأولي
sidebarTitle: CLI reference
summary: مرجع كامل لتدفق إعداد CLI، وإعداد المصادقة/النموذج، والمخرجات، والبنية الداخلية
title: مرجع إعداد CLI
x-i18n:
    generated_at: "2026-04-15T14:41:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61ca679caca3b43fa02388294007f89db22d343e49e10b61d8d118cd8fbb7369
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# مرجع إعداد CLI

هذه الصفحة هي المرجع الكامل لأمر `openclaw onboard`.
للحصول على الدليل المختصر، راجع [الإعداد الأولي (CLI)](/ar/start/wizard).

## ما الذي تفعله المعالج

يقوم الوضع المحلي (الافتراضي) بإرشادك خلال:

- إعداد النموذج والمصادقة (OAuth لاشتراك OpenAI Code، أو Anthropic Claude CLI أو مفتاح API، بالإضافة إلى خيارات MiniMax وGLM وOllama وMoonshot وStepFun وAI Gateway)
- موقع مساحة العمل وملفات التمهيد
- إعدادات Gateway (المنفذ، والربط، والمصادقة، وTailscale)
- القنوات والموفرون (Telegram وWhatsApp وDiscord وGoogle Chat وMattermost وSignal وBlueBubbles، وغيرها من Plugins القنوات المضمنة)
- تثبيت الخدمة الخلفية (LaunchAgent، أو وحدة systemd للمستخدم، أو Scheduled Task أصلية في Windows مع بديل مجلد Startup)
- الفحص الصحي
- إعداد Skills

يقوم الوضع البعيد بتهيئة هذا الجهاز للاتصال بـ Gateway موجود في مكان آخر.
ولا يقوم بتثبيت أو تعديل أي شيء على المضيف البعيد.

## تفاصيل التدفق المحلي

<Steps>
  <Step title="اكتشاف الإعدادات الحالية">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر الاحتفاظ أو التعديل أو إعادة التعيين.
    - لا تؤدي إعادة تشغيل المعالج إلى مسح أي شيء ما لم تختر صراحةً إعادة التعيين (أو تمرر `--reset`).
    - يضبط خيار CLI `--reset` النطاق افتراضيًا إلى `config+creds+sessions`؛ استخدم `--reset-scope full` لإزالة مساحة العمل أيضًا.
    - إذا كانت الإعدادات غير صالحة أو تحتوي على مفاتيح قديمة، فسيتوقف المعالج ويطلب منك تشغيل `openclaw doctor` قبل المتابعة.
    - تستخدم إعادة التعيين `trash` وتوفر النطاقات التالية:
      - الإعدادات فقط
      - الإعدادات + بيانات الاعتماد + الجلسات
      - إعادة تعيين كاملة (تزيل مساحة العمل أيضًا)
  </Step>
  <Step title="النموذج والمصادقة">
    - توجد مصفوفة الخيارات الكاملة في [خيارات المصادقة والنموذج](#auth-and-model-options).
  </Step>
  <Step title="مساحة العمل">
    - الافتراضي `~/.openclaw/workspace` (قابل للتهيئة).
    - يزرع ملفات مساحة العمل اللازمة لطقس التمهيد الأول.
    - تخطيط مساحة العمل: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - يطلب المنفذ، والربط، ووضع المصادقة، وتعريض Tailscale.
    - الموصى به: إبقاء مصادقة الرمز المميز مفعّلة حتى مع loopback لكي تضطر عملاء WS المحليون إلى المصادقة.
    - في وضع الرمز المميز، يوفر الإعداد التفاعلي:
      - **إنشاء/تخزين رمز مميز بنص عادي** (الافتراضي)
      - **استخدام SecretRef** (اختياري)
    - في وضع كلمة المرور، يدعم الإعداد التفاعلي أيضًا التخزين كنص عادي أو SecretRef.
    - مسار SecretRef للرمز المميز في الوضع غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير بيئة غير فارغ في بيئة عملية الإعداد الأولي.
      - لا يمكن دمجه مع `--gateway-token`.
    - عطّل المصادقة فقط إذا كنت تثق بالكامل في كل عملية محلية.
    - لا تزال عمليات الربط غير loopback تتطلب المصادقة.
  </Step>
  <Step title="القنوات">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول QR اختياري
    - [Telegram](/ar/channels/telegram): رمز bot مميز
    - [Discord](/ar/channels/discord): رمز bot مميز
    - [Google Chat](/ar/channels/googlechat): JSON لحساب خدمة + جمهور Webhook
    - [Mattermost](/ar/channels/mattermost): رمز bot مميز + URL أساسي
    - [Signal](/ar/channels/signal): تثبيت `signal-cli` اختياري + إعداد الحساب
    - [BlueBubbles](/ar/channels/bluebubbles): موصى به لـ iMessage؛ URL الخادم + كلمة المرور + Webhook
    - [iMessage](/ar/channels/imessage): مسار `imsg` CLI القديم + الوصول إلى قاعدة البيانات
    - أمان الرسائل المباشرة: الافتراضي هو الاقتران. ترسل أول رسالة مباشرة رمزًا؛ وافق عليه عبر
      `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.
  </Step>
  <Step title="تثبيت الخدمة الخلفية">
    - macOS: LaunchAgent
      - يتطلب جلسة مستخدم مسجّل دخوله؛ وللتشغيل دون واجهة، استخدم LaunchDaemon مخصصًا (غير مشحون).
    - Linux وWindows عبر WSL2: وحدة systemd للمستخدم
      - يحاول المعالج تنفيذ `loginctl enable-linger <user>` حتى يبقى Gateway يعمل بعد تسجيل الخروج.
      - قد يطلب sudo (يكتب إلى `/var/lib/systemd/linger`)؛ ويحاول أولًا بدون sudo.
    - Windows الأصلي: Scheduled Task أولًا
      - إذا تم رفض إنشاء المهمة، يعود OpenClaw إلى عنصر تسجيل دخول خاص بالمستخدم في مجلد Startup ويبدأ Gateway فورًا.
      - تظل Scheduled Tasks مفضلة لأنها توفر حالة مشرف أفضل.
    - اختيار وقت التشغيل: Node (موصى به؛ ومطلوب لـ WhatsApp وTelegram). لا يُنصح بـ Bun.
  </Step>
  <Step title="الفحص الصحي">
    - يبدأ Gateway (عند الحاجة) ويشغّل `openclaw health`.
    - يضيف `openclaw status --deep` فحص الصحة الحي لـ Gateway إلى مخرجات الحالة، بما في ذلك فحوصات القنوات عند دعمها.
  </Step>
  <Step title="Skills">
    - يقرأ Skills المتاحة ويفحص المتطلبات.
    - يتيح لك اختيار مدير Node: npm أو pnpm أو bun.
    - يثبت التبعيات الاختيارية (يستخدم بعضها Homebrew على macOS).
  </Step>
  <Step title="الإنهاء">
    - ملخص وخطوات تالية، بما في ذلك خيارات تطبيقات iOS وAndroid وmacOS.
  </Step>
</Steps>

<Note>
إذا لم يتم اكتشاف واجهة رسومية، فسيطبع المعالج تعليمات إعادة توجيه منفذ SSH لواجهة Control UI بدلًا من فتح متصفح.
إذا كانت أصول Control UI مفقودة، فسيحاول المعالج بناءها؛ والمسار الاحتياطي هو `pnpm ui:build` (مع تثبيت تبعيات الواجهة تلقائيًا).
</Note>

## تفاصيل الوضع البعيد

يقوم الوضع البعيد بتهيئة هذا الجهاز للاتصال بـ Gateway موجود في مكان آخر.

<Info>
لا يقوم الوضع البعيد بتثبيت أو تعديل أي شيء على المضيف البعيد.
</Info>

ما الذي تقوم بإعداده:

- URL لـ Gateway البعيد (`ws://...`)
- الرمز المميز إذا كانت مصادقة Gateway البعيد مطلوبة (موصى به)

<Note>
- إذا كان Gateway مقصورًا على loopback فقط، فاستخدم نفق SSH أو tailnet.
- تلميحات الاكتشاف:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## خيارات المصادقة والنموذج

<AccordionGroup>
  <Accordion title="مفتاح Anthropic API">
    يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا أو يطلب منك إدخال مفتاح، ثم يحفظه لاستخدام الخدمة الخلفية.
  </Accordion>
  <Accordion title="اشتراك OpenAI Code (إعادة استخدام Codex CLI)">
    إذا كان `~/.codex/auth.json` موجودًا، يمكن للمعالج إعادة استخدامه.
    تظل بيانات اعتماد Codex CLI المعاد استخدامها مُدارة بواسطة Codex CLI؛ وعند انتهاء صلاحيتها يعيد OpenClaw
    قراءة هذا المصدر أولًا، وعندما يتمكن الموفر من تحديثها، يكتب
    بيانات الاعتماد المحدَّثة مجددًا إلى تخزين Codex بدلًا من تولي إدارتها
    بنفسه.
  </Accordion>
  <Accordion title="اشتراك OpenAI Code (OAuth)">
    تدفق المتصفح؛ الصق `code#state`.

    يضبط `agents.defaults.model` على `openai-codex/gpt-5.4` عندما يكون النموذج غير مضبوط أو يساوي `openai/*`.

  </Accordion>
  <Accordion title="مفتاح OpenAI API">
    يستخدم `OPENAI_API_KEY` إذا كان موجودًا أو يطلب منك إدخال مفتاح، ثم يخزن بيانات الاعتماد في ملفات تعريف المصادقة.

    يضبط `agents.defaults.model` على `openai/gpt-5.4` عندما يكون النموذج غير مضبوط، أو يساوي `openai/*`، أو `openai-codex/*`.

  </Accordion>
  <Accordion title="مفتاح xAI (Grok) API">
    يطلب `XAI_API_KEY` ويهيئ xAI كموفر نموذج.
  </Accordion>
  <Accordion title="OpenCode">
    يطلب `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`) ويتيح لك اختيار فهرس Zen أو Go.
    URL الإعداد: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="مفتاح API (عام)">
    يخزن المفتاح نيابةً عنك.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    يطلب `AI_GATEWAY_API_KEY`.
    مزيد من التفاصيل: [Vercel AI Gateway](/ar/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    يطلب معرّف الحساب، ومعرّف Gateway، و`CLOUDFLARE_AI_GATEWAY_API_KEY`.
    مزيد من التفاصيل: [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    تُكتب الإعدادات تلقائيًا. الافتراضي المستضاف هو `MiniMax-M2.7`؛ ويستخدم إعداد مفتاح API
    `minimax/...`، ويستخدم إعداد OAuth الصيغة `minimax-portal/...`.
    مزيد من التفاصيل: [MiniMax](/ar/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    تُكتب الإعدادات تلقائيًا لـ StepFun القياسي أو Step Plan على نقاط نهاية الصين أو النقاط العالمية.
    يتضمن الوضع القياسي حاليًا `step-3.5-flash`، ويتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    مزيد من التفاصيل: [StepFun](/ar/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (متوافق مع Anthropic)">
    يطلب `SYNTHETIC_API_KEY`.
    مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (السحابة والنماذج المفتوحة المحلية)">
    يطلب أولًا `Cloud + Local` أو `Cloud only` أو `Local only`.
    يستخدم `Cloud only` المتغير `OLLAMA_API_KEY` مع `https://ollama.com`.
    تطلب الأوضاع المعتمدة على المضيف URL الأساسي (الافتراضي `http://127.0.0.1:11434`) وتكتشف النماذج المتاحة وتقترح الإعدادات الافتراضية.
    ويتحقق وضع `Cloud + Local` أيضًا مما إذا كان مضيف Ollama هذا مسجّل الدخول للوصول السحابي.
    مزيد من التفاصيل: [Ollama](/ar/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot وKimi Coding">
    تُكتب إعدادات Moonshot (Kimi K2) وKimi Coding تلقائيًا.
    مزيد من التفاصيل: [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot).
  </Accordion>
  <Accordion title="موفر مخصص">
    يعمل مع نقاط نهاية متوافقة مع OpenAI ومتوافقة مع Anthropic.

    يدعم الإعداد الأولي التفاعلي خيارات تخزين مفاتيح API نفسها كما في تدفقات مفاتيح API للموفرين الآخرين:
    - **ألصق مفتاح API الآن** (نص عادي)
    - **استخدم مرجعًا سريًا** (مرجع env أو مرجع موفر مهيأ، مع تحقق تمهيدي)

    العلامات في الوضع غير التفاعلي:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (اختياري؛ يعود إلى `CUSTOM_API_KEY`)
    - `--custom-provider-id` (اختياري)
    - `--custom-compatibility <openai|anthropic>` (اختياري؛ الافتراضي `openai`)

  </Accordion>
  <Accordion title="تخطي">
    يترك المصادقة غير مهيأة.
  </Accordion>
</AccordionGroup>

سلوك النموذج:

- اختر النموذج الافتراضي من الخيارات المكتشفة، أو أدخل الموفر والنموذج يدويًا.
- عندما يبدأ الإعداد الأولي من اختيار مصادقة لموفر ما، فإن منتقي النموذج يفضل
  ذلك الموفر تلقائيًا. وبالنسبة إلى Volcengine وBytePlus، فإن هذا التفضيل نفسه
  يطابق أيضًا متغيرات خطة البرمجة الخاصة بهما (`volcengine-plan/*`،
  `byteplus-plan/*`).
- إذا كان مرشح الموفر المفضّل هذا سيؤدي إلى قائمة فارغة، فإن المنتقي يعود إلى
  الفهرس الكامل بدلًا من عدم إظهار أي نماذج.
- يشغّل المعالج فحصًا للنموذج ويعرض تحذيرًا إذا كان النموذج المهيأ غير معروف أو يفتقد إلى المصادقة.

مسارات بيانات الاعتماد والملفات الشخصية:

- ملفات تعريف المصادقة (مفاتيح API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- استيراد OAuth القديم: `~/.openclaw/credentials/oauth.json`

وضع تخزين بيانات الاعتماد:

- السلوك الافتراضي للإعداد الأولي هو حفظ مفاتيح API كقيم نصية عادية في ملفات تعريف المصادقة.
- يفعّل `--secret-input-mode ref` وضع المراجع بدلًا من تخزين المفاتيح كنص عادي.
  في الإعداد التفاعلي، يمكنك اختيار أحد الخيارين:
  - مرجع متغير بيئة (على سبيل المثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - مرجع موفر مهيأ (`file` أو `exec`) مع الاسم المستعار للموفر + المعرّف
- يشغّل وضع المراجع التفاعلي تحققًا تمهيديًا سريعًا قبل الحفظ.
  - مراجع env: يتحقق من اسم المتغير ومن وجود قيمة غير فارغة في بيئة الإعداد الأولي الحالية.
  - مراجع الموفر: يتحقق من إعدادات الموفر ويحلّ المعرّف المطلوب.
  - إذا فشل التحقق التمهيدي، يعرض الإعداد الأولي الخطأ ويتيح لك إعادة المحاولة.
- في الوضع غير التفاعلي، يكون `--secret-input-mode ref` معتمدًا على env فقط.
  - عيّن متغير بيئة الموفر في بيئة عملية الإعداد الأولي.
  - تتطلب علامات المفاتيح المضمنة (مثل `--openai-api-key`) أن يكون متغير البيئة هذا مضبوطًا؛ وإلا فسيفشل الإعداد الأولي سريعًا.
  - بالنسبة إلى الموفرين المخصصين، يخزن وضع `ref` غير التفاعلي `models.providers.<id>.apiKey` بالشكل `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - في حالة الموفر المخصص هذه، يتطلب `--custom-api-key` أن يكون `CUSTOM_API_KEY` مضبوطًا؛ وإلا فسيفشل الإعداد الأولي سريعًا.
- تدعم بيانات اعتماد مصادقة Gateway خياري النص العادي وSecretRef في الإعداد التفاعلي:
  - وضع الرمز المميز: **إنشاء/تخزين رمز مميز بنص عادي** (الافتراضي) أو **استخدام SecretRef**.
  - وضع كلمة المرور: نص عادي أو SecretRef.
- مسار SecretRef للرمز المميز في الوضع غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
- تستمر الإعدادات الحالية التي تستخدم النص العادي في العمل دون تغيير.

<Note>
نصيحة للخوادم والبيئات دون واجهة: أكمل OAuth على جهاز يحتوي على متصفح، ثم انسخ
ملف `auth-profiles.json` الخاص بذلك الوكيل (على سبيل المثال
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو المسار المطابق
`$OPENCLAW_STATE_DIR/...`) إلى مضيف Gateway. يُعد `credentials/oauth.json`
مجرد مصدر استيراد قديم.
</Note>

## المخرجات والبنية الداخلية

الحقول المعتادة في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (إذا تم اختيار Minimax)
- `tools.profile` (يضبط الإعداد الأولي المحلي هذا الحقل افتراضيًا إلى `"coding"` عند عدم تعيينه؛ ويتم الحفاظ على القيم الصريحة الحالية)
- `gateway.*` (الوضع، والربط، والمصادقة، وTailscale)
- `session.dmScope` (يضبط الإعداد الأولي المحلي هذا الحقل افتراضيًا إلى `per-channel-peer` عند عدم تعيينه؛ ويتم الحفاظ على القيم الصريحة الحالية)
- `channels.telegram.botToken`، و`channels.discord.token`، و`channels.matrix.*`، و`channels.signal.*`، و`channels.imessage.*`
- قوائم السماح الخاصة بالقنوات (Slack وDiscord وMatrix وMicrosoft Teams) عندما تختار ذلك أثناء المطالبات (تُحل الأسماء إلى معرّفات عندما يكون ذلك ممكنًا)
- `skills.install.nodeManager`
  - تقبل العلامة `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - لا يزال من الممكن أن يضبط الإعداد اليدوي لاحقًا `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

يقوم `openclaw agents add` بكتابة `agents.list[]` و`bindings` الاختيارية.

تُحفظ بيانات اعتماد WhatsApp تحت `~/.openclaw/credentials/whatsapp/<accountId>/`.
وتُخزن الجلسات تحت `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
يتم تسليم بعض القنوات على شكل Plugins. وعند اختيارها أثناء الإعداد، يطلب المعالج
تثبيت Plugin (عبر npm أو مسار محلي) قبل تهيئة القناة.
</Note>

استدعاءات RPC لمعالج Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

يمكن للعملاء (تطبيق macOS وControl UI) عرض الخطوات دون إعادة تنفيذ منطق الإعداد الأولي.

سلوك إعداد Signal:

- ينزل أصل الإصدار المناسب
- يخزنه تحت `~/.openclaw/tools/signal-cli/<version>/`
- يكتب `channels.signal.cliPath` في الإعدادات
- تتطلب إصدارات JVM Java 21
- تُستخدم الإصدارات الأصلية عند توفرها
- يستخدم Windows بيئة WSL2 ويتبع تدفق `signal-cli` الخاص بـ Linux داخل WSL

## المستندات ذات الصلة

- مركز الإعداد الأولي: [الإعداد الأولي (CLI)](/ar/start/wizard)
- الأتمتة والبرامج النصية: [أتمتة CLI](/ar/start/wizard-cli-automation)
- مرجع الأوامر: [`openclaw onboard`](/cli/onboard)
