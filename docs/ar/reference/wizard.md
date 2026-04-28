---
read_when:
    - البحث عن خطوة أو عَلَم محدد في الإعداد الأولي
    - أتمتة الإعداد الأولي باستخدام الوضع غير التفاعلي
    - تصحيح سلوك الإعداد الأولي
sidebarTitle: Onboarding Reference
summary: 'المرجع الكامل للإعداد الأولي عبر CLI: كل خطوة، وعَلَم، وحقل تهيئة'
title: مرجع الإعداد الأولي
x-i18n:
    generated_at: "2026-04-25T18:22:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 729a12bac6b67b32ba4b2b2068a30240d2118f5afe3812c701ee65d7b7e13018
    source_path: reference/wizard.md
    workflow: 15
---

هذا هو المرجع الكامل للأمر `openclaw onboard`.
وللاطلاع على نظرة عامة عالية المستوى، راجع [الإعداد الأولي (CLI)](/ar/start/wizard).

## تفاصيل التدفق (الوضع المحلي)

<Steps>
  <Step title="اكتشاف التهيئة الحالية">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر **الاحتفاظ / التعديل / إعادة التعيين**.
    - لا تؤدي إعادة تشغيل الإعداد الأولي إلى مسح أي شيء **إلا** إذا اخترت صراحةً **إعادة التعيين**
      (أو مرّرت `--reset`).
    - يستخدم CLI عند `--reset` افتراضيًا `config+creds+sessions`؛ استخدم `--reset-scope full`
      لإزالة مساحة العمل أيضًا.
    - إذا كانت التهيئة غير صالحة أو تحتوي على مفاتيح قديمة، يتوقف المعالج ويطلب
      منك تشغيل `openclaw doctor` قبل المتابعة.
    - تستخدم إعادة التعيين `trash` (وليس `rm` أبدًا) وتوفر النطاقات التالية:
      - التهيئة فقط
      - التهيئة + بيانات الاعتماد + الجلسات
      - إعادة تعيين كاملة (تزيل مساحة العمل أيضًا)

  </Step>
  <Step title="النموذج/المصادقة">
    - **مفتاح API لـ Anthropic**: يستخدم `ANTHROPIC_API_KEY` إن كان موجودًا أو يطلب منك مفتاحًا، ثم يحفظه لاستخدام daemon.
    - **مفتاح API لـ Anthropic**: هو خيار مساعد Anthropic المفضّل في الإعداد الأولي/التهيئة.
    - **رمز إعداد Anthropic**: ما يزال متاحًا في الإعداد الأولي/التهيئة، رغم أن OpenClaw يفضّل الآن إعادة استخدام Claude CLI عند توفره.
    - **اشتراك OpenAI Code (Codex) ‏(OAuth)**: تدفق عبر المتصفح؛ الصق `code#state`.
      - يعيّن `agents.defaults.model` إلى `openai-codex/gpt-5.5` عندما يكون النموذج غير معيّن أو من عائلة OpenAI أصلًا.
    - **اشتراك OpenAI Code (Codex) ‏(إقران الجهاز)**: تدفق إقران عبر المتصفح باستخدام رمز جهاز قصير العمر.
      - يعيّن `agents.defaults.model` إلى `openai-codex/gpt-5.5` عندما يكون النموذج غير معيّن أو من عائلة OpenAI أصلًا.
    - **مفتاح API لـ OpenAI**: يستخدم `OPENAI_API_KEY` إن كان موجودًا أو يطلب منك مفتاحًا، ثم يخزنه في ملفات تعريف المصادقة.
      - يعيّن `agents.defaults.model` إلى `openai/gpt-5.5` عندما يكون النموذج غير معيّن، أو `openai/*`، أو `openai-codex/*`.
    - **مفتاح API لـ xAI ‏(Grok)**: يطلب `XAI_API_KEY` ويضبط xAI كموفّر نماذج.
    - **OpenCode**: يطلب `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`، احصل عليه من https://opencode.ai/auth) ويتيح لك اختيار كتالوج Zen أو Go.
    - **Ollama**: يقدّم أولًا **السحابة + المحلي** أو **السحابة فقط** أو **المحلي فقط**. يطلب `Cloud only` قيمة `OLLAMA_API_KEY` ويستخدم `https://ollama.com`؛ أما الأوضاع المعتمدة على المضيف فتطلب عنوان URL الأساسي لـ Ollama، وتكتشف النماذج المتاحة، وتسحب النموذج المحلي المحدد تلقائيًا عند الحاجة؛ كما يتحقق `Cloud + Local` أيضًا مما إذا كان مضيف Ollama هذا قد سجّل الدخول للوصول السحابي.
    - مزيد من التفاصيل: [Ollama](/ar/providers/ollama)
    - **مفتاح API**: يخزن المفتاح نيابةً عنك.
    - **Vercel AI Gateway ‏(وكيل متعدد النماذج)**: يطلب `AI_GATEWAY_API_KEY`.
    - مزيد من التفاصيل: [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: يطلب Account ID وGateway ID و`CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - مزيد من التفاصيل: [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
    - **MiniMax**: تُكتب التهيئة تلقائيًا؛ والافتراضي المستضاف هو `MiniMax-M2.7`.
      يستخدم الإعداد بمفتاح API ‏`minimax/...`، ويستخدم إعداد OAuth
      ‏`minimax-portal/...`.
    - مزيد من التفاصيل: [MiniMax](/ar/providers/minimax)
    - **StepFun**: تُكتب التهيئة تلقائيًا لـ StepFun القياسي أو Step Plan على نقاط نهاية الصين أو العالمية.
    - يتضمن الوضع القياسي حاليًا `step-3.5-flash`، ويتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    - مزيد من التفاصيل: [StepFun](/ar/providers/stepfun)
    - **Synthetic ‏(متوافق مع Anthropic)**: يطلب `SYNTHETIC_API_KEY`.
    - مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic)
    - **Moonshot ‏(Kimi K2)**: تُكتب التهيئة تلقائيًا.
    - **Kimi Coding**: تُكتب التهيئة تلقائيًا.
    - مزيد من التفاصيل: [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot)
    - **تخطي**: لا يتم ضبط مصادقة بعد.
    - اختر نموذجًا افتراضيًا من الخيارات المكتشفة (أو أدخل provider/model يدويًا). للحصول على أفضل جودة وتقليل خطر حقن المطالبات، اختر أقوى نموذج متاح من أحدث جيل في مجموعة موفّريك.
    - يشغّل الإعداد الأولي فحصًا للنموذج ويعرض تحذيرًا إذا كان النموذج المضبوط غير معروف أو تنقصه المصادقة.
    - يكون وضع تخزين مفاتيح API افتراضيًا قيمًا نصية صريحة في ملف تعريف المصادقة. استخدم `--secret-input-mode ref` لتخزين مراجع مدعومة بمتغيرات البيئة بدلًا من ذلك (مثل `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - توجد ملفات تعريف المصادقة في `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ‏(مفاتيح API + OAuth). أما `~/.openclaw/credentials/oauth.json` فهو قديم ويُستخدم للاستيراد فقط.
    - مزيد من التفاصيل: [/concepts/oauth](/ar/concepts/oauth)
    <Note>
    نصيحة للخوادم/الوضع عديم الواجهة: أكمل OAuth على جهاز يحتوي على متصفح، ثم انسخ
    ملف `auth-profiles.json` الخاص بذلك الوكيل (مثل
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو المسار المطابق
    ضمن `$OPENCLAW_STATE_DIR/...`) إلى مضيف Gateway. إن `credentials/oauth.json`
    مجرد مصدر استيراد قديم.
    </Note>
  </Step>
  <Step title="مساحة العمل">
    - الافتراضي هو `~/.openclaw/workspace` (قابل للتهيئة).
    - يزرع ملفات مساحة العمل اللازمة لطقس تمهيد الوكيل.
    - تخطيط مساحة العمل الكامل + دليل النسخ الاحتياطي: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - المنفذ، والربط، ووضع المصادقة، وتعريض Tailscale.
    - توصية المصادقة: أبقِ **Token** حتى مع loopback لكي تتطلب عملاء WS المحليون مصادقة.
    - في وضع الرمز، يقدّم الإعداد التفاعلي:
      - **إنشاء/تخزين رمز نصي صريح** (الافتراضي)
      - **استخدام SecretRef** (اختياري)
      - يعيد Quickstart استخدام SecretRefs الموجودة في `gateway.auth.token` عبر موفّري `env` و`file` و`exec` من أجل فحص الإعداد الأولي/تمهيد لوحة المعلومات.
      - إذا كان SecretRef هذا مضبوطًا ولكن يتعذر حله، يفشل الإعداد الأولي مبكرًا برسالة إصلاح واضحة بدلًا من إضعاف مصادقة وقت التشغيل بصمت.
    - في وضع كلمة المرور، يدعم الإعداد التفاعلي أيضًا التخزين النصي الصريح أو تخزين SecretRef.
    - مسار SecretRef للرمز في الوضع غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير بيئة غير فارغ في بيئة عملية الإعداد الأولي.
      - لا يمكن دمجه مع `--gateway-token`.
    - عطّل المصادقة فقط إذا كنت تثق تمامًا بكل عملية محلية.
    - ما تزال الروابط غير loopback تتطلب مصادقة.

  </Step>
  <Step title="القنوات">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول QR اختياري.
    - [Telegram](/ar/channels/telegram): رمز bot.
    - [Discord](/ar/channels/discord): رمز bot.
    - [Google Chat](/ar/channels/googlechat): JSON حساب خدمة + جمهور Webhook.
    - [Mattermost](/ar/channels/mattermost) ‏(Plugin): رمز bot + عنوان URL أساسي.
    - [Signal](/ar/channels/signal): تثبيت `signal-cli` اختياري + تهيئة الحساب.
    - [BlueBubbles](/ar/channels/bluebubbles): **موصى به لـ iMessage**؛ عنوان URL للخادم + كلمة المرور + Webhook.
    - [iMessage](/ar/channels/imessage): مسار `imsg` CLI القديم + الوصول إلى قاعدة البيانات.
    - أمان الرسائل المباشرة: الافتراضي هو الإقران. ترسل أول رسالة مباشرة رمزًا؛ وافق عليه عبر `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.

  </Step>
  <Step title="البحث على الويب">
    - اختر موفّرًا مدعومًا مثل Brave أو DuckDuckGo أو Exa أو Firecrawl أو Gemini أو Grok أو Kimi أو MiniMax Search أو Ollama Web Search أو Perplexity أو SearXNG أو Tavily (أو تخطَّ ذلك).
    - يمكن للموفّرين المعتمدين على API استخدام متغيرات البيئة أو التهيئة الحالية للإعداد السريع؛ أما الموفّرون الذين لا يحتاجون إلى مفتاح فيستخدمون متطلباتهم الخاصة بكل موفّر بدلًا من ذلك.
    - التخطي باستخدام `--skip-search`.
    - التهيئة لاحقًا: `openclaw configure --section web`.

  </Step>
  <Step title="تثبيت daemon">
    - macOS: ‏LaunchAgent
      - يتطلب جلسة مستخدم مسجّل دخوله؛ أما للوضع عديم الواجهة فاستخدم LaunchDaemon مخصصًا (غير مشحون).
    - Linux ‏(وWindows عبر WSL2): ‏وحدة systemd للمستخدم
      - يحاول الإعداد الأولي تمكين الاستمرار عبر `loginctl enable-linger <user>` لكي يبقى Gateway قيد التشغيل بعد تسجيل الخروج.
      - قد يطلب sudo ‏(يكتب إلى `/var/lib/systemd/linger`)؛ ويحاول أولًا من دون sudo.
    - **اختيار وقت التشغيل:** Node ‏(موصى به؛ مطلوب لـ WhatsApp/Telegram). ولا يُنصح باستخدام Bun.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا عبر SecretRef، فإن تثبيت daemon يتحقق منه لكنه لا يحفظ قيم الرموز النصية الصريحة المحلولة في بيانات بيئة خدمة المشرف.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef المضبوط للرمز غير محلول، فيتم حظر تثبيت daemon مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مضبوطين وكان `gateway.auth.mode` غير معيّن، فيتم حظر تثبيت daemon حتى يتم تعيين الوضع صراحةً.

  </Step>
  <Step title="فحص السلامة">
    - يبدأ Gateway ‏(عند الحاجة) ويشغّل `openclaw health`.
    - نصيحة: يضيف `openclaw status --deep` فحص سلامة Gateway المباشر إلى مخرجات الحالة، بما في ذلك فحوصات القنوات عندما تكون مدعومة (يتطلب Gateway يمكن الوصول إليه).

  </Step>
  <Step title="Skills ‏(موصى بها)">
    - يقرأ Skills المتاحة ويفحص المتطلبات.
    - يتيح لك اختيار مدير Node: ‏**npm / pnpm** ‏(لا يُنصح بـ bun).
    - يثبّت التبعيات الاختيارية (يستخدم بعضها Homebrew على macOS).

  </Step>
  <Step title="الانتهاء">
    - ملخص + الخطوات التالية، بما في ذلك تطبيقات iOS/Android/macOS لميزات إضافية.

  </Step>
</Steps>

<Note>
إذا لم يتم اكتشاف أي واجهة رسومية، يطبع الإعداد الأولي تعليمات إعادة توجيه منفذ SSH لـ Control UI بدلًا من فتح متصفح.
إذا كانت أصول Control UI مفقودة، يحاول الإعداد الأولي بناءها؛ والاحتياط هو `pnpm ui:build` (ويثبّت تبعيات UI تلقائيًا).
</Note>

## الوضع غير التفاعلي

استخدم `--non-interactive` لأتمتة الإعداد الأولي أو لكتابته كسكربت:

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

إن `--gateway-token` و`--gateway-token-ref-env` متنافيان.

<Note>
لا يعني `--json` تلقائيًا الوضع غير التفاعلي. استخدم `--non-interactive` (و`--workspace`) في السكربتات.
</Note>

توجد أمثلة الأوامر الخاصة بكل موفّر في [أتمتة CLI](/ar/start/wizard-cli-automation#provider-specific-examples).
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

يكشف Gateway تدفق الإعداد الأولي عبر RPC ‏(`wizard.start` و`wizard.next` و`wizard.cancel` و`wizard.status`).
يمكن للعملاء (تطبيق macOS وControl UI) عرض الخطوات دون إعادة تنفيذ منطق الإعداد الأولي.

## إعداد Signal ‏(`signal-cli`)

يمكن للإعداد الأولي تثبيت `signal-cli` من إصدارات GitHub:

- ينزّل أصل الإصدار المناسب.
- يخزنه تحت `~/.openclaw/tools/signal-cli/<version>/`.
- يكتب `channels.signal.cliPath` إلى التهيئة الخاصة بك.

ملاحظات:

- تتطلب بنى JVM إصدار **Java 21**.
- تُستخدم البنى الأصلية عند توفرها.
- يستخدم Windows ‏WSL2؛ ويتبع تثبيت signal-cli تدفق Linux داخل WSL.

## ما الذي يكتبه المعالج

الحقول النموذجية في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` ‏(إذا تم اختيار MiniMax)
- `tools.profile` ‏(يستخدم الإعداد الأولي المحلي القيمة الافتراضية `"coding"` عندما لا تكون معيّنة؛ وتُحفَظ القيم الصريحة الموجودة)
- `gateway.*` ‏(الوضع، والربط، والمصادقة، وTailscale)
- `session.dmScope` ‏(تفاصيل السلوك: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken` و`channels.discord.token` و`channels.matrix.*` و`channels.signal.*` و`channels.imessage.*`
- قوائم السماح الخاصة بالقنوات (Slack/Discord/Matrix/Microsoft Teams) عندما تختار ذلك أثناء المطالبات (تُحل الأسماء إلى معرّفات عند الإمكان).
- `skills.install.nodeManager`
  - يقبل `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - ما يزال بالإمكان استخدام `yarn` في التهيئة اليدوية عبر تعيين `skills.install.nodeManager` مباشرةً.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

يكتب `openclaw agents add` القيم `agents.list[]` و`bindings` الاختيارية.

توجد بيانات اعتماد WhatsApp تحت `~/.openclaw/credentials/whatsapp/<accountId>/`.
وتُخزَّن الجلسات تحت `~/.openclaw/agents/<agentId>/sessions/`.

تُسلَّم بعض القنوات على شكل Plugins. وعندما تختار واحدة منها أثناء الإعداد، سيطلب الإعداد الأولي
تثبيتها (npm أو مسار محلي) قبل أن يمكن تهيئتها.

## وثائق ذات صلة

- نظرة عامة على الإعداد الأولي: [الإعداد الأولي (CLI)](/ar/start/wizard)
- الإعداد الأولي لتطبيق macOS: [الإعداد الأولي](/ar/start/onboarding)
- مرجع التهيئة: [تهيئة Gateway](/ar/gateway/configuration)
- الموفّرون: [WhatsApp](/ar/channels/whatsapp)، [Telegram](/ar/channels/telegram)، [Discord](/ar/channels/discord)، [Google Chat](/ar/channels/googlechat)، [Signal](/ar/channels/signal)، [BlueBubbles](/ar/channels/bluebubbles) ‏(iMessage)، [iMessage](/ar/channels/imessage) ‏(قديم)
- Skills: [Skills](/ar/tools/skills)، [تهيئة Skills](/ar/tools/skills-config)
