---
read_when:
    - تحتاج إلى سلوك مفصل لـ openclaw onboard
    - أنت تصحح نتائج الإعداد الأولي أو تدمج عملاء الإعداد الأولي
sidebarTitle: CLI reference
summary: مرجع كامل لتدفق إعداد CLI، وإعداد المصادقة/النموذج، والمخرجات، والآليات الداخلية
title: مرجع إعداد CLI
x-i18n:
    generated_at: "2026-07-04T06:35:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 016ea0c85cefd5cc70d0988e82f2cbb5898c0ae3134f68df645dddb58c2dfe9a
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

هذه الصفحة هي المرجع الكامل لـ `openclaw onboard`.
للدليل المختصر، راجع [الإعداد الأولي (CLI)](/ar/start/wizard).

## ما الذي يفعله المعالج

يرشدك الوضع المحلي (الافتراضي) خلال:

- إعداد النموذج والمصادقة (OAuth لاشتراك OpenAI Code، وAnthropic Claude CLI أو مفتاح API، بالإضافة إلى خيارات MiniMax وGLM وOllama وMoonshot وStepFun وAI Gateway)
- موقع مساحة العمل وملفات التمهيد
- إعدادات Gateway (المنفذ، والربط، والمصادقة، وTailscale)
- القنوات والموفرون (Telegram وWhatsApp وDiscord وGoogle Chat وMattermost وSignal وiMessage وغيرها من Plugins القنوات المضمّنة)
- تثبيت Daemon ‏(LaunchAgent أو وحدة مستخدم systemd أو مهمة Windows Scheduled Task أصلية مع رجوع احتياطي إلى مجلد Startup)
- فحص السلامة
- إعداد Skills

يضبط الوضع البعيد هذا الجهاز للاتصال بـ Gateway في مكان آخر.
لا يثبّت أو يغيّر أي شيء على المضيف البعيد.

## تفاصيل التدفق المحلي

<Steps>
  <Step title="اكتشاف الإعدادات الحالية">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر الإبقاء أو التعديل أو إعادة الضبط.
    - لا تؤدي إعادة تشغيل المعالج إلى مسح أي شيء إلا إذا اخترت إعادة الضبط صراحةً (أو مررت `--reset`).
    - يكون الإعداد الافتراضي لـ CLI `--reset` هو `config+creds+sessions`؛ استخدم `--reset-scope full` لإزالة مساحة العمل أيضًا.
    - إذا كانت الإعدادات غير صالحة أو تحتوي على مفاتيح قديمة، يتوقف المعالج ويطلب منك تشغيل `openclaw doctor` قبل المتابعة.
    - تستخدم إعادة الضبط `trash` وتوفر نطاقات:
      - الإعدادات فقط
      - الإعدادات + بيانات الاعتماد + الجلسات
      - إعادة ضبط كاملة (تزيل مساحة العمل أيضًا)

  </Step>
  <Step title="النموذج والمصادقة">
    - مصفوفة الخيارات الكاملة موجودة في [خيارات المصادقة والنماذج](#auth-and-model-options).

  </Step>
  <Step title="مساحة العمل">
    - الافتراضي `~/.openclaw/workspace` (قابل للتهيئة).
    - يضيف ملفات مساحة العمل اللازمة لطقس التمهيد عند التشغيل الأول.
    - تخطيط مساحة العمل: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - يطلب المنفذ والربط ووضع المصادقة وتعريض Tailscale.
    - الموصى به: أبقِ مصادقة الرمز مفعّلة حتى مع loopback حتى يُطلب من عملاء WS المحليين المصادقة.
    - في وضع الرمز، يوفر الإعداد التفاعلي:
      - **إنشاء/تخزين رمز بنص صريح** (افتراضي)
      - **استخدام SecretRef** (اختياري)
    - في وضع كلمة المرور، يدعم الإعداد التفاعلي أيضًا التخزين بنص صريح أو عبر SecretRef.
    - مسار SecretRef للرمز في الوضع غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير بيئة غير فارغ في بيئة عملية الإعداد الأولي.
      - لا يمكن دمجه مع `--gateway-token`.
    - عطّل المصادقة فقط إذا كنت تثق بالكامل بكل عملية محلية.
    - ما زالت عمليات الربط غير loopback تتطلب المصادقة.

  </Step>
  <Step title="القنوات">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول اختياري عبر QR
    - [Telegram](/ar/channels/telegram): رمز bot
    - [Discord](/ar/channels/discord): رمز bot
    - [Google Chat](/ar/channels/googlechat): JSON لحساب خدمة + جمهور Webhook
    - [Mattermost](/ar/channels/mattermost): رمز bot + عنوان URL أساسي
    - [Signal](/ar/channels/signal): تثبيت اختياري لـ `signal-cli` + إعداد الحساب
    - [iMessage](/ar/channels/imessage): مسار `imsg` CLI + الوصول إلى قاعدة بيانات Messages؛ استخدم غلاف SSH عندما يعمل Gateway خارج Mac
    - أمان الرسائل المباشرة: الافتراضي هو الاقتران. ترسل أول رسالة مباشرة رمزًا؛ وافق عبر
      `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.
  </Step>
  <Step title="تثبيت Daemon">
    - macOS: ‏LaunchAgent
      - يتطلب جلسة مستخدم مسجلة الدخول؛ للحالات بلا واجهة، استخدم LaunchDaemon مخصصًا (غير مشحون).
    - Linux وWindows عبر WSL2: وحدة مستخدم systemd
      - يحاول المعالج `loginctl enable-linger <user>` حتى يبقى Gateway يعمل بعد تسجيل الخروج.
      - قد يطلب sudo (يكتب إلى `/var/lib/systemd/linger`)؛ يجرب أولًا بدون sudo.
    - Windows الأصلي: Scheduled Task أولًا
      - إذا رُفض إنشاء المهمة، يرجع OpenClaw إلى عنصر تسجيل دخول في مجلد Startup لكل مستخدم ويبدأ Gateway فورًا.
      - تبقى Scheduled Tasks مفضلة لأنها توفر حالة إشراف أفضل.
    - اختيار وقت التشغيل: Node (موصى به؛ مطلوب لـ WhatsApp وTelegram). لا يُنصح باستخدام Bun.

  </Step>
  <Step title="فحص السلامة">
    - يبدأ Gateway (إذا لزم الأمر) ويشغل `openclaw health`.
    - يضيف `openclaw status --deep` مسبار سلامة Gateway الحي إلى ناتج الحالة، بما في ذلك مسابير القنوات عند دعمها.

  </Step>
  <Step title="Skills">
    - يقرأ Skills المتاحة ويتحقق من المتطلبات.
    - يتيح لك اختيار مدير Node: npm أو pnpm أو bun.
    - يثبّت التبعيات الاختيارية للـ Skills المضمّنة الموثوقة عندما يكون المثبّت المطلوب متاحًا.
    - يتجاوز مثبتات Homebrew وuv وGo غير المتاحة، ثم يجمع Skills المتأثرة مع إرشادات الإعداد اليدوي. شغّل `openclaw doctor` بعد تثبيت المتطلبات الأساسية المفقودة.

  </Step>
  <Step title="الانتهاء">
    - ملخص وخطوات تالية، بما في ذلك خيارات تطبيقات iOS وAndroid وmacOS.

  </Step>
</Steps>

<Note>
إذا لم تُكتشف واجهة رسومية، يطبع المعالج تعليمات تمرير منفذ SSH لـ Control UI بدلًا من فتح متصفح.
إذا كانت أصول Control UI مفقودة، يحاول المعالج بناءها؛ والرجوع الاحتياطي هو `pnpm ui:build` (يثبّت تبعيات UI تلقائيًا).
</Note>

## تفاصيل الوضع البعيد

يضبط الوضع البعيد هذا الجهاز للاتصال بـ Gateway في مكان آخر.

<Info>
لا يثبّت الوضع البعيد أو يغيّر أي شيء على المضيف البعيد.
</Info>

ما تضبطه:

- عنوان URL لـ Gateway البعيد (`ws://...`)
- الرمز إذا كانت مصادقة Gateway البعيد مطلوبة (موصى به)

<Note>
- إذا كان Gateway مقتصرًا على loopback، فاستخدم نفق SSH أو tailnet.
- تلميحات الاكتشاف:
  - macOS: ‏Bonjour (`dns-sd`)
  - Linux: ‏Avahi (`avahi-browse`)

</Note>

## خيارات المصادقة والنماذج

<AccordionGroup>
  <Accordion title="مفتاح Anthropic API">
    يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يحفظه لاستخدام Daemon.
  </Accordion>
  <Accordion title="اشتراك OpenAI Code ‏(OAuth)">
    تدفق عبر المتصفح؛ الصق `code#state`.

    يضبط `agents.defaults.model` إلى `openai/gpt-5.5` عبر وقت تشغيل Codex عندما لا يكون النموذج مضبوطًا أو يكون بالفعل من عائلة OpenAI.

  </Accordion>
  <Accordion title="اشتراك OpenAI Code (اقتران الجهاز)">
    تدفق اقتران عبر المتصفح مع رمز جهاز قصير العمر.

    يضبط `agents.defaults.model` إلى `openai/gpt-5.5` عبر وقت تشغيل Codex عندما لا يكون النموذج مضبوطًا أو يكون بالفعل من عائلة OpenAI.

  </Accordion>
  <Accordion title="مفتاح OpenAI API">
    يستخدم `OPENAI_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يخزن بيانات الاعتماد في ملفات تعريف المصادقة.

    يضبط `agents.defaults.model` إلى `openai/gpt-5.5` عندما لا يكون النموذج مضبوطًا، أو يكون `openai/*`، أو مراجع نماذج Codex قديمة.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    تسجيل دخول عبر المتصفح لحسابات SuperGrok أو X Premium المؤهلة. هذا هو مسار xAI الموصى به لمعظم المستخدمين. يخزن OpenClaw ملف تعريف المصادقة الناتج لنماذج Grok وGrok `web_search` و`x_search` و`code_execution`.
  </Accordion>
  <Accordion title="رمز جهاز xAI (Grok)">
    تسجيل دخول عبر المتصفح مناسب للوصول البعيد باستخدام رمز قصير بدلًا من رد نداء localhost. استخدم هذا من مضيفات SSH أو Docker أو VPS.
  </Accordion>
  <Accordion title="مفتاح xAI (Grok) API">
    يطلب `XAI_API_KEY` ويهيئ xAI كموفر نماذج. استخدم هذا عندما تريد مفتاح xAI Console API بدلًا من OAuth الاشتراك.
  </Accordion>
  <Accordion title="OpenCode">
    يطلب `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`) ويتيح لك اختيار كتالوج Zen أو Go.
    عنوان URL للإعداد: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="مفتاح API (عام)">
    يخزن المفتاح لك.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    يطلب `AI_GATEWAY_API_KEY`.
    تفاصيل أكثر: [Vercel AI Gateway](/ar/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    يطلب معرف الحساب ومعرف Gateway و`CLOUDFLARE_AI_GATEWAY_API_KEY`.
    تفاصيل أكثر: [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    تُكتب الإعدادات تلقائيًا. الافتراضي المستضاف هو `MiniMax-M3`؛ يستخدم إعداد مفتاح API
    `minimax/...`، ويستخدم إعداد OAuth ‏`minimax-portal/...`.
    تفاصيل أكثر: [MiniMax](/ar/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    تُكتب الإعدادات تلقائيًا لـ StepFun القياسي أو Step Plan على نقاط النهاية في الصين أو العالمية.
    يتضمن القياسي حاليًا `step-3.5-flash`، كما يتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    تفاصيل أكثر: [StepFun](/ar/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (متوافق مع Anthropic)">
    يطلب `SYNTHETIC_API_KEY`.
    تفاصيل أكثر: [Synthetic](/ar/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (نماذج Cloud والمفتوحة المحلية)">
    يطلب أولًا `Cloud + Local` أو `Cloud only` أو `Local only`.
    يستخدم `Cloud only` ‏`OLLAMA_API_KEY` مع `https://ollama.com`.
    تطلب الأوضاع المدعومة بمضيف عنوان URL أساسيًا (الافتراضي `http://127.0.0.1:11434`)، وتكتشف النماذج المتاحة، وتقترح الافتراضيات.
    يتحقق `Cloud + Local` أيضًا مما إذا كان مضيف Ollama هذا مسجل الدخول للوصول إلى السحابة.
    تفاصيل أكثر: [Ollama](/ar/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot وKimi Coding">
    تُكتب إعدادات Moonshot (Kimi K2) وKimi Coding تلقائيًا.
    تفاصيل أكثر: [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot).
  </Accordion>
  <Accordion title="موفر مخصص">
    يعمل مع نقاط النهاية المتوافقة مع OpenAI والمتوافقة مع Anthropic.

    يدعم الإعداد الأولي التفاعلي اختيارات تخزين مفتاح API نفسها كتدفقات مفاتيح API لموفرين آخرين:
    - **لصق مفتاح API الآن** (نص صريح)
    - **استخدام مرجع سرّي** (مرجع env أو مرجع موفر مهيأ، مع تحقق مسبق)

    أعلام الوضع غير التفاعلي:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (اختياري؛ يرجع إلى `CUSTOM_API_KEY`)
    - `--custom-provider-id` (اختياري)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (اختياري؛ الافتراضي `openai`)
    - `--custom-image-input` / `--custom-text-input` (اختياري؛ يتجاوز قدرة إدخال النموذج المستنتجة)

  </Accordion>
  <Accordion title="تخطي">
    يترك المصادقة غير مهيأة.
  </Accordion>
</AccordionGroup>

سلوك النموذج:

- اختر النموذج الافتراضي من الخيارات المكتشفة، أو أدخل الموفر والنموذج يدويًا.
- يستنتج إعداد الموفر المخصص دعم الصور لمعرفات النماذج الشائعة ولا يسأل إلا عندما يكون اسم النموذج غير معروف.
- عندما يبدأ الإعداد الأولي من اختيار مصادقة موفر، يفضل منتقي النماذج ذلك الموفر تلقائيًا. بالنسبة إلى Volcengine وBytePlus، يطابق التفضيل نفسه أيضًا متغيرات خطط البرمجة الخاصة بهما (`volcengine-plan/*`،
  `byteplus-plan/*`).
- إذا كان مرشح الموفر المفضل هذا سيصبح فارغًا، يرجع المنتقي إلى الكتالوج الكامل بدلًا من عدم عرض أي نماذج.
- يشغل المعالج فحصًا للنموذج ويحذر إذا كان النموذج المهيأ غير معروف أو يفتقد المصادقة.

مسارات بيانات الاعتماد وملفات التعريف:

- ملفات تعريف المصادقة (مفاتيح API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- استيراد OAuth القديم: `~/.openclaw/credentials/oauth.json`

وضع تخزين بيانات الاعتماد:

- يستمر سلوك الإعداد الأولي الافتراضي في حفظ مفاتيح API كقيم نص عادي في ملفات تعريف المصادقة.
- يفعّل `--secret-input-mode ref` وضع المرجع بدلاً من تخزين المفتاح كنص عادي.
  في الإعداد التفاعلي، يمكنك اختيار أحد الخيارين:
  - مرجع متغير بيئة (على سبيل المثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - مرجع مزود مُهيأ (`file` أو `exec`) مع اسم مستعار للمزود + معرّف
- يشغّل وضع المرجع التفاعلي تحققاً تمهيدياً سريعاً قبل الحفظ.
  - مراجع البيئة: تتحقق من اسم المتغير + قيمة غير فارغة في بيئة الإعداد الأولي الحالية.
  - مراجع المزود: تتحقق من إعدادات المزود وتستخرج المعرّف المطلوب.
  - إذا فشل التحقق التمهيدي، يعرض الإعداد الأولي الخطأ ويتيح لك إعادة المحاولة.
- في الوضع غير التفاعلي، يكون `--secret-input-mode ref` مدعوماً بالبيئة فقط.
  - عيّن متغير بيئة المزود في بيئة عملية الإعداد الأولي.
  - تتطلب أعلام المفاتيح المضمنة (على سبيل المثال `--openai-api-key`) تعيين متغير البيئة هذا؛ وإلا يفشل الإعداد الأولي سريعاً.
  - بالنسبة إلى المزودين المخصصين، يخزّن وضع `ref` غير التفاعلي `models.providers.<id>.apiKey` على أنه `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - في حالة المزود المخصص هذه، يتطلب `--custom-api-key` تعيين `CUSTOM_API_KEY`؛ وإلا يفشل الإعداد الأولي سريعاً.
- تدعم بيانات اعتماد مصادقة Gateway اختيارات النص العادي وSecretRef في الإعداد التفاعلي:
  - وضع الرمز المميز: **توليد/تخزين رمز مميز كنص عادي** (افتراضي) أو **استخدام SecretRef**.
  - وضع كلمة المرور: نص عادي أو SecretRef.
- مسار SecretRef للرمز المميز غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
- تستمر الإعدادات الحالية ذات النص العادي في العمل دون تغيير.

<Note>
نصيحة لوضع عدم العرض والخادم: أكمل OAuth على جهاز يحتوي على متصفح، ثم انسخ
`auth-profiles.json` الخاص بذلك الوكيل (على سبيل المثال
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو مسار
`$OPENCLAW_STATE_DIR/...` المطابق) إلى مضيف Gateway. يُعد `credentials/oauth.json`
مصدر استيراد قديماً فقط.
</Note>

## المخرجات والداخليات

الحقول المعتادة في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` عند تمرير `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (إذا تم اختيار Minimax)
- `tools.profile` (يضبط الإعداد الأولي المحلي القيمة افتراضياً على `"coding"` عندما تكون غير معينة؛ وتُحفظ القيم الصريحة الحالية)
- `gateway.*` (الوضع، الربط، المصادقة، tailscale)
- `session.dmScope` (يضبط الإعداد الأولي المحلي هذه القيمة افتراضياً على `per-channel-peer` عندما تكون غير معينة؛ وتُحفظ القيم الصريحة الحالية)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- قوائم السماح للقنوات (Slack، Discord، Matrix، Microsoft Teams) عند الاشتراك أثناء المطالبات (تُحل الأسماء إلى معرّفات عندما يكون ذلك ممكناً)
- `skills.install.nodeManager`
  - يقبل علم `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - لا يزال بإمكان الإعداد اليدوي تعيين `skills.install.nodeManager: "yarn"` لاحقاً.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

يكتب `openclaw agents add` إلى `agents.list[]` و`bindings` الاختيارية.

توضع بيانات اعتماد WhatsApp ضمن `~/.openclaw/credentials/whatsapp/<accountId>/`.
وتُخزّن الجلسات ضمن `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
تُسلَّم بعض القنوات كـ plugins. عند اختيارها أثناء الإعداد، يطالبك المعالج
بتثبيت Plugin (npm أو مسار محلي) قبل تهيئة القناة.
</Note>

استدعاء RPC لمعالج Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

يمكن للعملاء (تطبيق macOS وControl UI) عرض الخطوات دون إعادة تنفيذ منطق الإعداد الأولي.

سلوك إعداد Signal:

- ينزّل أصل الإصدار المناسب
- يخزّنه ضمن `~/.openclaw/tools/signal-cli/<version>/`
- يكتب `channels.signal.cliPath` في الإعدادات
- تتطلب إصدارات JVM وجود Java 21
- تُستخدم الإصدارات الأصلية عند توفرها
- يستخدم Windows WSL2 ويتبع تدفق signal-cli الخاص بـ Linux داخل WSL

## الوثائق ذات الصلة

- مركز الإعداد الأولي: [الإعداد الأولي (CLI)](/ar/start/wizard)
- الأتمتة والسكربتات: [أتمتة CLI](/ar/start/wizard-cli-automation)
- مرجع الأوامر: [`openclaw onboard`](/ar/cli/onboard)
