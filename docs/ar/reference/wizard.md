---
read_when:
    - البحث عن خطوة إعداد أولي محددة أو علامة محددة
    - أتمتة الإعداد الأولي باستخدام الوضع غير التفاعلي
    - استكشاف أخطاء سلوك الإعداد الأولي وإصلاحها
sidebarTitle: Onboarding Reference
summary: 'المرجع الكامل لإعداد CLI الأولي: كل خطوة وخيار وحقل تكوين'
title: مرجع الإعداد الأولي
x-i18n:
    generated_at: "2026-04-30T08:26:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 412008af223cd14f744a0b553ab82f233eb482ca9991bd418f29b09b33d93de4
    source_path: reference/wizard.md
    workflow: 16
---

هذا هو المرجع الكامل لـ `openclaw onboard`.
للحصول على نظرة عامة عالية المستوى، راجع [التهيئة الأولية (CLI)](/ar/start/wizard).

## تفاصيل التدفق (الوضع المحلي)

<Steps>
  <Step title="Existing config detection">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر **الاحتفاظ / التعديل / إعادة الضبط**.
    - لا تؤدي إعادة تشغيل التهيئة الأولية إلى مسح أي شيء إلا إذا اخترت **إعادة الضبط** صراحةً
      (أو مررت `--reset`).
    - يكون الإعداد الافتراضي لـ CLI `--reset` هو `config+creds+sessions`؛ استخدم `--reset-scope full`
      لإزالة مساحة العمل أيضًا.
    - إذا كان الإعداد غير صالح أو يحتوي على مفاتيح قديمة، يتوقف المعالج ويطلب
      منك تشغيل `openclaw doctor` قبل المتابعة.
    - تستخدم إعادة الضبط `trash` (وليس `rm` أبدًا) وتعرض نطاقات:
      - الإعداد فقط
      - الإعداد + بيانات الاعتماد + الجلسات
      - إعادة ضبط كاملة (تزيل مساحة العمل أيضًا)

  </Step>
  <Step title="Model/Auth">
    - **مفتاح Anthropic API**: يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يحفظه لاستخدام daemon.
    - **مفتاح Anthropic API**: خيار مساعد Anthropic المفضل في التهيئة الأولية/الإعداد.
    - **رمز إعداد Anthropic**: لا يزال متاحًا في التهيئة الأولية/الإعداد، مع أن OpenClaw يفضل الآن إعادة استخدام Claude CLI عندما يكون متاحًا.
    - **اشتراك OpenAI Code (Codex) (OAuth)**: تدفق المتصفح؛ الصق `code#state`.
      - يعيّن `agents.defaults.model` إلى `openai-codex/gpt-5.5` عندما لا يكون النموذج مضبوطًا أو يكون من عائلة OpenAI بالفعل.
    - **اشتراك OpenAI Code (Codex) (إقران الجهاز)**: تدفق إقران عبر المتصفح باستخدام رمز جهاز قصير العمر.
      - يعيّن `agents.defaults.model` إلى `openai-codex/gpt-5.5` عندما لا يكون النموذج مضبوطًا أو يكون من عائلة OpenAI بالفعل.
    - **مفتاح OpenAI API**: يستخدم `OPENAI_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يخزنه في ملفات تعريف المصادقة.
      - يعيّن `agents.defaults.model` إلى `openai/gpt-5.5` عندما لا يكون النموذج مضبوطًا، أو `openai/*`، أو `openai-codex/*`.
    - **مفتاح xAI (Grok) API**: يطلب `XAI_API_KEY` ويضبط xAI كمزود نماذج.
    - **OpenCode**: يطلب `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`، احصل عليه من https://opencode.ai/auth) ويتيح لك اختيار فهرس Zen أو Go.
    - **Ollama**: يعرض أولًا **السحابة + المحلي**، أو **السحابة فقط**، أو **المحلي فقط**. يطلب `Cloud only` قيمة `OLLAMA_API_KEY` ويستخدم `https://ollama.com`؛ أما الأوضاع المدعومة بالمضيف فتطلب عنوان URL الأساسي لـ Ollama، وتكتشف النماذج المتاحة، وتسحب النموذج المحلي المحدد تلقائيًا عند الحاجة؛ ويتحقق `Cloud + Local` أيضًا مما إذا كان مضيف Ollama هذا مسجل الدخول للوصول السحابي.
    - مزيد من التفاصيل: [Ollama](/ar/providers/ollama)
    - **مفتاح API**: يخزن المفتاح لك.
    - **Vercel AI Gateway (وكيل متعدد النماذج)**: يطلب `AI_GATEWAY_API_KEY`.
    - مزيد من التفاصيل: [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: يطلب Account ID وGateway ID و`CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - مزيد من التفاصيل: [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
    - **MiniMax**: يكتب الإعداد تلقائيًا؛ الافتراضي المستضاف هو `MiniMax-M2.7`.
      يستخدم إعداد مفتاح API ‏`minimax/...`، ويستخدم إعداد OAuth
      ‏`minimax-portal/...`.
    - مزيد من التفاصيل: [MiniMax](/ar/providers/minimax)
    - **StepFun**: يكتب الإعداد تلقائيًا لـ StepFun القياسي أو Step Plan على نقاط النهاية في الصين أو عالميًا.
    - يتضمن القياسي حاليًا `step-3.5-flash`، ويتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    - مزيد من التفاصيل: [StepFun](/ar/providers/stepfun)
    - **Synthetic (متوافق مع Anthropic)**: يطلب `SYNTHETIC_API_KEY`.
    - مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic)
    - **Moonshot (Kimi K2)**: يكتب الإعداد تلقائيًا.
    - **Kimi Coding**: يكتب الإعداد تلقائيًا.
    - مزيد من التفاصيل: [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot)
    - **تخطي**: لم تُضبط أي مصادقة بعد.
    - اختر نموذجًا افتراضيًا من الخيارات المكتشفة (أو أدخل المزود/النموذج يدويًا). للحصول على أفضل جودة وتقليل خطر حقن الموجهات، اختر أقوى نموذج من أحدث جيل متاح في مجموعة مزودك.
    - تشغل التهيئة الأولية فحصًا للنموذج وتحذر إذا كان النموذج المضبوط غير معروف أو تنقصه المصادقة.
    - يكون وضع تخزين مفتاح API افتراضيًا قيم ملفات تعريف مصادقة بنص صريح. استخدم `--secret-input-mode ref` لتخزين مراجع مدعومة بمتغيرات البيئة بدلًا من ذلك (على سبيل المثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - توجد ملفات تعريف المصادقة في `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (مفاتيح API + OAuth). يعد `~/.openclaw/credentials/oauth.json` مصدر استيراد قديمًا فقط.
    - مزيد من التفاصيل: [/concepts/oauth](/ar/concepts/oauth)
    <Note>
    نصيحة للخوادم/الأنظمة بلا واجهة رسومية: أكمل OAuth على جهاز يحتوي على متصفح، ثم انسخ
    ملف `auth-profiles.json` الخاص بذلك الوكيل (على سبيل المثال
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو مسار
    `$OPENCLAW_STATE_DIR/...` المطابق) إلى مضيف Gateway. يعد `credentials/oauth.json`
    مصدر استيراد قديمًا فقط.
    </Note>
  </Step>
  <Step title="Workspace">
    - الافتراضي `~/.openclaw/workspace` (قابل للضبط).
    - يجهز ملفات مساحة العمل اللازمة لطقس تمهيد الوكيل.
    - تخطيط مساحة العمل الكامل + دليل النسخ الاحتياطي: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - المنفذ، والربط، ووضع المصادقة، وتعريض tailscale.
    - توصية المصادقة: أبقِ **الرمز** حتى مع loopback لكي يضطر عملاء WS المحليون إلى المصادقة.
    - في وضع الرمز، يعرض الإعداد التفاعلي:
      - **إنشاء/تخزين رمز بنص صريح** (افتراضي)
      - **استخدام SecretRef** (اختياري)
      - يعيد البدء السريع استخدام مراجع SecretRef الموجودة في `gateway.auth.token` عبر مزودي `env` و`file` و`exec` من أجل فحص التهيئة الأولية/تمهيد لوحة المعلومات.
      - إذا كان SecretRef هذا مضبوطًا ولكن لا يمكن حله، تفشل التهيئة الأولية مبكرًا مع رسالة إصلاح واضحة بدلًا من تدهور مصادقة وقت التشغيل بصمت.
    - في وضع كلمة المرور، يدعم الإعداد التفاعلي أيضًا التخزين بنص صريح أو عبر SecretRef.
    - مسار SecretRef للرمز في الوضع غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير بيئة غير فارغ في بيئة عملية التهيئة الأولية.
      - لا يمكن دمجه مع `--gateway-token`.
    - عطّل المصادقة فقط إذا كنت تثق تمامًا بكل عملية محلية.
    - لا تزال ربطات غير loopback تتطلب المصادقة.

  </Step>
  <Step title="Channels">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول QR اختياري.
    - [Telegram](/ar/channels/telegram): رمز البوت.
    - [Discord](/ar/channels/discord): رمز البوت.
    - [Google Chat](/ar/channels/googlechat): ملف JSON لحساب الخدمة + جمهور Webhook.
    - [Mattermost](/ar/channels/mattermost) (plugin): رمز البوت + عنوان URL الأساسي.
    - [Signal](/ar/channels/signal): تثبيت `signal-cli` اختياري + إعداد الحساب.
    - [BlueBubbles](/ar/channels/bluebubbles): **موصى به لـ iMessage**؛ عنوان URL للخادم + كلمة مرور + Webhook.
    - [iMessage](/ar/channels/imessage): مسار CLI القديم `imsg` + وصول قاعدة البيانات.
    - أمان الرسائل المباشرة: الافتراضي هو الإقران. ترسل أول رسالة مباشرة رمزًا؛ وافق عبر `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.

  </Step>
  <Step title="Web search">
    - اختر مزودًا مدعومًا مثل Brave أو DuckDuckGo أو Exa أو Firecrawl أو Gemini أو Grok أو Kimi أو MiniMax Search أو Ollama Web Search أو Perplexity أو SearXNG أو Tavily (أو تخطَّ).
    - يمكن للمزودين المدعومين بـ API استخدام متغيرات البيئة أو الإعدادات الحالية للإعداد السريع؛ أما المزودون بلا مفاتيح فيستخدمون متطلباتهم الخاصة بالمزود بدلًا من ذلك.
    - تخطَّ باستخدام `--skip-search`.
    - اضبط لاحقًا: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - يتطلب جلسة مستخدم مسجل الدخول؛ للأنظمة بلا واجهة، استخدم LaunchDaemon مخصصًا (غير مضمن).
    - Linux (وWindows عبر WSL2): وحدة systemd للمستخدم
      - تحاول التهيئة الأولية تفعيل البقاء عبر `loginctl enable-linger <user>` لكي يظل Gateway قيد التشغيل بعد تسجيل الخروج.
      - قد تطلب sudo (تكتب إلى `/var/lib/systemd/linger`)؛ وتجرب دون sudo أولًا.
    - **اختيار وقت التشغيل:** Node (موصى به؛ مطلوب لـ WhatsApp/Telegram). لا يُوصى بـ Bun.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا بواسطة SecretRef، يتحقق تثبيت daemon منه لكنه لا يحفظ قيم الرمز المحلولة بنص صريح في بيانات تعريف بيئة خدمة المشرف.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef للرمز المضبوط غير محلول، يتم حظر تثبيت daemon مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مضبوطين وكان `gateway.auth.mode` غير مضبوط، يتم حظر تثبيت daemon حتى يضبط الوضع صراحةً.

  </Step>
  <Step title="Health check">
    - يبدأ Gateway (إذا لزم الأمر) ويشغل `openclaw health`.
    - نصيحة: يضيف `openclaw status --deep` فحص صحة Gateway الحي إلى مخرجات الحالة، بما في ذلك فحوص القنوات عند دعمها (يتطلب Gateway قابلًا للوصول).

  </Step>
  <Step title="Skills (recommended)">
    - يقرأ Skills المتاحة ويفحص المتطلبات.
    - يتيح لك اختيار مدير Node: **npm / pnpm** (لا يُوصى بـ bun).
    - يثبت التبعيات الاختيارية (بعضها يستخدم Homebrew على macOS).

  </Step>
  <Step title="Finish">
    - ملخص + خطوات تالية، بما في ذلك تطبيقات iOS/Android/macOS للميزات الإضافية.

  </Step>
</Steps>

<Note>
إذا لم تُكتشف واجهة رسومية، تطبع التهيئة الأولية تعليمات تمرير منفذ SSH لواجهة التحكم بدلًا من فتح متصفح.
إذا كانت أصول واجهة التحكم مفقودة، تحاول التهيئة الأولية بناءها؛ والبديل هو `pnpm ui:build` (يثبت تبعيات الواجهة تلقائيًا).
</Note>

## الوضع غير التفاعلي

استخدم `--non-interactive` لأتمتة التهيئة الأولية أو كتابتها كنص برمجي:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

أضف `--json` للحصول على ملخص قابل للقراءة آليًا.

SecretRef لرمز Gateway في الوضع غير التفاعلي:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` و`--gateway-token-ref-env` متنافيان.

<Note>
لا يعني `--json` الوضع غير التفاعلي. استخدم `--non-interactive` (و`--workspace`) للنصوص البرمجية.
</Note>

توجد أمثلة الأوامر الخاصة بالمزودين في [أتمتة CLI](/ar/start/wizard-cli-automation#provider-specific-examples).
استخدم صفحة المرجع هذه لدلالات الأعلام وترتيب الخطوات.

### إضافة وكيل (غير تفاعلي)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC لمعالج Gateway

يعرض Gateway تدفق التهيئة الأولية عبر RPC (`wizard.start` و`wizard.next` و`wizard.cancel` و`wizard.status`).
يمكن للعملاء (تطبيق macOS، وواجهة التحكم) عرض الخطوات دون إعادة تنفيذ منطق التهيئة الأولية.

## إعداد Signal (signal-cli)

يمكن للتهيئة الأولية تثبيت `signal-cli` من إصدارات GitHub:

- تنزّل أصل الإصدار المناسب.
- تخزنه ضمن `~/.openclaw/tools/signal-cli/<version>/`.
- تكتب `channels.signal.cliPath` إلى إعدادك.

ملاحظات:

- تتطلب إصدارات JVM **Java 21**.
- تُستخدم الإصدارات الأصلية عندما تكون متاحة.
- يستخدم Windows ‏WSL2؛ ويتبع تثبيت signal-cli تدفق Linux داخل WSL.

## ما يكتبه المعالج

الحقول النموذجية في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (إذا تم اختيار Minimax)
- `tools.profile` (تكون الإعدادات الافتراضية للتهيئة المحلية `"coding"` عند عدم ضبطها؛ وتُحفَظ القيم الصريحة الموجودة)
- `gateway.*` (الوضع، الربط، المصادقة، tailscale)
- `session.dmScope` (تفاصيل السلوك: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`، `channels.discord.token`، `channels.matrix.*`، `channels.signal.*`، `channels.imessage.*`
- قوائم السماح للقنوات (Slack/Discord/Matrix/Microsoft Teams) عند اختيارك الاشتراك أثناء المطالبات (تُحل الأسماء إلى معرّفات عندما يكون ذلك ممكنًا).
- `skills.install.nodeManager`
  - يقبل `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - لا يزال بإمكان الإعداد اليدوي استخدام `yarn` عبر ضبط `skills.install.nodeManager` مباشرةً.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

يكتب `openclaw agents add` إلى `agents.list[]` و`bindings` الاختيارية.

توضع بيانات اعتماد WhatsApp ضمن `~/.openclaw/credentials/whatsapp/<accountId>/`.
تُخزَّن الجلسات ضمن `~/.openclaw/agents/<agentId>/sessions/`.

تُسلَّم بعض القنوات باعتبارها plugins. عند اختيار واحدة أثناء الإعداد، ستطالبك التهيئة
بتثبيتها (من npm أو مسار محلي) قبل أن يمكن إعدادها.

## مستندات ذات صلة

- نظرة عامة على التهيئة: [التهيئة (CLI)](/ar/start/wizard)
- تهيئة تطبيق macOS: [التهيئة](/ar/start/onboarding)
- مرجع الإعدادات: [إعداد Gateway](/ar/gateway/configuration)
- المزوّدون: [WhatsApp](/ar/channels/whatsapp)، [Telegram](/ar/channels/telegram)، [Discord](/ar/channels/discord)، [Google Chat](/ar/channels/googlechat)، [Signal](/ar/channels/signal)، [BlueBubbles](/ar/channels/bluebubbles) (iMessage)، [iMessage](/ar/channels/imessage) (قديم)
- Skills: [Skills](/ar/tools/skills)، [إعدادات Skills](/ar/tools/skills-config)
