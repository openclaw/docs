---
read_when:
    - تحتاج إلى تفاصيل سلوك الأمر openclaw onboard
    - أنت تستكشف أخطاء نتائج الإعداد الأولي أو تدمج عملاء الإعداد الأولي
sidebarTitle: CLI reference
summary: مرجع كامل لتدفق إعداد CLI، وإعداد المصادقة/النموذج، والمخرجات، والآليات الداخلية
title: مرجع إعداد CLI
x-i18n:
    generated_at: "2026-04-30T08:27:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d40a63ff27d6aaf4cda167ad0cdf3ad7c4f61ecf92d1cf51b5a0237b24917a7
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

هذه الصفحة هي المرجع الكامل لـ `openclaw onboard`.
للدليل المختصر، راجع [الإعداد الأولي (CLI)](/ar/start/wizard).

## ما يفعله المعالج

يرشدك الوضع المحلي (الافتراضي) خلال:

- إعداد النموذج والمصادقة (OAuth لاشتراك OpenAI Code، أو Anthropic Claude CLI أو مفتاح API، بالإضافة إلى خيارات MiniMax وGLM وOllama وMoonshot وStepFun وAI Gateway)
- موقع مساحة العمل وملفات التمهيد
- إعدادات Gateway (المنفذ، الربط، المصادقة، Tailscale)
- القنوات والموفرون (Telegram وWhatsApp وDiscord وGoogle Chat وMattermost وSignal وBlueBubbles وغيرها من Plugins القنوات المضمّنة)
- تثبيت الخدمة الخلفية (LaunchAgent، أو وحدة مستخدم systemd، أو Windows Scheduled Task الأصلية مع الرجوع إلى مجلد Startup)
- فحص الصحة
- إعداد Skills

يضبط الوضع البعيد هذا الجهاز للاتصال بـ Gateway في مكان آخر.
لا يثبّت أو يعدّل أي شيء على المضيف البعيد.

## تفاصيل التدفق المحلي

<Steps>
  <Step title="اكتشاف الإعدادات الموجودة">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر إبقاء، أو تعديل، أو إعادة تعيين.
    - لا تؤدي إعادة تشغيل المعالج إلى مسح أي شيء إلا إذا اخترت إعادة تعيين صراحةً (أو مررت `--reset`).
    - القيمة الافتراضية لـ CLI `--reset` هي `config+creds+sessions`؛ استخدم `--reset-scope full` لإزالة مساحة العمل أيضًا.
    - إذا كانت الإعدادات غير صالحة أو تحتوي على مفاتيح قديمة، يتوقف المعالج ويطلب منك تشغيل `openclaw doctor` قبل المتابعة.
    - تستخدم إعادة التعيين `trash` وتوفر نطاقات:
      - الإعدادات فقط
      - الإعدادات + بيانات الاعتماد + الجلسات
      - إعادة تعيين كاملة (تزيل مساحة العمل أيضًا)

  </Step>
  <Step title="النموذج والمصادقة">
    - مصفوفة الخيارات الكاملة موجودة في [خيارات المصادقة والنماذج](#auth-and-model-options).

  </Step>
  <Step title="مساحة العمل">
    - الافتراضي `~/.openclaw/workspace` (قابل للضبط).
    - تزرع ملفات مساحة العمل اللازمة لطقس التمهيد عند التشغيل الأول.
    - تخطيط مساحة العمل: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - يطلب المنفذ، والربط، ووضع المصادقة، والتعريض عبر Tailscale.
    - موصى به: أبقِ مصادقة الرمز المميز مفعّلة حتى مع loopback حتى يتعين على عملاء WS المحليين المصادقة.
    - في وضع الرمز المميز، يوفر الإعداد التفاعلي:
      - **توليد/تخزين رمز مميز بنص صريح** (افتراضي)
      - **استخدام SecretRef** (اختياري)
    - في وضع كلمة المرور، يدعم الإعداد التفاعلي أيضًا التخزين بنص صريح أو SecretRef.
    - مسار SecretRef للرمز المميز غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير بيئة غير فارغ في بيئة عملية الإعداد الأولي.
      - لا يمكن دمجه مع `--gateway-token`.
    - عطّل المصادقة فقط إذا كنت تثق تمامًا بكل عملية محلية.
    - ما زالت عمليات الربط غير loopback تتطلب المصادقة.

  </Step>
  <Step title="القنوات">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول QR اختياري
    - [Telegram](/ar/channels/telegram): رمز مميز للبوت
    - [Discord](/ar/channels/discord): رمز مميز للبوت
    - [Google Chat](/ar/channels/googlechat): JSON لحساب خدمة + جمهور Webhook
    - [Mattermost](/ar/channels/mattermost): رمز مميز للبوت + URL أساسي
    - [Signal](/ar/channels/signal): تثبيت `signal-cli` اختياري + إعداد الحساب
    - [BlueBubbles](/ar/channels/bluebubbles): موصى به لـ iMessage؛ URL الخادم + كلمة المرور + Webhook
    - [iMessage](/ar/channels/imessage): مسار CLI القديم `imsg` + وصول DB
    - أمان الرسائل المباشرة: الافتراضي هو الاقتران. ترسل أول رسالة مباشرة رمزًا؛ وافق عبر
      `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.
  </Step>
  <Step title="تثبيت الخدمة الخلفية">
    - macOS: LaunchAgent
      - يتطلب جلسة مستخدم مسجّل الدخول؛ للاستخدام بلا واجهة، استخدم LaunchDaemon مخصصًا (غير مشحون).
    - Linux وWindows عبر WSL2: وحدة مستخدم systemd
      - يحاول المعالج `loginctl enable-linger <user>` حتى يظل Gateway قيد التشغيل بعد تسجيل الخروج.
      - قد يطلب sudo (يكتب إلى `/var/lib/systemd/linger`)؛ يحاول أولًا من دون sudo.
    - Windows الأصلي: Scheduled Task أولًا
      - إذا رُفض إنشاء المهمة، يعود OpenClaw إلى عنصر تسجيل دخول في مجلد Startup لكل مستخدم ويبدأ Gateway فورًا.
      - تظل Scheduled Tasks مفضلة لأنها توفر حالة مشرف أفضل.
    - اختيار وقت التشغيل: Node (موصى به؛ مطلوب لـ WhatsApp وTelegram). لا يُنصح باستخدام Bun.

  </Step>
  <Step title="فحص الصحة">
    - يبدأ Gateway (إذا لزم الأمر) ويشغّل `openclaw health`.
    - يضيف `openclaw status --deep` مسبار صحة Gateway المباشر إلى مخرجات الحالة، بما في ذلك مسابر القنوات عند دعمها.

  </Step>
  <Step title="Skills">
    - يقرأ Skills المتاحة ويتحقق من المتطلبات.
    - يتيح لك اختيار مدير Node: npm أو pnpm أو bun.
    - يثبّت التبعيات الاختيارية (بعضها يستخدم Homebrew على macOS).

  </Step>
  <Step title="الانتهاء">
    - ملخص وخطوات تالية، بما في ذلك خيارات تطبيقات iOS وAndroid وmacOS.

  </Step>
</Steps>

<Note>
إذا لم تُكتشف واجهة GUI، يطبع المعالج تعليمات إعادة توجيه منفذ SSH لـ Control UI بدلًا من فتح متصفح.
إذا كانت أصول Control UI مفقودة، يحاول المعالج بناءها؛ والبديل هو `pnpm ui:build` (يثبّت تبعيات UI تلقائيًا).
</Note>

## تفاصيل الوضع البعيد

يضبط الوضع البعيد هذا الجهاز للاتصال بـ Gateway في مكان آخر.

<Info>
لا يثبّت الوضع البعيد أو يعدّل أي شيء على المضيف البعيد.
</Info>

ما تضبطه:

- URL لـ Gateway البعيد (`ws://...`)
- الرمز المميز إذا كانت مصادقة Gateway البعيد مطلوبة (موصى به)

<Note>
- إذا كان Gateway مقتصرًا على loopback، فاستخدم نفق SSH أو tailnet.
- تلميحات الاكتشاف:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## خيارات المصادقة والنماذج

<AccordionGroup>
  <Accordion title="مفتاح Anthropic API">
    يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يحفظه لاستخدام الخدمة الخلفية.
  </Accordion>
  <Accordion title="اشتراك OpenAI Code (OAuth)">
    تدفق المتصفح؛ الصق `code#state`.

    يضبط `agents.defaults.model` على `openai-codex/gpt-5.5` عندما لا يكون النموذج مضبوطًا أو يكون بالفعل من عائلة OpenAI.

  </Accordion>
  <Accordion title="اشتراك OpenAI Code (اقتران الجهاز)">
    تدفق اقتران المتصفح باستخدام رمز جهاز قصير العمر.

    يضبط `agents.defaults.model` على `openai-codex/gpt-5.5` عندما لا يكون النموذج مضبوطًا أو يكون بالفعل من عائلة OpenAI.

  </Accordion>
  <Accordion title="مفتاح OpenAI API">
    يستخدم `OPENAI_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يخزن بيانات الاعتماد في ملفات تعريف المصادقة.

    يضبط `agents.defaults.model` على `openai/gpt-5.5` عندما لا يكون النموذج مضبوطًا، أو يكون `openai/*`، أو `openai-codex/*`.

  </Accordion>
  <Accordion title="مفتاح xAI (Grok) API">
    يطلب `XAI_API_KEY` ويضبط xAI كموفر نماذج.
  </Accordion>
  <Accordion title="OpenCode">
    يطلب `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`) ويتيح لك اختيار كتالوج Zen أو Go.
    URL الإعداد: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="مفتاح API (عام)">
    يخزن المفتاح لك.
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
    تُكتب الإعدادات تلقائيًا. الافتراضي المستضاف هو `MiniMax-M2.7`؛ يستخدم إعداد مفتاح API
    `minimax/...`، ويستخدم إعداد OAuth `minimax-portal/...`.
    مزيد من التفاصيل: [MiniMax](/ar/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    تُكتب الإعدادات تلقائيًا لـ StepFun القياسي أو Step Plan على نقاط نهاية الصين أو العالمية.
    يتضمن القياسي حاليًا `step-3.5-flash`، وتتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    مزيد من التفاصيل: [StepFun](/ar/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (متوافق مع Anthropic)">
    يطلب `SYNTHETIC_API_KEY`.
    مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (نماذج مفتوحة سحابية ومحلية)">
    يطلب أولًا `Cloud + Local`، أو `Cloud only`، أو `Local only`.
    يستخدم `Cloud only` المتغير `OLLAMA_API_KEY` مع `https://ollama.com`.
    تطلب الأوضاع المدعومة بالمضيف URL الأساسي (الافتراضي `http://127.0.0.1:11434`)، وتكتشف النماذج المتاحة، وتقترح قيمًا افتراضية.
    يتحقق `Cloud + Local` أيضًا مما إذا كان مضيف Ollama هذا مسجل الدخول للوصول السحابي.
    مزيد من التفاصيل: [Ollama](/ar/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot وKimi Coding">
    تُكتب إعدادات Moonshot (Kimi K2) وKimi Coding تلقائيًا.
    مزيد من التفاصيل: [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot).
  </Accordion>
  <Accordion title="موفر مخصص">
    يعمل مع نقاط نهاية متوافقة مع OpenAI ومتوافقة مع Anthropic.

    يدعم الإعداد الأولي التفاعلي خيارات تخزين مفتاح API نفسها كتدفقات مفاتيح API لموفرين آخرين:
    - **لصق مفتاح API الآن** (نص صريح)
    - **استخدام مرجع سرّي** (مرجع env أو مرجع موفر مضبوط، مع تحقق مسبق)

    أعلام غير تفاعلية:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (اختياري؛ يرجع إلى `CUSTOM_API_KEY`)
    - `--custom-provider-id` (اختياري)
    - `--custom-compatibility <openai|anthropic>` (اختياري؛ الافتراضي `openai`)
    - `--custom-image-input` / `--custom-text-input` (اختياري؛ يتجاوز قدرة إدخال النموذج المستنتجة)

  </Accordion>
  <Accordion title="تخطي">
    يترك المصادقة غير مضبوطة.
  </Accordion>
</AccordionGroup>

سلوك النموذج:

- اختر النموذج الافتراضي من الخيارات المكتشفة، أو أدخل الموفر والنموذج يدويًا.
- يستنتج الإعداد الأولي للموفر المخصص دعم الصور لمعرّفات النماذج الشائعة ولا يسأل إلا عندما يكون اسم النموذج غير معروف.
- عندما يبدأ الإعداد الأولي من اختيار مصادقة موفر، يفضّل منتقي النماذج
  ذلك الموفر تلقائيًا. بالنسبة إلى Volcengine وBytePlus، يطابق التفضيل نفسه
  أيضًا متغيرات خطة البرمجة الخاصة بهما (`volcengine-plan/*`,
  `byteplus-plan/*`).
- إذا كان مرشح الموفر المفضل هذا سيكون فارغًا، يعود المنتقي إلى
  الكتالوج الكامل بدلًا من عدم عرض أي نماذج.
- يشغّل المعالج فحصًا للنموذج ويحذر إذا كان النموذج المضبوط غير معروف أو تنقصه المصادقة.

مسارات بيانات الاعتماد وملفات التعريف:

- ملفات تعريف المصادقة (مفاتيح API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- استيراد OAuth القديم: `~/.openclaw/credentials/oauth.json`

وضع تخزين بيانات الاعتماد:

- يحفظ سلوك الإعداد الأولي الافتراضي مفاتيح API كقيم نص صريح في ملفات تعريف المصادقة.
- يفعّل `--secret-input-mode ref` وضع المرجع بدلًا من تخزين المفتاح كنص صريح.
  في الإعداد التفاعلي، يمكنك اختيار أحدهما:
  - مرجع متغير بيئة (على سبيل المثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - مرجع موفر مضبوط (`file` أو `exec`) مع اسم مستعار للموفر + معرّف
- يشغّل وضع المرجع التفاعلي تحققًا مسبقًا سريعًا قبل الحفظ.
  - مراجع Env: تتحقق من اسم المتغير + قيمة غير فارغة في بيئة الإعداد الأولي الحالية.
  - مراجع الموفر: تتحقق من إعدادات الموفر وتحلّ المعرّف المطلوب.
  - إذا فشل التحقق المسبق، يعرض الإعداد الأولي الخطأ ويتيح لك إعادة المحاولة.
- في الوضع غير التفاعلي، يكون `--secret-input-mode ref` مدعومًا بمتغيرات env فقط.
  - اضبط متغير env الخاص بالموفر في بيئة عملية الإعداد الأولي.
  - تتطلب أعلام المفاتيح المضمنة (على سبيل المثال `--openai-api-key`) تعيين متغير env هذا؛ وإلا يفشل الإعداد الأولي بسرعة.
  - بالنسبة إلى الموفرين المخصصين، يخزن وضع `ref` غير التفاعلي `models.providers.<id>.apiKey` كـ `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - في حالة الموفر المخصص هذه، يتطلب `--custom-api-key` تعيين `CUSTOM_API_KEY`؛ وإلا يفشل الإعداد الأولي بسرعة.
- تدعم بيانات اعتماد مصادقة Gateway خيارات النص الصريح وSecretRef في الإعداد التفاعلي:
  - وضع الرمز المميز: **توليد/تخزين رمز مميز بنص صريح** (افتراضي) أو **استخدام SecretRef**.
  - وضع كلمة المرور: نص صريح أو SecretRef.
- مسار SecretRef للرمز المميز غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
- تستمر إعدادات النص الصريح الموجودة في العمل دون تغيير.

<Note>
نصيحة للوضع بلا واجهة وللخوادم: أكمل OAuth على جهاز يحتوي على متصفح، ثم انسخ
ملف `auth-profiles.json` الخاص بذلك الوكيل (على سبيل المثال
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو مسار
`$OPENCLAW_STATE_DIR/...` المطابق) إلى مضيف Gateway. يُعد `credentials/oauth.json`
مصدر استيراد قديمًا فقط.
</Note>

## المخرجات والتفاصيل الداخلية

الحقول المعتادة في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` عند تمرير `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (إذا تم اختيار Minimax)
- `tools.profile` (تعيّن التهيئة المحلية القيمة الافتراضية إلى `"coding"` عند عدم ضبطها؛ وتُحفظ القيم الصريحة الموجودة)
- `gateway.*` (الوضع، الربط، المصادقة، tailscale)
- `session.dmScope` (تعيّن التهيئة المحلية هذه القيمة افتراضيًا إلى `per-channel-peer` عند عدم ضبطها؛ وتُحفظ القيم الصريحة الموجودة)
- `channels.telegram.botToken`، `channels.discord.token`، `channels.matrix.*`، `channels.signal.*`، `channels.imessage.*`
- قوائم السماح للقنوات (Slack، Discord، Matrix، Microsoft Teams) عند الاشتراك أثناء المطالبات (تُحلّ الأسماء إلى معرّفات عند الإمكان)
- `skills.install.nodeManager`
  - يقبل علم `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - لا يزال بإمكان الإعداد اليدوي ضبط `skills.install.nodeManager: "yarn"` لاحقًا.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

يكتب `openclaw agents add` إلى `agents.list[]` و`bindings` الاختيارية.

تُوضع بيانات اعتماد WhatsApp ضمن `~/.openclaw/credentials/whatsapp/<accountId>/`.
تُخزّن الجلسات ضمن `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
تُوفَّر بعض القنوات في صورة Plugin. عند تحديدها أثناء الإعداد، يطلب المعالج
تثبيت Plugin (من npm أو مسار محلي) قبل تهيئة القناة.
</Note>

استدعاء RPC لمعالج Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

يمكن للعملاء (تطبيق macOS وواجهة Control UI) عرض الخطوات من دون إعادة تنفيذ منطق التهيئة.

سلوك إعداد Signal:

- يحمّل أصل الإصدار المناسب
- يخزّنه ضمن `~/.openclaw/tools/signal-cli/<version>/`
- يكتب `channels.signal.cliPath` في الإعدادات
- تتطلب إصدارات JVM وجود Java 21
- تُستخدم الإصدارات الأصلية عند توفرها
- يستخدم Windows نظام WSL2 ويتبع مسار signal-cli الخاص بـ Linux داخل WSL

## المستندات ذات الصلة

- مركز التهيئة: [التهيئة (CLI)](/ar/start/wizard)
- الأتمتة والبرامج النصية: [أتمتة CLI](/ar/start/wizard-cli-automation)
- مرجع الأوامر: [`openclaw onboard`](/ar/cli/onboard)
