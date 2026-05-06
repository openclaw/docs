---
read_when:
    - البحث عن خطوة إعداد أولي محددة أو خيار محدد
    - أتمتة الإعداد الأولي باستخدام الوضع غير التفاعلي
    - تصحيح أخطاء سلوك الإعداد الأولي
sidebarTitle: Onboarding Reference
summary: 'مرجع كامل للإعداد الأولي عبر CLI: كل خطوة وخيار وحقل تكوين'
title: مرجع الإعداد الأولي
x-i18n:
    generated_at: "2026-05-06T08:13:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce0ddb07600ef4f84c44734176e42eb6beaa00fede0be156f3bdd2ec1c0111bb
    source_path: reference/wizard.md
    workflow: 16
---

هذا هو المرجع الكامل لـ `openclaw onboard`.
للحصول على نظرة عامة عالية المستوى، راجع [الإعداد الأولي (CLI)](/ar/start/wizard).

## تفاصيل سير العمل (الوضع المحلي)

<Steps>
  <Step title="اكتشاف الإعدادات الحالية">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر **إبقاء / تعديل / إعادة تعيين**.
    - لا تؤدي إعادة تشغيل الإعداد الأولي إلى مسح أي شيء إلا إذا اخترت **إعادة تعيين** صراحة
      (أو مررت `--reset`).
    - يعيد CLI `--reset` افتراضيًا تعيين `config+creds+sessions`؛ استخدم `--reset-scope full`
      لإزالة مساحة العمل أيضًا.
    - إذا كانت الإعدادات غير صالحة أو تحتوي على مفاتيح قديمة، يتوقف المعالج ويطلب
      منك تشغيل `openclaw doctor` قبل المتابعة.
    - تستخدم إعادة التعيين `trash` (وليس `rm` أبدًا) وتعرض النطاقات التالية:
      - الإعدادات فقط
      - الإعدادات + بيانات الاعتماد + الجلسات
      - إعادة تعيين كاملة (تزيل مساحة العمل أيضًا)

  </Step>
  <Step title="النموذج/المصادقة">
    - **مفتاح Anthropic API**: يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يحفظه لاستخدام الخادم الخفي.
    - **مفتاح Anthropic API**: خيار مساعد Anthropic المفضل في الإعداد الأولي/التهيئة.
    - **رمز إعداد Anthropic**: لا يزال متاحًا في الإعداد الأولي/التهيئة، رغم أن OpenClaw يفضل الآن إعادة استخدام Claude CLI عند توفره.
    - **اشتراك OpenAI Code (Codex) (OAuth)**: تدفق المتصفح؛ الصق `code#state`.
      - يضبط `agents.defaults.model` على `openai-codex/gpt-5.5` عندما لا يكون النموذج مضبوطًا أو كان من عائلة OpenAI بالفعل.
    - **اشتراك OpenAI Code (Codex) (إقران الجهاز)**: تدفق إقران عبر المتصفح مع رمز جهاز قصير العمر.
      - يضبط `agents.defaults.model` على `openai-codex/gpt-5.5` عندما لا يكون النموذج مضبوطًا أو كان من عائلة OpenAI بالفعل.
    - **مفتاح OpenAI API**: يستخدم `OPENAI_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يخزنه في ملفات تعريف المصادقة.
      - يضبط `agents.defaults.model` على `openai/gpt-5.5` عندما لا يكون النموذج مضبوطًا، أو `openai/*`، أو `openai-codex/*`.
    - **مفتاح xAI (Grok) API**: يطلب `XAI_API_KEY` ويهيئ xAI بوصفه مزود نماذج.
    - **OpenCode**: يطلب `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`، احصل عليه من https://opencode.ai/auth) ويتيح لك اختيار كتالوج Zen أو Go.
    - **Ollama**: يعرض أولًا **السحابة + المحلي** أو **السحابة فقط** أو **المحلي فقط**. يطلب `Cloud only` قيمة `OLLAMA_API_KEY` ويستخدم `https://ollama.com`؛ أما الأوضاع المدعومة بمضيف فتطلب عنوان URL الأساسي لـ Ollama، وتكتشف النماذج المتاحة، وتسحب النموذج المحلي المحدد تلقائيًا عند الحاجة؛ كما يتحقق `Cloud + Local` مما إذا كان مضيف Ollama ذلك قد سجل دخوله للوصول السحابي.
    - مزيد من التفاصيل: [Ollama](/ar/providers/ollama)
    - **مفتاح API**: يخزن المفتاح لك.
    - **Vercel AI Gateway (وكيل متعدد النماذج)**: يطلب `AI_GATEWAY_API_KEY`.
    - مزيد من التفاصيل: [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: يطلب معرف الحساب، ومعرف Gateway، و`CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - مزيد من التفاصيل: [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
    - **MiniMax**: تُكتب الإعدادات تلقائيًا؛ القيمة الافتراضية المستضافة هي `MiniMax-M2.7`.
      يستخدم إعداد مفتاح API ‏`minimax/...`، ويستخدم إعداد OAuth
      ‏`minimax-portal/...`.
    - مزيد من التفاصيل: [MiniMax](/ar/providers/minimax)
    - **StepFun**: تُكتب الإعدادات تلقائيًا لـ StepFun القياسي أو Step Plan على نقاط النهاية في الصين أو العالمية.
    - يتضمن القياسي حاليًا `step-3.5-flash`، ويتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    - مزيد من التفاصيل: [StepFun](/ar/providers/stepfun)
    - **Synthetic (متوافق مع Anthropic)**: يطلب `SYNTHETIC_API_KEY`.
    - مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic)
    - **Moonshot (Kimi K2)**: تُكتب الإعدادات تلقائيًا.
    - **Kimi Coding**: تُكتب الإعدادات تلقائيًا.
    - مزيد من التفاصيل: [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot)
    - **تخطي**: لم تُهيأ المصادقة بعد.
    - اختر نموذجًا افتراضيًا من الخيارات المكتشفة (أو أدخل المزود/النموذج يدويًا). للحصول على أفضل جودة وتقليل خطر حقن التعليمات، اختر أقوى نموذج من الجيل الأحدث المتاح في حزمة مزودك.
    - يشغل الإعداد الأولي فحصًا للنموذج ويحذر إذا كان النموذج المهيأ غير معروف أو تنقصه المصادقة.
    - يكون وضع تخزين مفتاح API افتراضيًا على قيم ملف تعريف مصادقة بنص عادي. استخدم `--secret-input-mode ref` لتخزين مراجع مدعومة بالبيئة بدلًا من ذلك (على سبيل المثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - توجد ملفات تعريف المصادقة في `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (مفاتيح API + OAuth). ‏`~/.openclaw/credentials/oauth.json` مصدر استيراد قديم فقط.
    - مزيد من التفاصيل: [/concepts/oauth](/ar/concepts/oauth)
    <Note>
    نصيحة للخوادم/دون واجهة رسومية: أكمل OAuth على جهاز به متصفح، ثم انسخ
    ملف `auth-profiles.json` لذلك الوكيل (على سبيل المثال
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو مسار
    `$OPENCLAW_STATE_DIR/...` المطابق) إلى مضيف Gateway. ‏`credentials/oauth.json`
    هو مصدر استيراد قديم فقط.
    </Note>
  </Step>
  <Step title="مساحة العمل">
    - الافتراضي `~/.openclaw/workspace` (قابل للتهيئة).
    - يزرع ملفات مساحة العمل اللازمة لطقس تمهيد الوكيل.
    - تخطيط مساحة العمل الكامل + دليل النسخ الاحتياطي: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - المنفذ، والربط، ووضع المصادقة، والتعرض عبر Tailscale.
    - توصية المصادقة: أبقِ **الرمز** حتى مع الحلقة الراجعة كي يتعين على عملاء WS المحليين المصادقة.
    - في وضع الرمز، يعرض الإعداد التفاعلي:
      - **إنشاء/تخزين رمز بنص عادي** (افتراضي)
      - **استخدام SecretRef** (اشتراك اختياري)
      - يعيد دليل البدء السريع استخدام SecretRefs الموجودة في `gateway.auth.token` عبر مزودي `env` و`file` و`exec` لتمهيد فحص الإعداد الأولي/لوحة التحكم.
      - إذا كان SecretRef ذلك مهيأً لكن لا يمكن حله، يفشل الإعداد الأولي مبكرًا برسالة إصلاح واضحة بدلًا من إضعاف مصادقة وقت التشغيل بصمت.
    - في وضع كلمة المرور، يدعم الإعداد التفاعلي أيضًا التخزين بنص عادي أو SecretRef.
    - مسار SecretRef للرمز في الوضع غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير بيئة غير فارغ في بيئة عملية الإعداد الأولي.
      - لا يمكن دمجه مع `--gateway-token`.
    - عطّل المصادقة فقط إذا كنت تثق تمامًا بكل عملية محلية.
    - لا تزال روابط غير الحلقة الراجعة تتطلب المصادقة.

  </Step>
  <Step title="القنوات">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول اختياري عبر QR.
    - [Telegram](/ar/channels/telegram): رمز البوت.
    - [Discord](/ar/channels/discord): رمز البوت.
    - [Google Chat](/ar/channels/googlechat): JSON لحساب خدمة + جمهور Webhook.
    - [Mattermost](/ar/channels/mattermost) (Plugin): رمز بوت + عنوان URL أساسي.
    - [Signal](/ar/channels/signal): تثبيت اختياري لـ `signal-cli` + إعداد الحساب.
    - [BlueBubbles](/ar/channels/bluebubbles): **موصى به لـ iMessage**؛ عنوان URL للخادم + كلمة مرور + Webhook.
    - [iMessage](/ar/channels/imessage): مسار CLI قديم لـ `imsg` + وصول إلى قاعدة البيانات.
    - أمان الرسائل المباشرة: الافتراضي هو الإقران. ترسل أول رسالة مباشرة رمزًا؛ وافق عبر `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.

  </Step>
  <Step title="بحث الويب">
    - اختر مزودًا مدعومًا مثل Brave أو DuckDuckGo أو Exa أو Firecrawl أو Gemini أو Grok أو Kimi أو MiniMax Search أو Ollama Web Search أو Perplexity أو SearXNG أو Tavily (أو تخطَّ).
    - يمكن للمزودين المدعومين بـ API استخدام متغيرات البيئة أو الإعدادات الحالية للإعداد السريع؛ أما المزودون بلا مفاتيح فيستخدمون متطلباتهم الخاصة بدلًا من ذلك.
    - تخطَّ باستخدام `--skip-search`.
    - هيئ لاحقًا: `openclaw configure --section web`.

  </Step>
  <Step title="تثبيت الخادم الخفي">
    - macOS: LaunchAgent
      - يتطلب جلسة مستخدم مسجل الدخول؛ للوضع دون واجهة، استخدم LaunchDaemon مخصصًا (غير مشحون).
    - Linux (وWindows عبر WSL2): وحدة systemd للمستخدم
      - يحاول الإعداد الأولي تمكين البقاء عبر `loginctl enable-linger <user>` حتى يبقى Gateway قيد التشغيل بعد تسجيل الخروج.
      - قد يطلب sudo (يكتب إلى `/var/lib/systemd/linger`)؛ يحاول أولًا من دون sudo.
    - **اختيار وقت التشغيل:** Node (موصى به؛ مطلوب لـ WhatsApp/Telegram). لا يُوصى بـ Bun.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا عبر SecretRef، يتحقق تثبيت الخادم الخفي منه لكنه لا يستمر في حفظ قيم الرمز المحلولة بنص عادي داخل بيانات تعريف بيئة خدمة المشرف.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef للرمز المهيأ غير محلول، يُحظر تثبيت الخادم الخفي مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين وكان `gateway.auth.mode` غير مضبوط، يُحظر تثبيت الخادم الخفي حتى يُضبط الوضع صراحة.

  </Step>
  <Step title="فحص الصحة">
    - يبدأ Gateway (إذا لزم الأمر) ويشغل `openclaw health`.
    - نصيحة: يضيف `openclaw status --deep` فحص صحة Gateway الحي إلى مخرجات الحالة، بما في ذلك فحوصات القنوات عند دعمها (يتطلب Gateway قابلًا للوصول).

  </Step>
  <Step title="Skills (موصى بها)">
    - يقرأ Skills المتاحة ويتحقق من المتطلبات.
    - يتيح لك اختيار مدير Node: **npm / pnpm** (لا يُوصى بـ bun).
    - يثبت التبعيات الاختيارية (بعضها يستخدم Homebrew على macOS).

  </Step>
  <Step title="الإنهاء">
    - ملخص + الخطوات التالية، بما في ذلك تطبيقات iOS/Android/macOS للميزات الإضافية.

  </Step>
</Steps>

<Note>
إذا لم تُكتشف واجهة رسومية، يطبع الإعداد الأولي تعليمات إعادة توجيه منفذ SSH لواجهة Control UI بدلًا من فتح متصفح.
إذا كانت أصول Control UI مفقودة، يحاول الإعداد الأولي بناءها؛ والبديل هو `pnpm ui:build` (يثبت تبعيات الواجهة تلقائيًا).
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
لا يعني `--json` الوضع غير التفاعلي. استخدم `--non-interactive` (و`--workspace`) للسكربتات.
</Note>

توجد أمثلة أوامر خاصة بالمزودين في [أتمتة CLI](/ar/start/wizard-cli-automation#provider-specific-examples).
استخدم صفحة المرجع هذه لدلالات العلامات وترتيب الخطوات.

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

يعرض Gateway سير الإعداد الأولي عبر RPC (`wizard.start`، `wizard.next`، `wizard.cancel`، `wizard.status`).
يمكن للعملاء (تطبيق macOS، وControl UI) عرض الخطوات دون إعادة تنفيذ منطق الإعداد الأولي.

## إعداد Signal ‏(signal-cli)

يمكن للإعداد الأولي تثبيت `signal-cli` من إصدارات GitHub:

- ينزل أصل الإصدار المناسب.
- يخزنه تحت `~/.openclaw/tools/signal-cli/<version>/`.
- يكتب `channels.signal.cliPath` في إعداداتك.

ملاحظات:

- تتطلب إصدارات JVM ‏**Java 21**.
- تُستخدم الإصدارات الأصلية عند توفرها.
- يستخدم Windows ‏WSL2؛ ويتبع تثبيت signal-cli تدفق Linux داخل WSL.

## ما يكتبه المعالج

الحقول النموذجية في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (إذا تم اختيار Minimax)
- `tools.profile` (تعيّن التهيئة الأولية المحلية القيمة الافتراضية إلى `"coding"` عند عدم ضبطها؛ وتُحفظ القيم الصريحة الموجودة)
- `gateway.*` (الوضع، الربط، المصادقة، tailscale)
- `session.dmScope` (تفاصيل السلوك: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- قوائم السماح للقنوات (Slack/Discord/Matrix/Microsoft Teams) عند الاشتراك أثناء المطالبات (تُحل الأسماء إلى معرّفات عندما يكون ذلك ممكنًا).
- `skills.install.nodeManager`
  - يقبل `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - ما زال بإمكان التهيئة اليدوية استخدام `yarn` عبر ضبط `skills.install.nodeManager` مباشرة.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

يكتب `openclaw agents add` إلى `agents.list[]` و`bindings` الاختيارية.

توضع بيانات اعتماد WhatsApp ضمن `~/.openclaw/credentials/whatsapp/<accountId>/`.
تُخزَّن الجلسات ضمن `~/.openclaw/agents/<agentId>/sessions/`.

تُقدَّم بعض القنوات على هيئة plugins. عند اختيار إحداها أثناء الإعداد، ستطالبك التهيئة الأولية بتثبيتها (عبر npm أو مسار محلي) قبل أن يمكن تهيئتها.

## مستندات ذات صلة

- نظرة عامة على التهيئة الأولية: [التهيئة الأولية (CLI)](/ar/start/wizard)
- التهيئة الأولية لتطبيق macOS: [التهيئة الأولية](/ar/start/onboarding)
- مرجع التهيئة: [تهيئة Gateway](/ar/gateway/configuration)
- المزوّدون: [WhatsApp](/ar/channels/whatsapp), [Telegram](/ar/channels/telegram), [Discord](/ar/channels/discord), [Google Chat](/ar/channels/googlechat), [Signal](/ar/channels/signal), [BlueBubbles](/ar/channels/bluebubbles) (iMessage), [iMessage](/ar/channels/imessage) (قديم)
- Skills: [Skills](/ar/tools/skills), [تهيئة Skills](/ar/tools/skills-config)
