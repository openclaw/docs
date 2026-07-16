---
read_when:
    - تحتاج إلى سلوك مفصل لخطوة محددة من `openclaw onboard`
    - أنت تصحح أخطاء نتائج الإعداد الأولي أو تدمج عملاء الإعداد الأولي
sidebarTitle: CLI reference
summary: 'السلوك خطوة بخطوة للأمر `openclaw onboard`: ما تفعله كل خطوة، والإعدادات التي تكتبها، والتفاصيل الداخلية'
title: مرجع إعداد CLI
x-i18n:
    generated_at: "2026-07-16T14:55:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96c1469c6b64f08fd9105c8b737df164d39d27d051bbb9bb4f76b9e1e057785d
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

تغطي هذه الصفحة سلوك الإعداد الأولي خطوة بخطوة، ومخرجاته، وتفاصيله الداخلية.
للاطلاع على شرح تفصيلي، راجع [الإعداد الأولي (CLI)](/ar/start/wizard). وللاطلاع على المرجع الكامل لعلامات CLI
(كل `--flag`، وأمثلة الوضع غير التفاعلي، والأوامر الخاصة
بموفري الخدمات)، راجع [`openclaw onboard`](/ar/cli/onboard).

## ما الذي يفعله المعالج

يرشدك الوضع المحلي (الافتراضي) خلال:

- إعداد النموذج والمصادقة (Anthropic، وOAuth لاشتراك OpenAI Code، وxAI، وOpenCode، ونقاط النهاية المخصصة، والمزيد من تدفقات المصادقة التي يملكها موفرو الخدمات)
- موقع مساحة العمل وملفات التمهيد
- إعدادات Gateway (المنفذ، والربط، والمصادقة، وTailscale)
- القنوات وموفرو الخدمات (Discord، وFeishu، وGoogle Chat، وiMessage، وMattermost، وMicrosoft Teams، وQQ Bot، وSignal، وSlack، وTelegram، وWhatsApp، وغيرها من القنوات المضمّنة أو قنوات Plugin)
- موفر بحث الويب (اختياري)
- تثبيت الخدمة الخفية (LaunchAgent، أو وحدة مستخدم systemd، أو مهمة Windows مجدولة أصلية مع الرجوع إلى مجلد Startup)
- فحص السلامة
- إعداد Skills

يهيئ الوضع البعيد هذا الجهاز للاتصال بـ Gateway موجود في مكان آخر. وهو
لا يثبّت أو يعدّل أي شيء على المضيف البعيد.

## تفاصيل التدفق المحلي

<Steps>
  <Step title="اكتشاف الإعدادات الحالية">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر **الاحتفاظ بالقيم الحالية**، أو **المراجعة والتحديث**، أو **إعادة الضبط قبل الإعداد**.
    - لا تؤدي إعادة تشغيل المعالج إلى مسح أي شيء ما لم تختر إعادة الضبط صراحةً (أو تمرر `--reset`).
    - تكون قيمة CLI ‏`--reset` الافتراضية هي `config+creds+sessions`؛ استخدم `--reset-scope full` لإزالة مساحة العمل أيضًا.
    - إذا كانت الإعدادات غير صالحة أو تحتوي على مفاتيح قديمة، يتوقف المعالج ويطلب تشغيل `openclaw doctor` قبل المتابعة.
    - تنقل إعادة الضبط الحالة إلى سلة المهملات (ولا تحذفها مباشرةً أبدًا)، وتوفر النطاقات التالية:
      - الإعدادات فقط
      - الإعدادات + بيانات الاعتماد + الجلسات
      - إعادة ضبط كاملة (تزيل مساحة العمل أيضًا)

  </Step>
  <Step title="النموذج والمصادقة">
    - توجد مصفوفة الخيارات الكاملة في [خيارات المصادقة والنموذج](#auth-and-model-options).

  </Step>
  <Step title="مساحة العمل">
    - القيمة الافتراضية `~/.openclaw/workspace` (قابلة للتهيئة).
    - ينشئ ملفات مساحة العمل اللازمة لتمهيد التشغيل الأول.
    - تخطيط مساحة العمل: [مساحة عمل الوكيل](/ar/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - يطلب المنفذ، والربط، ووضع المصادقة، وإتاحة الوصول عبر Tailscale.
    - موصى به: أبقِ مصادقة الرمز المميز مفعّلة حتى مع الاسترجاع الحلقي، لكي تُلزم عملاء WS المحليين بالمصادقة.
    - في وضع الرمز المميز، يتيح الإعداد التفاعلي:
      - **إنشاء/تخزين رمز مميز بنص صريح** (الافتراضي)
      - **استخدام SecretRef** (اشتراك اختياري)
    - في وضع كلمة المرور، يدعم الإعداد التفاعلي أيضًا التخزين بنص صريح أو باستخدام SecretRef.
    - مسار SecretRef للرمز المميز في الوضع غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير بيئة غير فارغ في بيئة عملية الإعداد الأولي.
      - لا يمكن دمجه مع `--gateway-token`.
    - عطّل المصادقة فقط إذا كنت تثق تمامًا بكل عملية محلية.
    - لا تزال عمليات الربط غير الحلقية تتطلب المصادقة.

  </Step>
  <Step title="القنوات">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول اختياري عبر رمز QR
    - [Telegram](/ar/channels/telegram): رمز البوت المميز
    - [Discord](/ar/channels/discord): رمز البوت المميز
    - [Google Chat](/ar/channels/googlechat): ملف JSON لحساب الخدمة + جمهور Webhook
    - [Mattermost](/ar/channels/mattermost): رمز البوت المميز + عنوان URL الأساسي
    - [Signal](/ar/channels/signal): تثبيت اختياري لـ `signal-cli` + إعدادات الحساب
    - [iMessage](/ar/channels/imessage): مسار CLI ‏`imsg` + الوصول إلى قاعدة بيانات Messages؛ استخدم مغلف SSH عندما يعمل Gateway خارج جهاز Mac
    - أمان الرسائل المباشرة: الإعداد الافتراضي هو الاقتران. ترسل أول رسالة مباشرة رمزًا؛ وافق عليه عبر
      `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.
  </Step>
  <Step title="بحث الويب">
    - اختر موفرًا (Brave، أو DuckDuckGo، أو Exa، أو Firecrawl، أو Gemini، أو Grok، أو Kimi، أو MiniMax Search، أو Ollama Web Search، أو Perplexity، أو SearXNG، أو Tavily) أو تخطَّ هذه الخطوة.
    - تخطَّ هذه الخطوة باستخدام `--skip-search`؛ وأعد تهيئتها لاحقًا باستخدام `openclaw configure --section web`.

  </Step>
  <Step title="تثبيت الخدمة الخفية">
    - macOS: ‏LaunchAgent
      - يتطلب جلسة مستخدم مسجل الدخول؛ وللتشغيل دون واجهة، استخدم LaunchDaemon مخصصًا (غير مضمّن).
    - Linux وWindows عبر WSL2: وحدة مستخدم systemd
      - يحاول المعالج تنفيذ `loginctl enable-linger <user>` لكي يظل Gateway قيد التشغيل بعد تسجيل الخروج.
      - قد يطلب sudo (يكتب إلى `/var/lib/systemd/linger`)؛ ويحاول أولًا دون sudo.
    - Windows الأصلي: المهمة المجدولة أولًا
      - إذا رُفض إنشاء المهمة، يرجع OpenClaw إلى عنصر تسجيل دخول لكل مستخدم في مجلد Startup ويبدأ Gateway فورًا.
      - تظل المهام المجدولة مفضلة لأنها توفر حالة أفضل للمشرف.
    - اختيار بيئة التشغيل: يلزم Node لأن مخزن حالة التشغيل الأساسي في OpenClaw يستخدم `node:sqlite`.

  </Step>
  <Step title="فحص السلامة">
    - يبدأ Gateway (عند الحاجة) ويشغّل `openclaw health`.
    - `openclaw status --deep` يضيف فحص سلامة Gateway المباشر إلى مخرجات الحالة، بما في ذلك فحوصات القنوات عند دعمها.

  </Step>
  <Step title="Skills">
    - يقرأ Skills المتاحة ويتحقق من المتطلبات.
    - يتيح اختيار مدير Node: ‏npm، أو pnpm، أو bun.
    - يثبّت التبعيات الاختيارية لـ Skills المضمّنة الموثوقة عندما يكون
      برنامج التثبيت المطلوب متاحًا.
    - يتخطى برامج تثبيت Homebrew وuv وGo غير المتاحة، ثم يجمع Skills
      المتأثرة مع إرشادات الإعداد اليدوي. شغّل `openclaw doctor` بعد تثبيت
      المتطلبات الأساسية المفقودة.

  </Step>
  <Step title="الإنهاء">
    - ملخص وخطوات تالية، بما في ذلك خيارات تطبيقات iOS وAndroid وmacOS.

  </Step>
</Steps>

<Note>
إذا لم تُكتشف واجهة رسومية، يطبع المعالج تعليمات إعادة توجيه منفذ SSH لواجهة التحكم بدلًا من فتح متصفح.
إذا كانت أصول واجهة التحكم مفقودة، يحاول المعالج بناءها؛ والخيار الاحتياطي هو `pnpm ui:build` (يثبّت تبعيات واجهة المستخدم تلقائيًا).
</Note>

## تفاصيل الوضع البعيد

يهيئ الوضع البعيد هذا الجهاز للاتصال بـ Gateway موجود في مكان آخر. وهو
لا يثبّت أو يعدّل أي شيء على المضيف البعيد.

ما تضبطه:

- عنوان URL لـ Gateway البعيد (`ws://...` أو `wss://...`)
- رمز مميز، أو كلمة مرور، أو دون مصادقة، بما يطابق إعدادات Gateway البعيد

<Steps>
  <Step title="الاكتشاف (اختياري)">
    إذا كان `dns-sd` ‏(macOS) أو `avahi-browse` ‏(Linux) متاحًا، يتيح الإعداد الأولي
    البحث عن إشارات Gateway عبر Bonjour/mDNS قبل الرجوع إلى
    إدخال عنوان URL يدويًا. كما تُجرَّب خدمة اكتشاف DNS-SD واسعة النطاق عند
    تهيئتها. الوثائق: [اكتشاف Gateway](/ar/gateway/discovery)، [Bonjour](/ar/gateway/bonjour).
  </Step>
  <Step title="طريقة الاتصال">
    عند تحديد إشارة، اختر WebSocket مباشرًا أو نفق SSH:
    - **مباشر**: يتصل عبر `wss://` ويطلب الوثوق ببصمة
      TLS المكتشفة (تثبيت الثقة عند أول استخدام؛ لا تُثبّت إلا إذا وافقت).
    - **نفق SSH**: يطبع أمر `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      لتشغيله أولًا، ثم يتصل بنقطة نهاية النفق المحلية.
  </Step>
  <Step title="المصادقة">
    اختر الرمز المميز (موصى به)، أو كلمة المرور، أو عدم استخدام المصادقة، ثم يمكنك اختياريًا تخزينه
    بصفته SecretRef بدلًا من النص الصريح.
  </Step>
</Steps>

<Note>
إذا كان Gateway مقتصرًا على الاسترجاع الحلقي وغير قابل للاكتشاف، فاستخدم نفق SSH أو شبكة tailnet يدويًا.
يُقبل `ws://` بنص صريح للاسترجاع الحلقي، وعناوين IP الخاصة الصريحة، و`.local`، وعناوين URL الخاصة بـ Tailnet ‏`*.ts.net`؛ وتتطلب أسماء DNS الخاصة الأخرى `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`.
</Note>

## خيارات المصادقة والنموذج

إذا فشلت خطوة إعداد موفر خدمة أثناء الإعداد الأولي التفاعلي (مثل خيار إعادة استخدام CLI
من دون تسجيل دخول محلي)، يعرض المعالج الخطأ ويعود إلى منتقي موفر الخدمة
بدلًا من الخروج. وتظل عمليات تشغيل `--auth-choice` الصريحة تفشل سريعًا لأغراض الأتمتة.

<AccordionGroup>
  <Accordion title="مفتاح Anthropic API">
    يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا، أو يطلب مفتاحًا، ثم يحفظه لاستخدام الخدمة الخفية.
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    المسار المحلي المفضل في الإعداد الأولي/التهيئة التفاعلية؛ يعيد استخدام تسجيل دخول Claude CLI حالي عند توفره.
  </Accordion>
  <Accordion title="اشتراك OpenAI Code ‏(OAuth)">
    تدفق عبر المتصفح؛ الصق `code#state`.

    في إعداد جديد دون نموذج أساسي، يضبط `agents.defaults.model` على
    `openai/gpt-5.6-sol` عبر بيئة تشغيل Codex.

  </Accordion>
  <Accordion title="اشتراك OpenAI Code (اقتران الجهاز)">
    تدفق اقتران عبر المتصفح باستخدام رمز جهاز قصير الأجل.

    في إعداد جديد دون نموذج أساسي، يضبط `agents.defaults.model` على
    `openai/gpt-5.6-sol` عبر بيئة تشغيل Codex.

  </Accordion>
  <Accordion title="مفتاح OpenAI API">
    يستخدم `OPENAI_API_KEY` إذا كان موجودًا، أو يطلب مفتاحًا، ثم يخزّن بيانات الاعتماد في ملفات تعريف المصادقة.

    في إعداد جديد دون نموذج أساسي، يضبط `agents.defaults.model` على
    `openai/gpt-5.6`؛ ويُحل معرّف نموذج API المباشر المجرد إلى فئة Sol.

    تحافظ إضافة OpenAI أو إعادة مصادقته على نموذج أساسي صريح حالي،
    بما في ذلك `openai/gpt-5.5`. إذا كان الحساب لا يتيح GPT-5.6،
    فحدد `openai/gpt-5.5` صراحةً؛ ولا يخفض OpenClaw إصداره ضمنيًا.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    تسجيل الدخول عبر المتصفح للحسابات المؤهلة في SuperGrok أو X Premium. هذا هو
    مسار xAI الموصى به لمعظم المستخدمين. يخزّن OpenClaw ملف تعريف المصادقة الناتج
    لنماذج Grok وGrok `web_search` و`x_search` و`code_execution`.
  </Accordion>
  <Accordion title="رمز جهاز xAI (Grok)">
    تسجيل دخول عبر المتصفح ملائم للاتصال عن بُعد باستخدام رمز قصير بدلًا من استدعاء
    رجوع إلى localhost. استخدمه من مضيفات SSH أو Docker أو VPS.
  </Accordion>
  <Accordion title="مفتاح API لـ xAI (Grok)">
    يطلب `XAI_API_KEY` ويضبط xAI بوصفه موفّر نماذج. استخدم هذا
    عندما تريد مفتاح API من xAI Console بدلًا من OAuth الخاص بالاشتراك.
  </Accordion>
  <Accordion title="OpenCode">
    يطلب `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`) ويتيح لك اختيار كتالوج Zen أو Go (يغطي مفتاح API واحد كليهما).
    رابط الإعداد: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="مفتاح API (عام)">
    يخزّن المفتاح نيابةً عنك.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    يطلب `AI_GATEWAY_API_KEY`.
    مزيد من التفاصيل: [Vercel AI Gateway](/ar/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    يطلب معرّف الحساب ومعرّف Gateway و`CLOUDFLARE_AI_GATEWAY_API_KEY`.
    مزيد من التفاصيل: [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    تُكتب الإعدادات تلقائيًا. القيمة الافتراضية للاستضافة هي `MiniMax-M3`؛ ويستخدم الإعداد بمفتاح API
    ‏`minimax/...`، بينما يستخدم إعداد OAuth ‏`minimax-portal/...`.
    مزيد من التفاصيل: [MiniMax](/ar/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    تُكتب الإعدادات تلقائيًا لخدمة StepFun القياسية أو Step Plan على نقاط النهاية الصينية أو العالمية.
    تتضمن الخدمة القياسية حاليًا `step-3.5-flash`، كما تتضمن Step Plan ‏`step-3.5-flash-2603`.
    مزيد من التفاصيل: [StepFun](/ar/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (متوافق مع Anthropic)">
    يطلب `SYNTHETIC_API_KEY`.
    مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (نماذج مفتوحة سحابية ومحلية)">
    يطلب أولًا `Cloud + Local` أو `Cloud only` أو `Local only`.
    يستخدم `Cloud only` ‏`OLLAMA_API_KEY` مع `https://ollama.com`.
    تطلب الأنماط المعتمدة على المضيف عنوان URL الأساسي (القيمة الافتراضية `http://127.0.0.1:11434`)، وتكتشف النماذج المتاحة، وتقترح القيم الافتراضية.
    يتحقق `Cloud + Local` أيضًا مما إذا كان مضيف Ollama هذا مسجّل الدخول للوصول السحابي.
    مزيد من التفاصيل: [Ollama](/ar/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot وKimi Coding">
    تُكتب إعدادات Moonshot ‏(Kimi K2) وKimi Coding تلقائيًا.
    مزيد من التفاصيل: [Moonshot AI ‏(Kimi وKimi Coding)](/ar/providers/moonshot).
  </Accordion>
  <Accordion title="موفّر مخصص">
    يعمل مع نقاط نهاية متوافقة مع OpenAI ومتوافقة مع OpenAI Responses ومتوافقة مع Anthropic.

    يدعم الإعداد التفاعلي خيارات تخزين مفتاح API نفسها التي تدعمها تدفقات مفاتيح API للموفّرين الآخرين:
    - **لصق مفتاح API الآن** (نص صريح)
    - **استخدام مرجع سرّي** (مرجع متغير بيئة أو مرجع موفّر مضبوط، مع تحقق مسبق)

    يستنتج الإعداد دعم الصور لمعرّفات نماذج الرؤية الشائعة (GPT-4o/4.1/5.x وClaude 3/4 وGemini وQwen-VL وLLaVA وPixtral وما شابهها)، ولا يسأل إلا عندما يكون اسم النموذج غير معروف.

    علامات الوضع غير التفاعلي:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (اختياري؛ يعود إلى `CUSTOM_API_KEY`)
    - `--custom-provider-id` (اختياري)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (اختياري؛ القيمة الافتراضية `openai`)
    - `--custom-image-input` / `--custom-text-input` (اختياري؛ يتجاوز قدرة إدخال النموذج المستنتجة)

  </Accordion>
  <Accordion title="تخطي">
    يترك المصادقة دون ضبط.
  </Accordion>
</AccordionGroup>

سلوك النموذج:

- اختر النموذج الافتراضي من الخيارات المكتشفة، أو أدخل الموفّر والنموذج يدويًا.
- عندما يبدأ الإعداد من خيار مصادقة موفّر، يمنح منتقي النماذج الأفضلية
  لذلك الموفّر تلقائيًا. وبالنسبة إلى Volcengine وBytePlus، تطابق الأفضلية نفسها
  أيضًا متغيرات خطط البرمجة الخاصة بهما (`volcengine-plan/*`
  و`byteplus-plan/*`).
- إذا كان مرشح الموفّر المفضّل سيُرجع قائمة فارغة، يعود المنتقي إلى
  الكتالوج الكامل بدلًا من عدم عرض أي نماذج.
- يشغّل المعالج فحصًا للنموذج ويحذّر إذا كان النموذج المضبوط غير معروف أو كانت مصادقته مفقودة.

مسارات بيانات الاعتماد وملفات التعريف:

- ملفات تعريف المصادقة (مفاتيح API وOAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- استيراد OAuth القديم: `~/.openclaw/credentials/oauth.json`

وضع تخزين بيانات الاعتماد:

- يحفظ سلوك الإعداد الافتراضي مفاتيح API كقيم نصية صريحة في ملفات تعريف المصادقة.
- يُفعّل `--secret-input-mode ref` وضع المراجع بدلًا من تخزين المفتاح كنص صريح.
  في الإعداد التفاعلي، يمكنك اختيار أحد الخيارين:
  - مرجع متغير بيئة (مثل `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - مرجع موفّر مضبوط (`file` أو `exec`) مع الاسم المستعار للموفّر ومعرّفه
- يشغّل وضع المراجع التفاعلي تحققًا مسبقًا سريعًا قبل الحفظ.
  - مراجع متغيرات البيئة: يتحقق من اسم المتغير ومن وجود قيمة غير فارغة في بيئة الإعداد الحالية.
  - مراجع الموفّرين: يتحقق من إعدادات الموفّر ويحلّ المعرّف المطلوب.
  - إذا فشل التحقق المسبق، يعرض الإعداد الخطأ ويتيح لك إعادة المحاولة.
- في الوضع غير التفاعلي، لا يعتمد `--secret-input-mode ref` إلا على متغيرات البيئة.
  - عيّن متغير بيئة الموفّر في بيئة عملية الإعداد.
  - تتطلب علامات المفاتيح المضمّنة (مثل `--openai-api-key`) تعيين متغير البيئة ذاك؛ وإلا يفشل الإعداد فورًا.
  - بالنسبة إلى الموفّرين المخصصين، يخزّن وضع `ref` غير التفاعلي القيمة `models.providers.<id>.apiKey` بوصفها `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - في حالة الموفّر المخصص هذه، يتطلب `--custom-api-key` تعيين `CUSTOM_API_KEY`؛ وإلا يفشل الإعداد فورًا.
- تدعم بيانات اعتماد مصادقة Gateway خياري النص الصريح وSecretRef في الإعداد التفاعلي:
  - وضع الرمز المميز: **إنشاء/تخزين رمز مميز كنص صريح** (افتراضي) أو **استخدام SecretRef**.
  - وضع كلمة المرور: نص صريح أو SecretRef.
- مسار SecretRef للرمز المميز في الوضع غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
- تستمر الإعدادات الحالية ذات النص الصريح في العمل دون تغيير.

<Note>
نصيحة للبيئات بلا واجهة رسومية والخوادم: أكمل OAuth على جهاز يحتوي على متصفح، ثم انسخ
ملف `auth-profiles.json` الخاص بذلك الوكيل (مثل
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو مسار
`$OPENCLAW_STATE_DIR/...` المطابق) إلى مضيف Gateway. لا يُستخدم `credentials/oauth.json`
إلا كمصدر استيراد قديم.
</Note>

## المخرجات والتفاصيل الداخلية

الحقول المعتادة في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` عند تمرير `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (إذا اختير Minimax)
- `tools.profile` (يعتمد الإعداد المحلي القيمة الافتراضية `"coding"` عند عدم تعيينها؛ وتُحفظ القيم الصريحة الحالية)
- `gateway.*` (الوضع، الربط، المصادقة، Tailscale)
- `session.dmScope` (يعتمد الإعداد المحلي القيمة الافتراضية `per-channel-peer` لهذا الحقل عند عدم تعيينه؛ وتُحفظ القيم الصريحة الحالية)
- `channels.telegram.botToken`، `channels.discord.token`، `channels.matrix.*`، `channels.signal.*`، `channels.imessage.*`
- قوائم السماح للقنوات (Discord وiMessage وSignal وSlack وTelegram وWhatsApp) عند الاشتراك فيها أثناء المطالبات؛ ويحوّل Discord وSlack أيضًا الأسماء المُدخلة إلى معرّفات
- `skills.install.nodeManager`
  - تقبل العلامة `setup --node-manager` ‏`npm` أو `pnpm` أو `bun`.
  - لا يزال من الممكن ضبط `skills.install.nodeManager: "yarn"` لاحقًا يدويًا في الإعدادات.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

يكتب `openclaw agents add` ‏`agents.list[]` و`bindings` الاختياري.

تُخزّن بيانات اعتماد WhatsApp ضمن `~/.openclaw/credentials/whatsapp/<accountId>/`.
تُخزّن الجلسات النشطة والنصوص المفرّغة في
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. ويُستخدم
دليل `~/.openclaw/agents/<agentId>/sessions/` لمدخلات الترحيل القديمة
وعناصر الأرشفة/الدعم.

<Note>
تُقدَّم بعض القنوات على هيئة plugins. عند اختيارها أثناء الإعداد، يطلب المعالج
تثبيت plugin (من npm أو مسار محلي) قبل ضبط القناة.
</Note>

## الإعداد غير التفاعلي

يتطلب `--non-interactive` ‏`--accept-risk` (إقرارًا بأن الوكلاء
أقوياء وأن الوصول الكامل إلى النظام ينطوي على مخاطر):

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

مرجع العلامات الكامل وأمثلة خاصة بالموفّرين: [`openclaw onboard`](/ar/cli/onboard)، [أتمتة CLI](/ar/start/wizard-cli-automation).

## RPC لمعالج Gateway

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

يمكن للعملاء (تطبيق macOS وواجهة Control UI) عرض الخطوات دون إعادة تنفيذ منطق الإعداد.

## سلوك إعداد Signal

- ينزّل أصل الإصدار المناسب من إصدارات GitHub الرسمية لـ `signal-cli` (بنية أصلية، لنظام Linux ‏x86-64 فقط)
- على الأنظمة الأساسية الأخرى (macOS وLinux غير x64)، يثبّت عبر Homebrew بدلًا من ذلك
- يخزّن تثبيت أصل الإصدار ضمن `~/.openclaw/tools/signal-cli/<version>/`
- يكتب `channels.signal.cliPath` في الإعدادات
- نظام Windows الأصلي غير مدعوم بعد؛ شغّل الإعداد داخل WSL2 للحصول على مسار تثبيت Linux

## مستندات ذات صلة

- مركز الإعداد: [الإعداد (CLI)](/ar/start/wizard)
- الأتمتة والبرامج النصية: [أتمتة CLI](/ar/start/wizard-cli-automation)
- مرجع الأوامر: [`openclaw onboard`](/ar/cli/onboard)
