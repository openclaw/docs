---
read_when:
    - تحتاج إلى سلوك مفصل للأمر openclaw onboard
    - أنت تستكشف أخطاء نتائج الإعداد الأولي أو تدمج عملاء الإعداد الأولي
sidebarTitle: CLI reference
summary: مرجع كامل لتدفق إعداد CLI، وإعداد المصادقة/النموذج، والمخرجات، والتفاصيل الداخلية
title: مرجع إعداد CLI
x-i18n:
    generated_at: "2026-05-10T20:02:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9166e8763c1ee1884817a9625a035b7efa1a97a1d4d4e4dffc1926675b1d3214
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

هذه الصفحة هي المرجع الكامل لـ `openclaw onboard`.
للدليل المختصر، راجع [التهيئة الأولية (CLI)](/ar/start/wizard).

## ما الذي يفعله المعالج

يرشدك الوضع المحلي (الافتراضي) عبر:

- إعداد النموذج والمصادقة (OpenAI Code subscription OAuth، أو Anthropic Claude CLI أو مفتاح API، إضافة إلى خيارات MiniMax وGLM وOllama وMoonshot وStepFun وAI Gateway)
- موقع مساحة العمل وملفات التمهيد
- إعدادات Gateway (المنفذ، والربط، والمصادقة، وTailscale)
- القنوات والمزوّدون (Telegram وWhatsApp وDiscord وGoogle Chat وMattermost وSignal وiMessage وPlugins القنوات المضمّنة الأخرى)
- تثبيت الخدمة الخفية (LaunchAgent، أو وحدة مستخدم systemd، أو Windows Scheduled Task الأصلي مع رجوع احتياطي إلى مجلد Startup)
- فحص الصحة
- إعداد Skills

يضبط الوضع البعيد هذا الجهاز للاتصال بـ Gateway في مكان آخر.
لا يثبّت أو يعدّل أي شيء على المضيف البعيد.

## تفاصيل التدفق المحلي

<Steps>
  <Step title="اكتشاف الإعدادات الموجودة">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر إبقاء أو تعديل أو إعادة تعيين.
    - لا تؤدي إعادة تشغيل المعالج إلى مسح أي شيء ما لم تختر صراحة إعادة تعيين (أو تمرّر `--reset`).
    - الخيار `--reset` في CLI يكون افتراضيًا على `config+creds+sessions`؛ استخدم `--reset-scope full` لإزالة مساحة العمل أيضًا.
    - إذا كانت الإعدادات غير صالحة أو تحتوي على مفاتيح قديمة، يتوقف المعالج ويطلب منك تشغيل `openclaw doctor` قبل المتابعة.
    - تستخدم إعادة التعيين `trash` وتعرض النطاقات:
      - الإعدادات فقط
      - الإعدادات + بيانات الاعتماد + الجلسات
      - إعادة تعيين كاملة (تزيل مساحة العمل أيضًا)

  </Step>
  <Step title="النموذج والمصادقة">
    - مصفوفة الخيارات الكاملة في [خيارات المصادقة والنماذج](#auth-and-model-options).

  </Step>
  <Step title="مساحة العمل">
    - الافتراضي `~/.openclaw/workspace` (قابل للضبط).
    - يزرع ملفات مساحة العمل اللازمة لطقس التمهيد عند التشغيل الأول.
    - تخطيط مساحة العمل: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - يطلب المنفذ، والربط، ووضع المصادقة، وتعريض Tailscale.
    - موصى به: أبقِ مصادقة الرمز مفعّلة حتى مع loopback بحيث يجب على عملاء WS المحليين المصادقة.
    - في وضع الرمز، يعرض الإعداد التفاعلي:
      - **إنشاء/تخزين رمز بنص صريح** (افتراضي)
      - **استخدام SecretRef** (اختياري)
    - في وضع كلمة المرور، يدعم الإعداد التفاعلي أيضًا التخزين بنص صريح أو SecretRef.
    - مسار SecretRef للرمز في الوضع غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير بيئة غير فارغ في بيئة عملية التهيئة الأولية.
      - لا يمكن دمجه مع `--gateway-token`.
    - عطّل المصادقة فقط إذا كنت تثق تمامًا بكل عملية محلية.
    - ما زالت ربطات غير loopback تتطلب المصادقة.

  </Step>
  <Step title="القنوات">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول QR اختياري
    - [Telegram](/ar/channels/telegram): رمز bot
    - [Discord](/ar/channels/discord): رمز bot
    - [Google Chat](/ar/channels/googlechat): ملف JSON لحساب خدمة + جمهور Webhook
    - [Mattermost](/ar/channels/mattermost): رمز bot + عنوان URL أساسي
    - [Signal](/ar/channels/signal): تثبيت `signal-cli` اختياري + إعدادات الحساب
    - [iMessage](/ar/channels/imessage): مسار `imsg` CLI + وصول إلى قاعدة بيانات Messages؛ استخدم غلاف SSH عندما يعمل Gateway خارج Mac
    - أمان الرسائل المباشرة: الافتراضي هو الاقتران. ترسل أول رسالة مباشرة رمزًا؛ وافق عبر
      `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.
  </Step>
  <Step title="تثبيت الخدمة الخفية">
    - macOS: LaunchAgent
      - يتطلب جلسة مستخدم مسجّل الدخول؛ للاستخدام بلا شاشة، استخدم LaunchDaemon مخصصًا (غير مضمّن).
    - Linux وWindows عبر WSL2: وحدة مستخدم systemd
      - يحاول المعالج `loginctl enable-linger <user>` حتى يبقى Gateway قيد التشغيل بعد تسجيل الخروج.
      - قد يطلب sudo (يكتب إلى `/var/lib/systemd/linger`)؛ يحاول أولًا من دون sudo.
    - Windows الأصلي: Scheduled Task أولًا
      - إذا رُفض إنشاء المهمة، يرجع OpenClaw إلى عنصر تسجيل دخول لكل مستخدم في مجلد Startup ويبدأ Gateway فورًا.
      - تبقى Scheduled Tasks مفضلة لأنها توفر حالة مشرف أفضل.
    - اختيار وقت التشغيل: Node (موصى به؛ مطلوب لـ WhatsApp وTelegram). لا يُنصح بـ Bun.

  </Step>
  <Step title="فحص الصحة">
    - يبدأ Gateway (إذا لزم) ويشغّل `openclaw health`.
    - يضيف `openclaw status --deep` مسبار صحة Gateway الحي إلى مخرجات الحالة، بما في ذلك مسابير القنوات عندما تكون مدعومة.

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
إذا كانت أصول Control UI مفقودة، يحاول المعالج بناءها؛ والرجوع الاحتياطي هو `pnpm ui:build` (يثبّت اعتماديات واجهة المستخدم تلقائيًا).
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
- إذا كان Gateway مقتصرًا على loopback فقط، فاستخدم نفق SSH أو tailnet.
- تلميحات الاكتشاف:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## خيارات المصادقة والنماذج

<AccordionGroup>
  <Accordion title="مفتاح Anthropic API">
    يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يحفظه لاستخدام الخدمة الخفية.
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    تدفق المتصفح؛ الصق `code#state`.

    يضبط `agents.defaults.model` على `openai/gpt-5.5` عبر وقت تشغيل Codex عندما يكون النموذج غير مضبوط أو من عائلة OpenAI بالفعل.

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    تدفق اقتران المتصفح مع رمز جهاز قصير العمر.

    يضبط `agents.defaults.model` على `openai/gpt-5.5` عبر وقت تشغيل Codex عندما يكون النموذج غير مضبوط أو من عائلة OpenAI بالفعل.

  </Accordion>
  <Accordion title="مفتاح OpenAI API">
    يستخدم `OPENAI_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يخزّن بيانات الاعتماد في ملفات تعريف المصادقة.

    يضبط `agents.defaults.model` على `openai/gpt-5.5` عندما يكون النموذج غير مضبوط، أو `openai/*`، أو `openai-codex/*`.

  </Accordion>
  <Accordion title="مفتاح xAI (Grok) API">
    يطلب `XAI_API_KEY` ويضبط xAI كمزوّد نماذج.
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
    تُكتب الإعدادات تلقائيًا. الافتراضي المستضاف هو `MiniMax-M2.7`؛ يستخدم إعداد مفتاح API
    `minimax/...`، ويستخدم إعداد OAuth `minimax-portal/...`.
    مزيد من التفاصيل: [MiniMax](/ar/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    تُكتب الإعدادات تلقائيًا لـ StepFun standard أو Step Plan على نقاط النهاية في الصين أو العالمية.
    يتضمن Standard حاليًا `step-3.5-flash`، ويتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    مزيد من التفاصيل: [StepFun](/ar/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (متوافق مع Anthropic)">
    يطلب `SYNTHETIC_API_KEY`.
    مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (نماذج مفتوحة سحابية ومحلية)">
    يطلب أولًا `Cloud + Local` أو `Cloud only` أو `Local only`.
    يستخدم `Cloud only` المفتاح `OLLAMA_API_KEY` مع `https://ollama.com`.
    تطلب الأوضاع المدعومة بمضيف عنوان URL الأساسي (الافتراضي `http://127.0.0.1:11434`)، وتكتشف النماذج المتاحة، وتقترح افتراضيات.
    يفحص `Cloud + Local` أيضًا ما إذا كان مضيف Ollama هذا مسجل الدخول للوصول السحابي.
    مزيد من التفاصيل: [Ollama](/ar/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot وKimi Coding">
    تُكتب إعدادات Moonshot (Kimi K2) وKimi Coding تلقائيًا.
    مزيد من التفاصيل: [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot).
  </Accordion>
  <Accordion title="مزوّد مخصص">
    يعمل مع نقاط النهاية المتوافقة مع OpenAI والمتوافقة مع Anthropic.

    تدعم التهيئة الأولية التفاعلية خيارات تخزين مفتاح API نفسها مثل تدفقات مفاتيح API لمزوّدين آخرين:
    - **لصق مفتاح API الآن** (نص صريح)
    - **استخدام مرجع سرّي** (مرجع env أو مرجع مزوّد مضبوط، مع تحقق تمهيدي)

    علامات الوضع غير التفاعلي:
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

- اختر النموذج الافتراضي من الخيارات المكتشفة، أو أدخل المزوّد والنموذج يدويًا.
- تستنتج التهيئة الأولية للمزوّد المخصص دعم الصور لمعرّفات النماذج الشائعة ولا تسأل إلا عندما يكون اسم النموذج غير معروف.
- عندما تبدأ التهيئة الأولية من اختيار مصادقة مزوّد، يفضّل منتقي النماذج
  ذلك المزوّد تلقائيًا. بالنسبة إلى Volcengine وBytePlus، يطابق التفضيل نفسه
  أيضًا متغيرات خطط البرمجة الخاصة بهما (`volcengine-plan/*`,
  `byteplus-plan/*`).
- إذا كان مرشح المزوّد المفضّل هذا سيكون فارغًا، يرجع المنتقي إلى
  الكتالوج الكامل بدلًا من عدم إظهار أي نماذج.
- يشغّل المعالج فحصًا للنموذج ويحذّر إذا كان النموذج المضبوط غير معروف أو تنقصه المصادقة.

مسارات بيانات الاعتماد وملفات التعريف:

- ملفات تعريف المصادقة (مفاتيح API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- استيراد OAuth القديم: `~/.openclaw/credentials/oauth.json`

وضع تخزين بيانات الاعتماد:

- يحفظ سلوك التهيئة الأولية الافتراضي مفاتيح API كقيم نصية صريحة في ملفات تعريف المصادقة.
- يفعّل `--secret-input-mode ref` وضع المراجع بدلًا من تخزين المفتاح بنص صريح.
  في الإعداد التفاعلي، يمكنك اختيار أحد الخيارين:
  - مرجع متغير بيئة (مثلًا `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - مرجع مزوّد مضبوط (`file` أو `exec`) مع اسم مستعار للمزوّد + المعرّف
- يشغّل وضع المراجع التفاعلي تحققًا تمهيديًا سريعًا قبل الحفظ.
  - مراجع env: تتحقق من اسم المتغير + قيمة غير فارغة في بيئة التهيئة الأولية الحالية.
  - مراجع المزوّد: تتحقق من إعدادات المزوّد وتحلّ المعرّف المطلوب.
  - إذا فشل التحقق التمهيدي، تعرض التهيئة الأولية الخطأ وتتيح لك إعادة المحاولة.
- في الوضع غير التفاعلي، يكون `--secret-input-mode ref` مدعومًا بـ env فقط.
  - اضبط متغير بيئة المزوّد في بيئة عملية التهيئة الأولية.
  - تتطلب علامات المفاتيح المضمّنة (مثل `--openai-api-key`) ضبط متغير البيئة ذاك؛ وإلا تفشل التهيئة الأولية بسرعة.
  - بالنسبة إلى المزوّدين المخصصين، يخزّن وضع `ref` غير التفاعلي `models.providers.<id>.apiKey` كـ `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - في حالة المزوّد المخصص هذه، يتطلب `--custom-api-key` ضبط `CUSTOM_API_KEY`؛ وإلا تفشل التهيئة الأولية بسرعة.
- تدعم بيانات اعتماد مصادقة Gateway خيارات النص الصريح وSecretRef في الإعداد التفاعلي:
  - وضع الرمز: **إنشاء/تخزين رمز بنص صريح** (افتراضي) أو **استخدام SecretRef**.
  - وضع كلمة المرور: نص صريح أو SecretRef.
- مسار SecretRef للرمز في الوضع غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
- تستمر إعدادات النص الصريح الموجودة في العمل من دون تغيير.

<Note>
نصيحة للوضع بلا واجهة وللخوادم: أكمل OAuth على جهاز يحتوي على متصفح، ثم انسخ
ملف `auth-profiles.json` لذلك الوكيل (على سبيل المثال
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو المسار المطابق
`$OPENCLAW_STATE_DIR/...`) إلى مضيف Gateway. يُعد `credentials/oauth.json`
مصدر استيراد قديمًا فقط.
</Note>

## المخرجات والتفاصيل الداخلية

الحقول المعتادة في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` عندما يُمرَّر `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (إذا تم اختيار Minimax)
- `tools.profile` (تكون القيمة الافتراضية للإعداد المحلي `"coding"` عند عدم ضبطها؛ وتُحفظ القيم الصريحة الموجودة)
- `gateway.*` (الوضع، الربط، المصادقة، tailscale)
- `session.dmScope` (يضبط الإعداد المحلي هذه القيمة افتراضيًا على `per-channel-peer` عند عدم ضبطها؛ وتُحفظ القيم الصريحة الموجودة)
- `channels.telegram.botToken`، `channels.discord.token`، `channels.matrix.*`، `channels.signal.*`، `channels.imessage.*`
- قوائم السماح للقنوات (Slack، Discord، Matrix، Microsoft Teams) عند الاشتراك أثناء المطالبات (تُحل الأسماء إلى معرّفات عندما يكون ذلك ممكنًا)
- `skills.install.nodeManager`
  - يقبل علم `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - لا يزال بإمكان الضبط اليدوي تعيين `skills.install.nodeManager: "yarn"` لاحقًا.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

يكتب `openclaw agents add` إلى `agents.list[]` و`bindings` اختيارية.

توجد بيانات اعتماد WhatsApp ضمن `~/.openclaw/credentials/whatsapp/<accountId>/`.
تُخزَّن الجلسات ضمن `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
تُقدَّم بعض القنوات على هيئة plugins. عند اختيارها أثناء الإعداد، يطالبك المعالج
بتثبيت Plugin (من npm أو مسار محلي) قبل ضبط القناة.
</Note>

استدعاء RPC لمعالج Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

يمكن للعملاء (تطبيق macOS وواجهة Control UI) عرض الخطوات دون إعادة تنفيذ منطق الإعداد الأولي.

سلوك إعداد Signal:

- ينزّل أصل الإصدار المناسب
- يخزّنه ضمن `~/.openclaw/tools/signal-cli/<version>/`
- يكتب `channels.signal.cliPath` في الإعدادات
- تتطلب إصدارات JVM Java 21
- تُستخدم الإصدارات الأصلية عند توفرها
- يستخدم Windows ‏WSL2 ويتبع تدفق signal-cli الخاص بـ Linux داخل WSL

## مستندات ذات صلة

- مركز الإعداد الأولي: [الإعداد الأولي (CLI)](/ar/start/wizard)
- الأتمتة والسكربتات: [أتمتة CLI](/ar/start/wizard-cli-automation)
- مرجع الأوامر: [`openclaw onboard`](/ar/cli/onboard)
