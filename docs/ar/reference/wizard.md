---
read_when:
    - البحث عن خطوة أو علم محدد في الإعداد الأولي
    - أتمتة الإعداد الأولي باستخدام الوضع غير التفاعلي
    - تصحيح سلوك الإعداد الأولي
sidebarTitle: Onboarding Reference
summary: 'المرجع الكامل للإعداد الأولي عبر CLI: كل خطوة، وعلم، وحقل إعداد'
title: مرجع الإعداد الأولي
x-i18n:
    generated_at: "2026-04-24T08:04:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f191b7d8a6d47638d9d0c9acf47a286225174c580aa0db89cf0c208d47ffee5
    source_path: reference/wizard.md
    workflow: 15
---

هذا هو المرجع الكامل لـ `openclaw onboard`.
وللحصول على نظرة عامة عالية المستوى، راجع [Onboarding (CLI)](/ar/start/wizard).

## تفاصيل التدفق (الوضع المحلي)

<Steps>
  <Step title="اكتشاف الإعداد الموجود">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر **Keep / Modify / Reset**.
    - لا تؤدي إعادة تشغيل onboarding إلى مسح أي شيء ما لم تختر صراحةً **Reset**
      (أو تمرر `--reset`).
    - يفترض `--reset` في CLI النطاق `config+creds+sessions` افتراضيًا؛ استخدم `--reset-scope full`
      لإزالة مساحة العمل أيضًا.
    - إذا كان الإعداد غير صالح أو يحتوي على مفاتيح قديمة، فإن المعالج يتوقف ويطلب
      منك تشغيل `openclaw doctor` قبل المتابعة.
    - يستخدم Reset أمر `trash` (وليس `rm` أبدًا) ويوفر نطاقات:
      - الإعداد فقط
      - الإعداد + بيانات الاعتماد + الجلسات
      - إعادة ضبط كاملة (تزيل مساحة العمل أيضًا)
  </Step>
  <Step title="النموذج/المصادقة">
    - **مفتاح Anthropic API**: يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يحفظه لاستخدام daemon.
    - **مفتاح Anthropic API**: هو خيار المساعد المفضل لـ Anthropic في onboarding/configure.
    - **Anthropic setup-token**: ما يزال متاحًا في onboarding/configure، رغم أن OpenClaw يفضل الآن إعادة استخدام Claude CLI عند توفرها.
    - **اشتراك OpenAI Code (Codex) (OAuth)**: تدفق عبر المتصفح؛ الصق قيمة `code#state`.
      - يضبط `agents.defaults.model` على `openai-codex/gpt-5.5` عندما يكون النموذج غير مضبوط أو كان من عائلة OpenAI بالفعل.
    - **اشتراك OpenAI Code (Codex) (اقتران جهاز)**: تدفق اقتران عبر المتصفح باستخدام رمز جهاز قصير العمر.
      - يضبط `agents.defaults.model` على `openai-codex/gpt-5.5` عندما يكون النموذج غير مضبوط أو كان من عائلة OpenAI بالفعل.
    - **مفتاح OpenAI API**: يستخدم `OPENAI_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يخزنه في ملفات تعريف المصادقة.
      - يضبط `agents.defaults.model` على `openai/gpt-5.4` عندما يكون النموذج غير مضبوط، أو `openai/*`، أو `openai-codex/*`.
    - **مفتاح xAI (Grok) API**: يطلب `XAI_API_KEY` ويضبط xAI كمزوّد نماذج.
    - **OpenCode**: يطلب `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`، احصل عليه من https://opencode.ai/auth) ويتيح لك اختيار كتالوج Zen أو Go.
    - **Ollama**: يعرض أولًا الخيارات **Cloud + Local**، أو **Cloud only**، أو **Local only**. يطلب `Cloud only` القيمة `OLLAMA_API_KEY` ويستخدم `https://ollama.com`؛ أما الأوضاع المدعومة بالمضيف فتطلب عنوان Ollama الأساسي، وتكتشف النماذج المتاحة، وتسحب النموذج المحلي المحدد تلقائيًا عند الحاجة؛ كما يتحقق `Cloud + Local` أيضًا مما إذا كان مضيف Ollama هذا قد سجّل الدخول للوصول السحابي.
    - مزيد من التفاصيل: [Ollama](/ar/providers/ollama)
    - **مفتاح API**: يخزن المفتاح نيابة عنك.
    - **Vercel AI Gateway (proxy متعددة النماذج)**: يطلب `AI_GATEWAY_API_KEY`.
    - مزيد من التفاصيل: [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: يطلب Account ID وGateway ID و`CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - مزيد من التفاصيل: [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
    - **MiniMax**: تتم كتابة الإعداد تلقائيًا؛ والافتراضي المستضاف هو `MiniMax-M2.7`.
      يستخدم إعداد مفتاح API المسار `minimax/...`، بينما يستخدم إعداد OAuth المسار
      `minimax-portal/...`.
    - مزيد من التفاصيل: [MiniMax](/ar/providers/minimax)
    - **StepFun**: تتم كتابة الإعداد تلقائيًا لـ StepFun القياسي أو Step Plan على نقاط نهاية الصين أو العالمية.
    - يتضمن Standard حاليًا `step-3.5-flash`، كما يتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    - مزيد من التفاصيل: [StepFun](/ar/providers/stepfun)
    - **Synthetic (متوافق مع Anthropic)**: يطلب `SYNTHETIC_API_KEY`.
    - مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic)
    - **Moonshot (Kimi K2)**: تتم كتابة الإعداد تلقائيًا.
    - **Kimi Coding**: تتم كتابة الإعداد تلقائيًا.
    - مزيد من التفاصيل: [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot)
    - **Skip**: لم يتم إعداد أي مصادقة بعد.
    - اختر نموذجًا افتراضيًا من الخيارات المكتشفة (أو أدخل provider/model يدويًا). وللحصول على أفضل جودة وتقليل مخاطر حقن المطالبة، اختر أقوى نموذج متاح من أحدث جيل في مجموعة مزوّديك.
    - يقوم onboarding بتشغيل فحص نموذج ويحذر إذا كان النموذج المُعدّ غير معروف أو يفتقد إلى المصادقة.
    - يفترض وضع تخزين مفتاح API القيم النصية الصريحة داخل ملف تعريف المصادقة. استخدم `--secret-input-mode ref` لتخزين مراجع مدعومة بـ env بدلًا من ذلك (مثل `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - تعيش ملفات تعريف المصادقة في `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (مفاتيح API + OAuth). أما `~/.openclaw/credentials/oauth.json` فهي قديمة وللاستيراد فقط.
    - مزيد من التفاصيل: [/concepts/oauth](/ar/concepts/oauth)
    <Note>
    نصيحة للخوادم/البيئات دون واجهة: أكمل OAuth على جهاز يملك متصفحًا، ثم انسخ
    `auth-profiles.json` الخاصة بذلك الوكيل (مثل
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو المسار
    المطابق تحت `$OPENCLAW_STATE_DIR/...`) إلى مضيف gateway. وتعد `credentials/oauth.json`
    مجرد مصدر استيراد قديم.
    </Note>
  </Step>
  <Step title="مساحة العمل">
    - الافتراضي هو `~/.openclaw/workspace` (وقابل للتغيير).
    - يهيّئ ملفات مساحة العمل المطلوبة لطقس bootstrap الخاص بالوكيل.
    - دليل تخطيط مساحة العمل الكامل + النسخ الاحتياطي: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - المنفذ، والربط، ووضع المصادقة، وتعريض Tailscale.
    - توصية المصادقة: احتفظ بخيار **Token** حتى في loopback حتى تظل عملاء WS المحليون مطالبين بالمصادقة.
    - في وضع token، يقدم الإعداد التفاعلي:
      - **Generate/store plaintext token** (الافتراضي)
      - **Use SecretRef** (اختياري)
      - يعيد Quickstart استخدام SecretRefs الموجودة في `gateway.auth.token` عبر موفري `env` و`file` و`exec` من أجل probe/bootstrap الخاصة بـ onboarding/dashboard.
      - إذا كانت SecretRef مضبوطة لكن لا يمكن تحليلها، فإن onboarding يفشل مبكرًا برسالة إصلاح واضحة بدل التدهور الصامت لمصادقة وقت التشغيل.
    - في وضع password، يدعم الإعداد التفاعلي أيضًا التخزين النصي الصريح أو SecretRef.
    - مسار SecretRef الخاص بالـ token في الوضع غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير env غير فارغًا في بيئة عملية onboarding.
      - لا يمكن دمجه مع `--gateway-token`.
    - عطّل المصادقة فقط إذا كنت تثق بالكامل بكل عملية محلية.
    - ما تزال عمليات الربط غير loopback تتطلب المصادقة.
  </Step>
  <Step title="القنوات">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول اختياري عبر QR.
    - [Telegram](/ar/channels/telegram): token للبوت.
    - [Discord](/ar/channels/discord): token للبوت.
    - [Google Chat](/ar/channels/googlechat): JSON لحساب الخدمة + webhook audience.
    - [Mattermost](/ar/channels/mattermost) (plugin): token للبوت + base URL.
    - [Signal](/ar/channels/signal): تثبيت اختياري لـ `signal-cli` + إعداد الحساب.
    - [BlueBubbles](/ar/channels/bluebubbles): **موصى به لـ iMessage**؛ عنوان الخادم + كلمة المرور + webhook.
    - [iMessage](/ar/channels/imessage): مسار `imsg` CLI القديم + وصول قاعدة البيانات.
    - أمان الرسائل الخاصة: الافتراضي هو الاقتران. أول رسالة خاصة ترسل رمزًا؛ وافق عليه عبر `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.
  </Step>
  <Step title="البحث في الويب">
    - اختر مزوّدًا مدعومًا مثل Brave، أو DuckDuckGo، أو Exa، أو Firecrawl، أو Gemini، أو Grok، أو Kimi، أو MiniMax Search، أو Ollama Web Search، أو Perplexity، أو SearXNG، أو Tavily (أو تخطَّ ذلك).
    - يمكن للمزوّدين المعتمدين على API استخدام متغيرات env أو الإعداد الحالي من أجل إعداد سريع؛ أما المزوّدون الذين لا يحتاجون إلى مفتاح فيستخدمون المتطلبات المسبقة الخاصة بهم.
    - تخطَّ ذلك باستخدام `--skip-search`.
    - اضبطه لاحقًا: `openclaw configure --section web`.
  </Step>
  <Step title="تثبيت daemon">
    - macOS: LaunchAgent
      - يتطلب جلسة مستخدم مسجّل الدخول؛ أما في البيئات دون واجهة فاستخدم LaunchDaemon مخصصًا (غير مشحون).
    - Linux (وWindows عبر WSL2): وحدة systemd للمستخدم
      - يحاول onboarding تفعيل lingering عبر `loginctl enable-linger <user>` حتى تبقى Gateway تعمل بعد تسجيل الخروج.
      - قد يطلب sudo (ويكتب إلى `/var/lib/systemd/linger`)؛ ويحاول أولًا من دون sudo.
    - **اختيار بيئة التشغيل:** Node (موصى بها؛ ومطلوبة لـ WhatsApp/Telegram). ولا يُنصح باستخدام Bun.
    - إذا كانت مصادقة token تتطلب token وكانت `gateway.auth.token` مُدارة عبر SecretRef، فإن تثبيت daemon يتحقق منها لكنه لا يحفظ القيم النصية الصريحة المحللة للـ token داخل بيانات بيئة الخدمة الخاصة بالمشرف.
    - إذا كانت مصادقة token تتطلب token وكانت SecretRef المضبوطة للـ token غير محللة، فسيتم حظر تثبيت daemon مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مضبوطين وكانت `gateway.auth.mode` غير مضبوطة، فسيتم حظر تثبيت daemon حتى يتم ضبط الوضع صراحةً.
  </Step>
  <Step title="الفحص الصحي">
    - يبدأ Gateway (إذا لزم) ويشغّل `openclaw health`.
    - نصيحة: يضيف `openclaw status --deep` فحص الصحة الحي الخاص بـ gateway إلى خرج الحالة، بما في ذلك probes القنوات عندما تكون مدعومة (ويتطلب gateway قابلة للوصول).
  </Step>
  <Step title="Skills (موصى بها)">
    - يقرأ الـ Skills المتاحة ويتحقق من المتطلبات.
    - يتيح لك اختيار مدير node: **npm / pnpm** (ولا يُنصح باستخدام bun).
    - يثبت التبعيات الاختيارية (بعضها يستخدم Homebrew على macOS).
  </Step>
  <Step title="الإنهاء">
    - ملخص + الخطوات التالية، بما في ذلك تطبيقات iOS/Android/macOS من أجل ميزات إضافية.
  </Step>
</Steps>

<Note>
إذا لم يتم اكتشاف أي واجهة رسومية، فسيطبع onboarding تعليمات إعادة توجيه منفذ SSH لـ Control UI بدلًا من فتح متصفح.
وإذا كانت أصول Control UI مفقودة، فسيحاول onboarding بناءها؛ والبديل الاحتياطي هو `pnpm ui:build` (مع تثبيت تلقائي لتبعيات UI).
</Note>

## الوضع غير التفاعلي

استخدم `--non-interactive` لأتمتة أو سكربتة onboarding:

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

SecretRef الخاصة بـ token الخاصة بـ Gateway في الوضع غير التفاعلي:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

الخياران `--gateway-token` و`--gateway-token-ref-env` متنافيان.

<Note>
لا يعني `--json` **ضمنيًا** الوضع غير التفاعلي. استخدم `--non-interactive` (و`--workspace`) من أجل السكربتات.
</Note>

توجد أمثلة الأوامر الخاصة بكل مزوّد في [أتمتة CLI](/ar/start/wizard-cli-automation#provider-specific-examples).
استخدم صفحة المرجع هذه لدلالات الأعلام وترتيب الخطوات.

### إضافة وكيل (غير تفاعلي)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC الخاصة بمعالج Gateway

تكشف Gateway عن تدفق onboarding عبر RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
يمكن للعملاء (تطبيق macOS، وControl UI) عرض الخطوات من دون
إعادة تنفيذ منطق onboarding.

## إعداد Signal (`signal-cli`)

يمكن لـ onboarding تثبيت `signal-cli` من إصدارات GitHub:

- ينزّل مورد الإصدار المناسب.
- يخزّنه تحت `~/.openclaw/tools/signal-cli/<version>/`.
- يكتب `channels.signal.cliPath` إلى إعدادك.

ملاحظات:

- تتطلب إصدارات JVM وجود **Java 21**.
- تُستخدم الإصدارات الأصلية عندما تكون متاحة.
- يستخدم Windows بيئة WSL2؛ ويتبع تثبيت signal-cli التدفق الخاص بـ Linux داخل WSL.

## ما الذي يكتبه المعالج

الحقول النموذجية في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (إذا تم اختيار MiniMax)
- `tools.profile` (يفترض onboarding المحلي القيمة `"coding"` عند عدم الضبط؛ وتُحفَظ القيم الصريحة الموجودة)
- `gateway.*` (الوضع، والربط، والمصادقة، وTailscale)
- `session.dmScope` (تفاصيل السلوك: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- قوائم السماح الخاصة بالقنوات (Slack/Discord/Matrix/Microsoft Teams) عندما تشترك فيها أثناء المطالبات (وتُحل الأسماء إلى معرّفات عندما يكون ذلك ممكنًا).
- `skills.install.nodeManager`
  - يقبل `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - ما يزال الإعداد اليدوي قادرًا على استخدام `yarn` من خلال ضبط `skills.install.nodeManager` مباشرة.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

يكتب `openclaw agents add` القيم `agents.list[]` و`bindings` الاختيارية.

تذهب بيانات اعتماد WhatsApp تحت `~/.openclaw/credentials/whatsapp/<accountId>/`.
وتُخزَّن الجلسات تحت `~/.openclaw/agents/<agentId>/sessions/`.

يتم تسليم بعض القنوات على شكل plugins. وعندما تختار واحدة أثناء الإعداد، سيطلب onboarding
تثبيتها (عبر npm أو مسار محلي) قبل أن يمكن إعدادها.

## مستندات ذات صلة

- نظرة عامة على onboarding: [Onboarding (CLI)](/ar/start/wizard)
- onboarding الخاصة بتطبيق macOS: [Onboarding](/ar/start/onboarding)
- مرجع الإعداد: [إعداد Gateway](/ar/gateway/configuration)
- المزوّدون: [WhatsApp](/ar/channels/whatsapp)، [Telegram](/ar/channels/telegram)، [Discord](/ar/channels/discord)، [Google Chat](/ar/channels/googlechat)، [Signal](/ar/channels/signal)، [BlueBubbles](/ar/channels/bluebubbles) (iMessage)، [iMessage](/ar/channels/imessage) (قديم)
- Skills: [Skills](/ar/tools/skills)، [إعداد Skills](/ar/tools/skills-config)
