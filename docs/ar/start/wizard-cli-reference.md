---
read_when:
    - تحتاج إلى السلوك التفصيلي لـ openclaw onboard
    - تستكشف أخطاء نتائج التهيئة الأولية أو تدمج عملاء التهيئة الأولية
sidebarTitle: CLI reference
summary: مرجع كامل لتدفق إعداد CLI، وإعداد المصادقة/النموذج، والمخرجات، والآليات الداخلية
title: مرجع إعداد CLI
x-i18n:
    generated_at: "2026-06-27T18:37:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6e46c81dd51ee9f1ce492dedc2911d449f507a136bd8805bc157915684a1941
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

هذه الصفحة هي المرجع الكامل لـ `openclaw onboard`.
للدليل المختصر، راجع [الإعداد الأولي (CLI)](/ar/start/wizard).

## ما الذي يفعله المعالج

يرشدك الوضع المحلي (الافتراضي) خلال:

- إعداد النموذج والمصادقة (OAuth لاشتراك OpenAI Code، أو Anthropic Claude CLI أو مفتاح API، إضافة إلى خيارات MiniMax وGLM وOllama وMoonshot وStepFun وAI Gateway)
- موقع مساحة العمل وملفات التمهيد
- إعدادات Gateway (المنفذ، الربط، المصادقة، Tailscale)
- القنوات والموفّرون (Telegram وWhatsApp وDiscord وGoogle Chat وMattermost وSignal وiMessage وغيرها من Plugins القنوات المضمّنة)
- تثبيت البرنامج الخفي (LaunchAgent، أو وحدة مستخدم systemd، أو Windows Scheduled Task الأصلية مع الرجوع إلى مجلد Startup)
- فحص الصحة
- إعداد Skills

يضبط الوضع البعيد هذا الجهاز للاتصال بـ Gateway في مكان آخر.
لا يثبّت أو يعدّل أي شيء على المضيف البعيد.

## تفاصيل التدفق المحلي

<Steps>
  <Step title="اكتشاف الإعدادات الحالية">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر الاحتفاظ أو التعديل أو إعادة الضبط.
    - لا تؤدي إعادة تشغيل المعالج إلى مسح أي شيء ما لم تختر إعادة الضبط صراحةً (أو تمرّر `--reset`).
    - القيمة الافتراضية لـ CLI `--reset` هي `config+creds+sessions`؛ استخدم `--reset-scope full` لإزالة مساحة العمل أيضًا.
    - إذا كانت الإعدادات غير صالحة أو تحتوي على مفاتيح قديمة، يتوقف المعالج ويطلب منك تشغيل `openclaw doctor` قبل المتابعة.
    - تستخدم إعادة الضبط `trash` وتعرض نطاقات:
      - الإعدادات فقط
      - الإعدادات + بيانات الاعتماد + الجلسات
      - إعادة ضبط كاملة (تزيل مساحة العمل أيضًا)

  </Step>
  <Step title="النموذج والمصادقة">
    - مصفوفة الخيارات الكاملة موجودة في [خيارات المصادقة والنماذج](#auth-and-model-options).

  </Step>
  <Step title="مساحة العمل">
    - الافتراضي `~/.openclaw/workspace` (قابل للتهيئة).
    - تزرع ملفات مساحة العمل المطلوبة لطقس التمهيد عند التشغيل الأول.
    - تخطيط مساحة العمل: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - يطلب المنفذ، والربط، ووضع المصادقة، وإتاحة Tailscale.
    - موصى به: أبقِ مصادقة الرمز مفعّلة حتى مع loopback لكي يكون على عملاء WS المحليين المصادقة.
    - في وضع الرمز، يقدّم الإعداد التفاعلي:
      - **توليد/تخزين رمز بنص صريح** (افتراضي)
      - **استخدام SecretRef** (اختياري)
    - في وضع كلمة المرور، يدعم الإعداد التفاعلي أيضًا التخزين بنص صريح أو عبر SecretRef.
    - مسار SecretRef غير التفاعلي للرمز: `--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير بيئة غير فارغ في بيئة عملية الإعداد الأولي.
      - لا يمكن دمجه مع `--gateway-token`.
    - عطّل المصادقة فقط إذا كنت تثق تمامًا بكل عملية محلية.
    - ما تزال روابط غير loopback تتطلب المصادقة.

  </Step>
  <Step title="القنوات">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول QR اختياري
    - [Telegram](/ar/channels/telegram): رمز bot
    - [Discord](/ar/channels/discord): رمز bot
    - [Google Chat](/ar/channels/googlechat): ملف JSON لحساب خدمة + جمهور Webhook
    - [Mattermost](/ar/channels/mattermost): رمز bot + عنوان URL أساسي
    - [Signal](/ar/channels/signal): تثبيت `signal-cli` اختياري + إعداد الحساب
    - [iMessage](/ar/channels/imessage): مسار CLI `imsg` + وصول إلى قاعدة بيانات Messages؛ استخدم مغلّف SSH عندما يعمل Gateway خارج Mac
    - أمان الرسائل الخاصة: الافتراضي هو الاقتران. ترسل أول رسالة خاصة رمزًا؛ وافق عبر
      `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.
  </Step>
  <Step title="تثبيت البرنامج الخفي">
    - macOS: LaunchAgent
      - يتطلب جلسة مستخدم مسجّل الدخول؛ للوضع بلا شاشة، استخدم LaunchDaemon مخصصًا (غير مشحون).
    - Linux وWindows عبر WSL2: وحدة مستخدم systemd
      - يحاول المعالج `loginctl enable-linger <user>` لكي يبقى Gateway قيد التشغيل بعد تسجيل الخروج.
      - قد يطلب sudo (يكتب في `/var/lib/systemd/linger`)؛ يحاول أولًا دون sudo.
    - Windows الأصلي: Scheduled Task أولًا
      - إذا رُفض إنشاء المهمة، يرجع OpenClaw إلى عنصر تسجيل دخول في مجلد Startup لكل مستخدم ويبدأ Gateway فورًا.
      - تبقى Scheduled Tasks مفضّلة لأنها توفر حالة إشراف أفضل.
    - اختيار وقت التشغيل: Node (موصى به؛ مطلوب لـ WhatsApp وTelegram). لا يُنصح بـ Bun.

  </Step>
  <Step title="فحص الصحة">
    - يبدأ Gateway (إذا لزم الأمر) ويشغّل `openclaw health`.
    - يضيف `openclaw status --deep` فحص صحة Gateway الحي إلى خرج الحالة، بما في ذلك فحوصات القنوات عند دعمها.

  </Step>
  <Step title="Skills">
    - يقرأ Skills المتاحة ويفحص المتطلبات.
    - يتيح لك اختيار مدير Node: npm أو pnpm أو bun.
    - يثبّت التبعيات الاختيارية (بعضها يستخدم Homebrew على macOS).

  </Step>
  <Step title="الإنهاء">
    - ملخص وخطوات تالية، بما في ذلك خيارات تطبيقات iOS وAndroid وmacOS.

  </Step>
</Steps>

<Note>
إذا لم تُكتشف واجهة رسومية، يطبع المعالج تعليمات تمرير منفذ SSH لواجهة Control UI بدلًا من فتح متصفح.
إذا كانت أصول Control UI مفقودة، يحاول المعالج بناءها؛ والبديل هو `pnpm ui:build` (يثبّت تبعيات UI تلقائيًا).
</Note>

## تفاصيل الوضع البعيد

يضبط الوضع البعيد هذا الجهاز للاتصال بـ Gateway في مكان آخر.

<Info>
لا يثبّت الوضع البعيد أو يعدّل أي شيء على المضيف البعيد.
</Info>

ما تضبطه:

- عنوان URL لـ Gateway البعيد (`ws://...`)
- الرمز إذا كانت مصادقة Gateway البعيد مطلوبة (موصى به)

<Note>
- إذا كان Gateway مقيّدًا بـ loopback فقط، فاستخدم نفق SSH أو tailnet.
- تلميحات الاكتشاف:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## خيارات المصادقة والنماذج

<AccordionGroup>
  <Accordion title="مفتاح API لـ Anthropic">
    يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يحفظه لاستخدام البرنامج الخفي.
  </Accordion>
  <Accordion title="اشتراك OpenAI Code (OAuth)">
    تدفق المتصفح؛ الصق `code#state`.

    يعيّن `agents.defaults.model` إلى `openai/gpt-5.5` عبر وقت تشغيل Codex عندما يكون النموذج غير معيّن أو من عائلة OpenAI بالفعل.

  </Accordion>
  <Accordion title="اشتراك OpenAI Code (اقتران الجهاز)">
    تدفق اقتران عبر المتصفح باستخدام رمز جهاز قصير العمر.

    يعيّن `agents.defaults.model` إلى `openai/gpt-5.5` عبر وقت تشغيل Codex عندما يكون النموذج غير معيّن أو من عائلة OpenAI بالفعل.

  </Accordion>
  <Accordion title="مفتاح API لـ OpenAI">
    يستخدم `OPENAI_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يخزّن بيانات الاعتماد في ملفات تعريف المصادقة.

    يعيّن `agents.defaults.model` إلى `openai/gpt-5.5` عندما يكون النموذج غير معيّن، أو `openai/*`، أو مراجع نماذج Codex القديمة.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    تسجيل دخول عبر المتصفح لحسابات SuperGrok أو X Premium المؤهلة. هذا هو
    مسار xAI الموصى به لمعظم المستخدمين. يخزّن OpenClaw ملف تعريف المصادقة الناتج
    لنماذج Grok وGrok `web_search` و`x_search` و`code_execution`.
  </Accordion>
  <Accordion title="رمز جهاز xAI (Grok)">
    تسجيل دخول عبر المتصفح مناسب للاستخدام عن بُعد باستخدام رمز قصير بدلًا من
    استدعاء localhost. استخدم هذا من مضيفات SSH أو Docker أو VPS.
  </Accordion>
  <Accordion title="مفتاح API لـ xAI (Grok)">
    يطلب `XAI_API_KEY` ويهيّئ xAI كموفّر نماذج. استخدم هذا
    عندما تريد مفتاح API من xAI Console بدلًا من اشتراك OAuth.
  </Accordion>
  <Accordion title="OpenCode">
    يطلب `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`) ويتيح لك اختيار كتالوج Zen أو Go.
    عنوان URL للإعداد: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="مفتاح API (عام)">
    يخزّن المفتاح لك.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    يطلب `AI_GATEWAY_API_KEY`.
    مزيد من التفاصيل: [Vercel AI Gateway](/ar/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    يطلب معرف الحساب، ومعرف Gateway، و`CLOUDFLARE_AI_GATEWAY_API_KEY`.
    مزيد من التفاصيل: [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    تُكتب الإعدادات تلقائيًا. الافتراضي المستضاف هو `MiniMax-M3`؛ يستخدم إعداد مفتاح API
    `minimax/...`، ويستخدم إعداد OAuth `minimax-portal/...`.
    مزيد من التفاصيل: [MiniMax](/ar/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    تُكتب الإعدادات تلقائيًا لـ StepFun القياسي أو Step Plan على نقاط النهاية الصينية أو العالمية.
    يتضمن القياسي حاليًا `step-3.5-flash`، كما يتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    مزيد من التفاصيل: [StepFun](/ar/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (متوافق مع Anthropic)">
    يطلب `SYNTHETIC_API_KEY`.
    مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (النماذج المفتوحة السحابية والمحلية)">
    يطلب أولًا `Cloud + Local` أو `Cloud only` أو `Local only`.
    يستخدم `Cloud only` المفتاح `OLLAMA_API_KEY` مع `https://ollama.com`.
    تطلب الأوضاع المدعومة بمضيف عنوان URL الأساسي (الافتراضي `http://127.0.0.1:11434`)، وتكتشف النماذج المتاحة، وتقترح الافتراضيات.
    يفحص `Cloud + Local` أيضًا ما إذا كان مضيف Ollama هذا مسجّل الدخول للوصول السحابي.
    مزيد من التفاصيل: [Ollama](/ar/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot وKimi Coding">
    تُكتب إعدادات Moonshot (Kimi K2) وKimi Coding تلقائيًا.
    مزيد من التفاصيل: [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot).
  </Accordion>
  <Accordion title="موفّر مخصص">
    يعمل مع نقاط النهاية المتوافقة مع OpenAI والمتوافقة مع Anthropic.

    يدعم الإعداد الأولي التفاعلي خيارات تخزين مفتاح API نفسها مثل تدفقات مفاتيح API لموفّري النماذج الآخرين:
    - **لصق مفتاح API الآن** (نص صريح)
    - **استخدام مرجع سرّي** (مرجع بيئة أو مرجع موفّر مهيّأ، مع تحقق أولي)

    العلامات غير التفاعلية:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (اختياري؛ يرجع إلى `CUSTOM_API_KEY`)
    - `--custom-provider-id` (اختياري)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (اختياري؛ الافتراضي `openai`)
    - `--custom-image-input` / `--custom-text-input` (اختياري؛ يتجاوز قدرة إدخال النموذج المستنتجة)

  </Accordion>
  <Accordion title="تخطي">
    يترك المصادقة غير مهيّأة.
  </Accordion>
</AccordionGroup>

سلوك النموذج:

- اختر النموذج الافتراضي من الخيارات المكتشفة، أو أدخل الموفّر والنموذج يدويًا.
- يستنتج الإعداد الأولي للموفّر المخصص دعم الصور لمعرفات النماذج الشائعة، ولا يسأل إلا عندما يكون اسم النموذج غير معروف.
- عندما يبدأ الإعداد الأولي من اختيار مصادقة موفّر، يفضّل منتقي النماذج
  ذلك الموفّر تلقائيًا. بالنسبة إلى Volcengine وBytePlus، يطابق التفضيل نفسه
  أيضًا متغيرات خطط الترميز الخاصة بهما (`volcengine-plan/*`,
  `byteplus-plan/*`).
- إذا كان مرشح الموفّر المفضّل هذا سيكون فارغًا، يرجع المنتقي إلى
  الكتالوج الكامل بدلًا من عدم عرض أي نماذج.
- يشغّل المعالج فحص نموذج ويحذّر إذا كان النموذج المهيّأ غير معروف أو يفتقد المصادقة.

مسارات بيانات الاعتماد وملفات التعريف:

- ملفات تعريف المصادقة (مفاتيح API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- استيراد OAuth القديم: `~/.openclaw/credentials/oauth.json`

وضع تخزين بيانات الاعتماد:

- يستمر سلوك الإعداد الأولي الافتراضي في حفظ مفاتيح API كقيم بنص عادي في ملفات تعريف المصادقة.
- يفعّل `--secret-input-mode ref` وضع المرجع بدلا من تخزين المفتاح كنص عادي.
  في الإعداد التفاعلي، يمكنك اختيار أحد الخيارين:
  - مرجع متغير بيئة (على سبيل المثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - مرجع مزود مهيأ (`file` أو `exec`) مع اسم مستعار للمزود + معرف
- يشغّل وضع المرجع التفاعلي تحقق preflight سريعا قبل الحفظ.
  - مراجع البيئة: تتحقق من اسم المتغير + قيمة غير فارغة في بيئة الإعداد الأولي الحالية.
  - مراجع المزود: تتحقق من تهيئة المزود وتحل المعرف المطلوب.
  - إذا فشل preflight، يعرض الإعداد الأولي الخطأ ويتيح لك إعادة المحاولة.
- في الوضع غير التفاعلي، يكون `--secret-input-mode ref` مدعوما بالبيئة فقط.
  - عيّن متغير بيئة المزود في بيئة عملية الإعداد الأولي.
  - تتطلب أعلام المفاتيح المضمنة (على سبيل المثال `--openai-api-key`) تعيين متغير البيئة ذاك؛ وإلا يفشل الإعداد الأولي بسرعة.
  - بالنسبة إلى المزودين المخصصين، يخزن وضع `ref` غير التفاعلي `models.providers.<id>.apiKey` كـ `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - في حالة المزود المخصص هذه، يتطلب `--custom-api-key` تعيين `CUSTOM_API_KEY`؛ وإلا يفشل الإعداد الأولي بسرعة.
- تدعم بيانات اعتماد مصادقة Gateway خيارات النص العادي وSecretRef في الإعداد التفاعلي:
  - وضع الرمز المميز: **إنشاء/تخزين رمز مميز بنص عادي** (افتراضي) أو **استخدام SecretRef**.
  - وضع كلمة المرور: نص عادي أو SecretRef.
- مسار SecretRef للرمز المميز غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
- تستمر إعدادات النص العادي الحالية في العمل دون تغيير.

<Note>
نصيحة للتشغيل دون واجهة وعلى الخادم: أكمل OAuth على جهاز يحتوي على متصفح، ثم انسخ
`auth-profiles.json` الخاص بذلك الوكيل (على سبيل المثال
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو مسار
`$OPENCLAW_STATE_DIR/...` المطابق) إلى مضيف Gateway. `credentials/oauth.json`
هو مصدر استيراد قديم فقط.
</Note>

## المخرجات والداخليات

الحقول النموذجية في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` عند تمرير `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (إذا تم اختيار Minimax)
- `tools.profile` (يضبط الإعداد الأولي المحلي القيمة افتراضيا إلى `"coding"` عند عدم تعيينها؛ ويتم الاحتفاظ بالقيم الصريحة الحالية)
- `gateway.*` (الوضع، الربط، المصادقة، tailscale)
- `session.dmScope` (يضبط الإعداد الأولي المحلي هذه القيمة افتراضيا إلى `per-channel-peer` عند عدم تعيينها؛ ويتم الاحتفاظ بالقيم الصريحة الحالية)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- قوائم السماح للقنوات (Slack، Discord، Matrix، Microsoft Teams) عند الاشتراك أثناء المطالبات (تتحول الأسماء إلى معرفات عند الإمكان)
- `skills.install.nodeManager`
  - يقبل علم `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - لا يزال بإمكان التهيئة اليدوية تعيين `skills.install.nodeManager: "yarn"` لاحقا.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

يكتب `openclaw agents add` إلى `agents.list[]` و`bindings` الاختيارية.

تُحفظ بيانات اعتماد WhatsApp تحت `~/.openclaw/credentials/whatsapp/<accountId>/`.
تُخزن الجلسات تحت `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
تُوفر بعض القنوات كـ plugins. عند اختيارها أثناء الإعداد، يطالبك المعالج
بتثبيت plugin (npm أو مسار محلي) قبل تهيئة القناة.
</Note>

استدعاء RPC لمعالج Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

يمكن للعملاء (تطبيق macOS وControl UI) عرض الخطوات دون إعادة تنفيذ منطق الإعداد الأولي.

سلوك إعداد Signal:

- ينزّل أصل الإصدار المناسب
- يخزنه تحت `~/.openclaw/tools/signal-cli/<version>/`
- يكتب `channels.signal.cliPath` في التهيئة
- تتطلب إصدارات JVM Java 21
- تُستخدم الإصدارات الأصلية عند توفرها
- يستخدم Windows WSL2 ويتبع مسار signal-cli الخاص بـ Linux داخل WSL

## المستندات ذات الصلة

- مركز الإعداد الأولي: [الإعداد الأولي (CLI)](/ar/start/wizard)
- الأتمتة والسكربتات: [أتمتة CLI](/ar/start/wizard-cli-automation)
- مرجع الأوامر: [`openclaw onboard`](/ar/cli/onboard)
