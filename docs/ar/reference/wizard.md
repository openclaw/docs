---
read_when:
    - البحث عن خطوة إعداد أولي أو علم محدد
    - أتمتة الإعداد الأولي باستخدام الوضع غير التفاعلي
    - تصحيح أخطاء سلوك الإعداد الأولي
sidebarTitle: Onboarding Reference
summary: 'المرجع الكامل للإعداد الأولي عبر CLI: كل خطوة وخيار وحقل تكوين'
title: مرجع الإعداد الأولي
x-i18n:
    generated_at: "2026-06-27T18:35:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 739048d53983febc32adaeab10225a288ae66752bee70cfea500d1664fd8546b
    source_path: reference/wizard.md
    workflow: 16
---

هذا هو المرجع الكامل للأمر `openclaw onboard`.
للاطلاع على نظرة عامة عالية المستوى، راجع [الإعداد الأولي (CLI)](/ar/start/wizard).

## تفاصيل التدفق (الوضع المحلي)

<Steps>
  <Step title="Existing config detection">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر **الاحتفاظ بالقيم الحالية**، أو **المراجعة والتحديث**، أو **إعادة الضبط قبل الإعداد**.
    - لا تؤدي إعادة تشغيل الإعداد الأولي إلى مسح أي شيء إلا إذا اخترت **إعادة الضبط** صراحةً
      (أو مررت `--reset`).
    - الخيار `--reset` في CLI يستخدم `config+creds+sessions` افتراضيًا؛ استخدم `--reset-scope full`
      لإزالة مساحة العمل أيضًا.
    - إذا كان التكوين غير صالح أو يحتوي على مفاتيح قديمة، يتوقف المعالج ويطلب
      منك تشغيل `openclaw doctor` قبل المتابعة.
    - تستخدم إعادة الضبط `trash` (وليس `rm` مطلقًا) وتعرض نطاقات:
      - التكوين فقط
      - التكوين + بيانات الاعتماد + الجلسات
      - إعادة ضبط كاملة (تزيل مساحة العمل أيضًا)

  </Step>
  <Step title="Model/Auth">
    - **مفتاح Anthropic API**: يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يحفظه لاستخدام الخدمة الخلفية.
    - **مفتاح Anthropic API**: خيار مساعد Anthropic المفضل في الإعداد الأولي/التكوين.
    - **رمز إعداد Anthropic**: لا يزال متاحًا في الإعداد الأولي/التكوين، مع أن OpenClaw يفضل الآن إعادة استخدام Claude CLI عند توفره.
    - **اشتراك OpenAI Code (Codex) (OAuth)**: تدفق عبر المتصفح؛ الصق `code#state`.
      - يضبط `agents.defaults.model` على `openai/gpt-5.5` عبر وقت تشغيل Codex عندما لا يكون النموذج مضبوطًا أو يكون بالفعل من عائلة OpenAI.
    - **اشتراك OpenAI Code (Codex) (إقران الجهاز)**: تدفق إقران عبر المتصفح باستخدام رمز جهاز قصير العمر.
      - يضبط `agents.defaults.model` على `openai/gpt-5.5` عبر وقت تشغيل Codex عندما لا يكون النموذج مضبوطًا أو يكون بالفعل من عائلة OpenAI.
    - **مفتاح OpenAI API**: يستخدم `OPENAI_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يخزنه في ملفات تعريف المصادقة.
      - يضبط `agents.defaults.model` على `openai/gpt-5.5` عندما لا يكون النموذج مضبوطًا، أو يكون `openai/*`، أو مراجع نماذج Codex قديمة.
    - **xAI (Grok) OAuth / مفتاح API**: يسجل الدخول باستخدام xAI OAuth عند اختياره، أو يطلب `XAI_API_KEY` في مسار مفتاح API، ويكوّن xAI كموفر نماذج.
    - **OpenCode**: يطلب `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`، احصل عليه من https://opencode.ai/auth) ويتيح لك اختيار كتالوج Zen أو Go.
    - **Ollama**: يعرض أولًا **السحابة + المحلي**، أو **السحابة فقط**، أو **المحلي فقط**. يطلب `Cloud only` قيمة `OLLAMA_API_KEY` ويستخدم `https://ollama.com`؛ أما الأوضاع المدعومة بالمضيف فتطلب عنوان URL الأساسي لـ Ollama، وتكتشف النماذج المتاحة، وتسحب النموذج المحلي المحدد تلقائيًا عند الحاجة؛ كما يتحقق `Cloud + Local` مما إذا كان مضيف Ollama ذلك مسجل الدخول للوصول السحابي.
    - مزيد من التفاصيل: [Ollama](/ar/providers/ollama)
    - **مفتاح API**: يخزن المفتاح لك.
    - **Vercel AI Gateway (وكيل متعدد النماذج)**: يطلب `AI_GATEWAY_API_KEY`.
    - مزيد من التفاصيل: [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: يطلب معرّف الحساب، ومعرّف Gateway، و`CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - مزيد من التفاصيل: [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
    - **MiniMax**: تتم كتابة التكوين تلقائيًا؛ الافتراضي المستضاف هو `MiniMax-M3`.
      يستخدم إعداد مفتاح API ‏`minimax/...`، ويستخدم إعداد OAuth
      ‏`minimax-portal/...`.
    - مزيد من التفاصيل: [MiniMax](/ar/providers/minimax)
    - **StepFun**: تتم كتابة التكوين تلقائيًا لـ StepFun القياسي أو Step Plan على نقاط النهاية الصينية أو العالمية.
    - يتضمن القياسي حاليًا `step-3.5-flash`، كما يتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    - مزيد من التفاصيل: [StepFun](/ar/providers/stepfun)
    - **Synthetic (متوافق مع Anthropic)**: يطلب `SYNTHETIC_API_KEY`.
    - مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic)
    - **Moonshot (Kimi K2)**: تتم كتابة التكوين تلقائيًا.
    - **Kimi Coding**: تتم كتابة التكوين تلقائيًا.
    - مزيد من التفاصيل: [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot)
    - **تخطي**: لم يتم تكوين أي مصادقة بعد.
    - اختر نموذجًا افتراضيًا من الخيارات المكتشفة (أو أدخل الموفر/النموذج يدويًا). للحصول على أفضل جودة وتقليل خطر حقن الموجهات، اختر أقوى نموذج من أحدث جيل متاح في مجموعة موفريك.
    - يجري الإعداد الأولي فحصًا للنموذج ويحذر إذا كان النموذج المكوّن غير معروف أو تنقصه المصادقة.
    - الوضع الافتراضي لتخزين مفاتيح API هو قيم ملف تعريف مصادقة بنص عادي. استخدم `--secret-input-mode ref` لتخزين مراجع مدعومة بمتغيرات البيئة بدلًا من ذلك (مثل `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - توجد ملفات تعريف المصادقة في `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (مفاتيح API + OAuth). الملف `~/.openclaw/credentials/oauth.json` قديم ومخصص للاستيراد فقط.
    - مزيد من التفاصيل: [/concepts/oauth](/ar/concepts/oauth)
    <Note>
    نصيحة للخوادم/البيئات بلا واجهة رسومية: أكمل OAuth على جهاز يحتوي على متصفح، ثم انسخ
    `auth-profiles.json` الخاص بذلك العميل (مثل
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو مسار
    `$OPENCLAW_STATE_DIR/...` المطابق) إلى مضيف Gateway. `credentials/oauth.json`
    هو مصدر استيراد قديم فقط.
    </Note>
  </Step>
  <Step title="Workspace">
    - الافتراضي `~/.openclaw/workspace` (قابل للتكوين).
    - يزرع ملفات مساحة العمل اللازمة لطقس تمهيد العميل.
    - تخطيط مساحة العمل الكامل + دليل النسخ الاحتياطي: [مساحة عمل العميل](/ar/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - المنفذ، والربط، ووضع المصادقة، والتعرض عبر Tailscale.
    - توصية المصادقة: أبقِ **الرمز المميز** حتى مع loopback بحيث يجب على عملاء WS المحليين المصادقة.
    - في وضع الرمز المميز، يعرض الإعداد التفاعلي:
      - **إنشاء/تخزين رمز مميز بنص عادي** (افتراضي)
      - **استخدام SecretRef** (اختياري)
      - يعيد البدء السريع استخدام SecretRefs الحالية في `gateway.auth.token` عبر موفري `env` و`file` و`exec` لتمهيد مسبار الإعداد الأولي/لوحة التحكم.
      - إذا كان SecretRef ذلك مكوّنًا ولكن لا يمكن حله، يفشل الإعداد الأولي مبكرًا برسالة إصلاح واضحة بدلًا من خفض مصادقة وقت التشغيل بصمت.
    - في وضع كلمة المرور، يدعم الإعداد التفاعلي أيضًا التخزين بنص عادي أو SecretRef.
    - مسار SecretRef غير التفاعلي للرمز المميز: `--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير بيئة غير فارغ في بيئة عملية الإعداد الأولي.
      - لا يمكن دمجه مع `--gateway-token`.
    - عطّل المصادقة فقط إذا كنت تثق تمامًا بكل عملية محلية.
    - لا تزال روابط غير loopback تتطلب المصادقة.

  </Step>
  <Step title="Channels">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول QR اختياري.
    - [Telegram](/ar/channels/telegram): رمز البوت.
    - [Discord](/ar/channels/discord): رمز البوت.
    - [Google Chat](/ar/channels/googlechat): JSON لحساب خدمة + جمهور Webhook.
    - [Mattermost](/ar/channels/mattermost) (Plugin): رمز البوت + عنوان URL الأساسي.
    - [Signal](/ar/channels/signal): تثبيت اختياري لـ `signal-cli` + تكوين الحساب.
    - [iMessage](/ar/channels/imessage): مسار `imsg` في CLI + الوصول إلى قاعدة بيانات Messages؛ استخدم مغلف SSH عندما يعمل Gateway خارج Mac.
    - أمان الرسائل المباشرة: الافتراضي هو الإقران. ترسل أول رسالة مباشرة رمزًا؛ وافق عبر `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.

  </Step>
  <Step title="Web search">
    - اختر موفرًا مدعومًا مثل Brave أو DuckDuckGo أو Exa أو Firecrawl أو Gemini أو Grok أو Kimi أو MiniMax Search أو Ollama Web Search أو Perplexity أو SearXNG أو Tavily (أو تخطَّ).
    - يمكن للموفرين المدعومين بـ API استخدام متغيرات البيئة أو التكوين الحالي للإعداد السريع؛ أما الموفرون بلا مفاتيح فيستخدمون متطلباتهم الخاصة بدلًا من ذلك.
    - تخطَّ باستخدام `--skip-search`.
    - كوّن لاحقًا: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - يتطلب جلسة مستخدم مسجل الدخول؛ للبيئات بلا واجهة، استخدم LaunchDaemon مخصصًا (غير مشحون).
    - Linux (وWindows عبر WSL2): وحدة systemd للمستخدم
      - يحاول الإعداد الأولي تمكين البقاء عبر `loginctl enable-linger <user>` بحيث يبقى Gateway عاملًا بعد تسجيل الخروج.
      - قد يطلب sudo (يكتب إلى `/var/lib/systemd/linger`)؛ يحاول أولًا من دون sudo.
    - **اختيار وقت التشغيل:** Node (موصى به؛ مطلوب لـ WhatsApp/Telegram). Bun **غير موصى به**.
    - إذا كانت مصادقة الرمز المميز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا بواسطة SecretRef، يتحقق تثبيت الخدمة الخلفية منه لكنه لا يحفظ قيم الرمز المميز المحلولة بنص عادي في بيانات تعريف بيئة خدمة المشرف.
    - إذا كانت مصادقة الرمز المميز تتطلب رمزًا وكان SecretRef المكوّن للرمز غير محلول، يتم حظر تثبيت الخدمة الخلفية مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير مضبوط، يتم حظر تثبيت الخدمة الخلفية حتى يتم ضبط الوضع صراحةً.

  </Step>
  <Step title="Health check">
    - يبدأ Gateway (إذا لزم الأمر) ويشغّل `openclaw health`.
    - نصيحة: يضيف `openclaw status --deep` مسبار صحة Gateway الحي إلى مخرجات الحالة، بما في ذلك مسابر القنوات عند دعمها (يتطلب Gateway قابلًا للوصول).

  </Step>
  <Step title="Skills (recommended)">
    - يقرأ Skills المتاحة ويتحقق من المتطلبات.
    - يتيح لك اختيار مدير Node: **npm / pnpm** (bun غير موصى به).
    - يثبت التبعيات الاختيارية (يستخدم بعضها Homebrew على macOS).

  </Step>
  <Step title="Finish">
    - ملخص + الخطوات التالية، بما في ذلك مطالبة **كيف تريد تفريخ عميلك؟** لـ Terminal أو Browser أو لاحقًا.

  </Step>
</Steps>

<Note>
إذا لم يتم اكتشاف واجهة رسومية، يطبع الإعداد الأولي تعليمات إعادة توجيه منفذ SSH لواجهة Control UI بدلًا من فتح متصفح.
إذا كانت أصول Control UI مفقودة، يحاول الإعداد الأولي بناءها؛ ويكون البديل `pnpm ui:build` (يثبت تبعيات UI تلقائيًا).
</Note>

## الوضع غير التفاعلي

استخدم `--non-interactive` لأتمتة الإعداد الأولي أو كتابته كسكربت:

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

رمز Gateway المميز SecretRef في الوضع غير التفاعلي:

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
لا يعني `--json` الوضع غير التفاعلي. استخدم `--non-interactive` (و`--workspace`) للسكربتات.
</Note>

توجد أمثلة أوامر خاصة بالموفرين في [أتمتة CLI](/ar/start/wizard-cli-automation#provider-specific-examples).
استخدم صفحة المرجع هذه لدلالات الأعلام وترتيب الخطوات.

### إضافة عميل (غير تفاعلي)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC لمعالج Gateway

يعرض Gateway تدفق الإعداد الأولي عبر RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
يمكن للعملاء (تطبيق macOS، وControl UI) عرض الخطوات من دون إعادة تنفيذ منطق الإعداد الأولي.

## إعداد Signal (signal-cli)

يمكن للإعداد الأولي تثبيت `signal-cli` من إصدارات GitHub:

- ينزل أصل الإصدار المناسب.
- يخزنه ضمن `~/.openclaw/tools/signal-cli/<version>/`.
- يكتب `channels.signal.cliPath` إلى تكوينك.

ملاحظات:

- تتطلب إصدارات JVM **Java 21**.
- تُستخدم الإصدارات الأصلية عند توفرها.
- يستخدم Windows ‏WSL2؛ يتبع تثبيت signal-cli تدفق Linux داخل WSL.

## ما يكتبه المعالج

الحقول النموذجية في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (إذا تم اختيار Minimax)
- `tools.profile` (تكون إعدادات الإعداد المحلي الافتراضية `"coding"` عند عدم ضبطها؛ وتُحفظ القيم الصريحة الموجودة)
- `gateway.*` (الوضع، الربط، المصادقة، tailscale)
- `session.dmScope` (تفاصيل السلوك: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- قوائم السماح للقنوات (Slack/Discord/Matrix/Microsoft Teams) عند الاشتراك أثناء المطالبات (تُحل الأسماء إلى معرّفات عند الإمكان).
- `skills.install.nodeManager`
  - يقبل `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - لا يزال بإمكان التكوين اليدوي استخدام `yarn` عبر ضبط `skills.install.nodeManager` مباشرة.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

يكتب `openclaw agents add` إلى `agents.list[]` و`bindings` الاختيارية.

توجد بيانات اعتماد WhatsApp ضمن `~/.openclaw/credentials/whatsapp/<accountId>/`.
تُخزَّن الجلسات ضمن `~/.openclaw/agents/<agentId>/sessions/`.

تُقدَّم بعض القنوات بصفتها plugins. عند اختيار واحدة أثناء الإعداد، سيطالبك الإعداد
بتثبيتها (npm أو مسار محلي) قبل أن يمكن تكوينها.

## مستندات ذات صلة

- نظرة عامة على الإعداد: [الإعداد (CLI)](/ar/start/wizard)
- إعداد تطبيق macOS: [الإعداد](/ar/start/onboarding)
- مرجع التكوين: [تكوين Gateway](/ar/gateway/configuration)
- المزوّدون: [WhatsApp](/ar/channels/whatsapp), [Telegram](/ar/channels/telegram), [Discord](/ar/channels/discord), [Google Chat](/ar/channels/googlechat), [Signal](/ar/channels/signal), [iMessage](/ar/channels/imessage)
- Skills: [Skills](/ar/tools/skills), [تكوين Skills](/ar/tools/skills-config)
