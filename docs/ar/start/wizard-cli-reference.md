---
read_when:
    - تحتاج إلى سلوك مفصل للأمر openclaw onboard
    - أنت تعمل على تصحيح أخطاء نتائج الإعداد الأولي أو دمج عملاء الإعداد الأولي
sidebarTitle: CLI reference
summary: مرجع كامل لتدفق إعداد CLI، وإعداد المصادقة/النموذج، والمخرجات، والآليات الداخلية
title: مرجع إعداد CLI
x-i18n:
    generated_at: "2026-06-30T22:19:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be3e95a300707eade19f5c7fdf6f3a330ffe7e1e83866b36fb9bd1f742256ef
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

هذه الصفحة هي المرجع الكامل لـ `openclaw onboard`.
للدليل المختصر، راجع [التهيئة الأولية (CLI)](/ar/start/wizard).

## ما يفعله المعالج

يرشدك الوضع المحلي (الافتراضي) خلال:

- إعداد النموذج والمصادقة (OAuth لاشتراك OpenAI Code، أو Anthropic Claude CLI أو مفتاح API، إضافة إلى خيارات MiniMax وGLM وOllama وMoonshot وStepFun وAI Gateway)
- موقع مساحة العمل وملفات التمهيد
- إعدادات Gateway (المنفذ، والربط، والمصادقة، وTailscale)
- القنوات والموفرون (Telegram وWhatsApp وDiscord وGoogle Chat وMattermost وSignal وiMessage وغيرها من Plugins القنوات المضمّنة)
- تثبيت العملية الخفية (LaunchAgent، أو وحدة مستخدم systemd، أو مهمة Windows Scheduled Task أصلية مع الرجوع إلى مجلد Startup)
- فحص السلامة
- إعداد Skills

يضبط الوضع البعيد هذا الجهاز للاتصال بـ Gateway في مكان آخر.
لا يثبّت أو يعدّل أي شيء على المضيف البعيد.

## تفاصيل التدفق المحلي

<Steps>
  <Step title="اكتشاف الإعدادات الحالية">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر الإبقاء أو التعديل أو إعادة الضبط.
    - لا تؤدي إعادة تشغيل المعالج إلى مسح أي شيء ما لم تختر إعادة الضبط صراحةً (أو تمرر `--reset`).
    - قيمة `--reset` الافتراضية في CLI هي `config+creds+sessions`؛ استخدم `--reset-scope full` لإزالة مساحة العمل أيضًا.
    - إذا كانت الإعدادات غير صالحة أو تحتوي على مفاتيح قديمة، يتوقف المعالج ويطلب منك تشغيل `openclaw doctor` قبل المتابعة.
    - تستخدم إعادة الضبط `trash` وتعرض النطاقات:
      - الإعدادات فقط
      - الإعدادات + بيانات الاعتماد + الجلسات
      - إعادة ضبط كاملة (تزيل مساحة العمل أيضًا)

  </Step>
  <Step title="النموذج والمصادقة">
    - مصفوفة الخيارات الكاملة موجودة في [خيارات المصادقة والنماذج](#auth-and-model-options).

  </Step>
  <Step title="مساحة العمل">
    - الافتراضي `~/.openclaw/workspace` (قابل للتهيئة).
    - يضيف ملفات مساحة العمل اللازمة لطقس تمهيد التشغيل الأول.
    - تخطيط مساحة العمل: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - يطلب المنفذ، والربط، ووضع المصادقة، وتعريض Tailscale.
    - موصى به: أبقِ مصادقة الرمز المميز مفعّلة حتى مع local loopback حتى يتعين على عملاء WS المحليين المصادقة.
    - في وضع الرمز المميز، يعرض الإعداد التفاعلي:
      - **توليد/تخزين رمز مميز بنص صريح** (افتراضي)
      - **استخدام SecretRef** (اختياري)
    - في وضع كلمة المرور، يدعم الإعداد التفاعلي أيضًا التخزين بالنص الصريح أو SecretRef.
    - مسار SecretRef للرمز المميز غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير بيئة غير فارغ في بيئة عملية التهيئة الأولية.
      - لا يمكن دمجه مع `--gateway-token`.
    - عطّل المصادقة فقط إذا كنت تثق تمامًا بكل عملية محلية.
    - لا تزال عمليات الربط غير الخاصة بـ local loopback تتطلب المصادقة.

  </Step>
  <Step title="القنوات">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول QR اختياري
    - [Telegram](/ar/channels/telegram): رمز مميز للبوت
    - [Discord](/ar/channels/discord): رمز مميز للبوت
    - [Google Chat](/ar/channels/googlechat): JSON لحساب خدمة + جمهور Webhook
    - [Mattermost](/ar/channels/mattermost): رمز مميز للبوت + عنوان URL الأساسي
    - [Signal](/ar/channels/signal): تثبيت `signal-cli` اختياري + إعداد الحساب
    - [iMessage](/ar/channels/imessage): مسار `imsg` CLI + وصول إلى قاعدة بيانات Messages؛ استخدم مغلّف SSH عندما يعمل Gateway خارج Mac
    - أمان الرسائل المباشرة: الافتراضي هو الاقتران. ترسل أول رسالة مباشرة رمزًا؛ وافق عبر
      `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.
  </Step>
  <Step title="تثبيت العملية الخفية">
    - macOS: LaunchAgent
      - يتطلب جلسة مستخدم مسجّل الدخول؛ للتشغيل بلا واجهة، استخدم LaunchDaemon مخصصًا (غير مشحون).
    - Linux وWindows عبر WSL2: وحدة مستخدم systemd
      - يحاول المعالج `loginctl enable-linger <user>` حتى يظل Gateway قيد التشغيل بعد تسجيل الخروج.
      - قد يطلب sudo (يكتب إلى `/var/lib/systemd/linger`)؛ يحاول أولًا من دون sudo.
    - Windows الأصلي: Scheduled Task أولًا
      - إذا رُفض إنشاء المهمة، يرجع OpenClaw إلى عنصر تسجيل دخول لكل مستخدم في مجلد Startup ويبدأ Gateway فورًا.
      - تظل Scheduled Tasks مفضلة لأنها توفر حالة مشرف أفضل.
    - اختيار بيئة التشغيل: Node (موصى به؛ مطلوب لـ WhatsApp وTelegram). لا يُنصح بـ Bun.

  </Step>
  <Step title="فحص السلامة">
    - يبدأ Gateway (إذا لزم الأمر) ويشغّل `openclaw health`.
    - يضيف `openclaw status --deep` مسبار سلامة Gateway المباشر إلى مخرجات الحالة، بما في ذلك مسابير القنوات عندما تكون مدعومة.

  </Step>
  <Step title="Skills">
    - يقرأ Skills المتاحة ويفحص المتطلبات.
    - يتيح لك اختيار مدير Node: npm أو pnpm أو bun.
    - يثبّت الاعتماديات الاختيارية (بعضها يستخدم Homebrew على macOS).

  </Step>
  <Step title="الإنهاء">
    - ملخص وخطوات تالية، بما في ذلك خيارات تطبيقات iOS وAndroid وmacOS.

  </Step>
</Steps>

<Note>
إذا لم تُكتشف واجهة رسومية، يطبع المعالج تعليمات تمرير منفذ SSH لواجهة Control UI بدلًا من فتح متصفح.
إذا كانت أصول Control UI مفقودة، يحاول المعالج بناءها؛ وخيار الرجوع هو `pnpm ui:build` (يثبّت اعتماديات الواجهة تلقائيًا).
</Note>

## تفاصيل الوضع البعيد

يضبط الوضع البعيد هذا الجهاز للاتصال بـ Gateway في مكان آخر.

<Info>
لا يثبّت الوضع البعيد أو يعدّل أي شيء على المضيف البعيد.
</Info>

ما تضبطه:

- عنوان URL لـ Gateway البعيد (`ws://...`)
- الرمز المميز إذا كانت مصادقة Gateway البعيد مطلوبة (موصى به)

<Note>
- إذا كان Gateway مقتصرًا على local loopback فقط، فاستخدم نفق SSH أو شبكة tailnet.
- تلميحات الاكتشاف:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## خيارات المصادقة والنماذج

<AccordionGroup>
  <Accordion title="مفتاح Anthropic API">
    يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يحفظه لاستخدام العملية الخفية.
  </Accordion>
  <Accordion title="اشتراك OpenAI Code (OAuth)">
    تدفق المتصفح؛ الصق `code#state`.

    يعيّن `agents.defaults.model` إلى `openai/gpt-5.5` عبر بيئة تشغيل Codex عندما لا يكون النموذج معيّنًا أو يكون بالفعل من عائلة OpenAI.

  </Accordion>
  <Accordion title="اشتراك OpenAI Code (اقتران الجهاز)">
    تدفق اقتران عبر المتصفح مع رمز جهاز قصير العمر.

    يعيّن `agents.defaults.model` إلى `openai/gpt-5.5` عبر بيئة تشغيل Codex عندما لا يكون النموذج معيّنًا أو يكون بالفعل من عائلة OpenAI.

  </Accordion>
  <Accordion title="مفتاح OpenAI API">
    يستخدم `OPENAI_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يخزّن بيانات الاعتماد في ملفات تعريف المصادقة.

    يعيّن `agents.defaults.model` إلى `openai/gpt-5.5` عندما لا يكون النموذج معيّنًا، أو يكون `openai/*`، أو مراجع نماذج Codex القديمة.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    تسجيل دخول عبر المتصفح للحسابات المؤهلة في SuperGrok أو X Premium. هذا هو
    مسار xAI الموصى به لمعظم المستخدمين. يخزّن OpenClaw ملف تعريف المصادقة الناتج
    لنماذج Grok وGrok `web_search` و`x_search` و`code_execution`.
  </Accordion>
  <Accordion title="رمز جهاز xAI (Grok)">
    تسجيل دخول عبر المتصفح مناسب للاستخدام البعيد مع رمز قصير بدلًا من رد نداء localhost.
    استخدم هذا من مضيفات SSH أو Docker أو VPS.
  </Accordion>
  <Accordion title="مفتاح xAI (Grok) API">
    يطلب `XAI_API_KEY` ويضبط xAI كموفر نماذج. استخدم هذا
    عندما تريد مفتاح API من xAI Console بدل OAuth الخاص بالاشتراك.
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
    يطلب معرّف الحساب، ومعرّف Gateway، و`CLOUDFLARE_AI_GATEWAY_API_KEY`.
    مزيد من التفاصيل: [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    تُكتب الإعدادات تلقائيًا. الافتراضي المستضاف هو `MiniMax-M3`؛ يستخدم إعداد مفتاح API
    `minimax/...`، ويستخدم إعداد OAuth
    `minimax-portal/...`.
    مزيد من التفاصيل: [MiniMax](/ar/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    تُكتب الإعدادات تلقائيًا لـ StepFun القياسي أو Step Plan على نقاط النهاية في الصين أو العالمية.
    يتضمن القياسي حاليًا `step-3.5-flash`، ويتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    مزيد من التفاصيل: [StepFun](/ar/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (متوافق مع Anthropic)">
    يطلب `SYNTHETIC_API_KEY`.
    مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (النماذج المفتوحة السحابية والمحلية)">
    يطلب أولًا `Cloud + Local` أو `Cloud only` أو `Local only`.
    يستخدم `Cloud only` المتغير `OLLAMA_API_KEY` مع `https://ollama.com`.
    تطلب الأوضاع المدعومة بالمضيف عنوان URL الأساسي (الافتراضي `http://127.0.0.1:11434`)، وتكتشف النماذج المتاحة، وتقترح الإعدادات الافتراضية.
    يتحقق `Cloud + Local` أيضًا مما إذا كان مضيف Ollama هذا مسجّل الدخول للوصول السحابي.
    مزيد من التفاصيل: [Ollama](/ar/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot وKimi Coding">
    تُكتب إعدادات Moonshot (Kimi K2) وKimi Coding تلقائيًا.
    مزيد من التفاصيل: [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot).
  </Accordion>
  <Accordion title="موفر مخصص">
    يعمل مع نقاط نهاية متوافقة مع OpenAI ومتوافقة مع Anthropic.

    تدعم التهيئة الأولية التفاعلية خيارات تخزين مفتاح API نفسها مثل تدفقات مفاتيح API للموفرين الآخرين:
    - **لصق مفتاح API الآن** (نص صريح)
    - **استخدام مرجع سرّي** (مرجع env أو مرجع موفر مضبوط، مع تحقق تمهيدي)

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
    يترك المصادقة غير مضبوطة.
  </Accordion>
</AccordionGroup>

سلوك النموذج:

- اختر النموذج الافتراضي من الخيارات المكتشفة، أو أدخل الموفر والنموذج يدويًا.
- تستنتج التهيئة الأولية للموفر المخصص دعم الصور لمعرّفات النماذج الشائعة، ولا تسأل إلا عندما يكون اسم النموذج غير معروف.
- عندما تبدأ التهيئة الأولية من خيار مصادقة موفر، يفضّل منتقي النموذج
  ذلك الموفر تلقائيًا. بالنسبة إلى Volcengine وBytePlus، يطابق التفضيل نفسه
  متغيرات خطط الترميز الخاصة بهما (`volcengine-plan/*`,
  `byteplus-plan/*`).
- إذا كان مرشح الموفر المفضل هذا سيكون فارغًا، يرجع المنتقي إلى
  الكتالوج الكامل بدل عرض عدم وجود نماذج.
- يشغّل المعالج فحص نموذج ويحذر إذا كان النموذج المضبوط غير معروف أو يفتقر إلى المصادقة.

مسارات بيانات الاعتماد وملفات التعريف:

- ملفات تعريف المصادقة (مفاتيح API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- استيراد OAuth القديم: `~/.openclaw/credentials/oauth.json`

وضع تخزين بيانات الاعتماد:

- يستمر سلوك التهيئة الافتراضي في حفظ مفاتيح API كقيم نص عادي في ملفات تعريف المصادقة.
- يفعّل `--secret-input-mode ref` وضع المراجع بدل تخزين المفاتيح كنص عادي.
  في الإعداد التفاعلي، يمكنك اختيار أحد الخيارين:
  - مرجع متغير بيئة، مثل `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`
  - مرجع موفر مُعدّ (`file` أو `exec`) مع الاسم المستعار للموفر + المعرّف
- يشغّل وضع المرجع التفاعلي تحققًا تمهيديًا سريعًا قبل الحفظ.
  - مراجع البيئة: يتحقق من اسم المتغير + قيمة غير فارغة في بيئة التهيئة الحالية.
  - مراجع الموفر: يتحقق من إعداد الموفر ويحل المعرّف المطلوب.
  - إذا فشل التحقق التمهيدي، تعرض التهيئة الخطأ وتتيح لك إعادة المحاولة.
- في الوضع غير التفاعلي، يكون `--secret-input-mode ref` مدعومًا بالبيئة فقط.
  - اضبط متغير بيئة الموفر في بيئة عملية التهيئة.
  - تتطلب أعلام المفاتيح المضمّنة، مثل `--openai-api-key`، ضبط متغير البيئة ذلك؛ وإلا تفشل التهيئة سريعًا.
  - بالنسبة إلى الموفرين المخصصين، يخزّن وضع `ref` غير التفاعلي `models.providers.<id>.apiKey` كـ `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - في حالة الموفر المخصص هذه، يتطلب `--custom-api-key` ضبط `CUSTOM_API_KEY`؛ وإلا تفشل التهيئة سريعًا.
- تدعم بيانات اعتماد مصادقة Gateway خيارات النص العادي وSecretRef في الإعداد التفاعلي:
  - وضع الرمز: **توليد/تخزين رمز بنص عادي** (افتراضي) أو **استخدام SecretRef**.
  - وضع كلمة المرور: نص عادي أو SecretRef.
- مسار Token SecretRef غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
- تستمر إعدادات النص العادي الحالية في العمل دون تغيير.

<Note>
نصيحة للأنظمة دون واجهة رسومية والخوادم: أكمل OAuth على جهاز يحتوي على متصفح، ثم انسخ
`auth-profiles.json` لذلك الوكيل (مثل
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو مسار
`$OPENCLAW_STATE_DIR/...` المطابق) إلى مضيف Gateway. يُعد `credentials/oauth.json`
مصدر استيراد قديمًا فقط.
</Note>

## المخرجات والداخليات

الحقول النموذجية في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` عند تمرير `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (إذا اختير Minimax)
- `tools.profile` (تكون تهيئة البيئة المحلية افتراضيًا `"coding"` عندما لا تكون مضبوطة؛ وتُحفظ القيم الصريحة الحالية)
- `gateway.*` (الوضع، الربط، المصادقة، tailscale)
- `session.dmScope` (تضبط التهيئة المحلية هذا افتراضيًا على `per-channel-peer` عندما لا يكون مضبوطًا؛ وتُحفظ القيم الصريحة الحالية)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- قوائم السماح للقنوات (Slack، Discord، Matrix، Microsoft Teams) عندما تختار الاشتراك أثناء المطالبات (تُحل الأسماء إلى معرّفات عند الإمكان)
- `skills.install.nodeManager`
  - يقبل علم `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - لا يزال بإمكان الإعداد اليدوي ضبط `skills.install.nodeManager: "yarn"` لاحقًا.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

يكتب `openclaw agents add` إلى `agents.list[]` و`bindings` الاختيارية.

تُحفظ بيانات اعتماد WhatsApp ضمن `~/.openclaw/credentials/whatsapp/<accountId>/`.
تُخزن الجلسات ضمن `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
تُقدَّم بعض القنوات كـ plugins. عند اختيارها أثناء الإعداد، يطلب منك المعالج
تثبيت plugin (من npm أو مسار محلي) قبل إعداد القناة.
</Note>

استدعاءات RPC لمعالج Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

يمكن للعملاء (تطبيق macOS وControl UI) عرض الخطوات دون إعادة تنفيذ منطق التهيئة.

سلوك إعداد Signal:

- ينزّل أصل الإصدار المناسب
- يخزّنه ضمن `~/.openclaw/tools/signal-cli/<version>/`
- يكتب `channels.signal.cliPath` في الإعداد
- تتطلب إصدارات JVM وجود Java 21
- تُستخدم الإصدارات الأصلية عند توفرها
- يستخدم Windows ‏WSL2 ويتبع تدفق signal-cli الخاص بـ Linux داخل WSL

## مستندات ذات صلة

- مركز التهيئة: [التهيئة (CLI)](/ar/start/wizard)
- الأتمتة والسكربتات: [أتمتة CLI](/ar/start/wizard-cli-automation)
- مرجع الأوامر: [`openclaw onboard`](/ar/cli/onboard)
