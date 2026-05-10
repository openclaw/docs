---
read_when:
    - البحث عن خطوة إعداد أولي محددة أو خيار محدد
    - أتمتة الإعداد الأولي باستخدام الوضع غير التفاعلي
    - تصحيح أخطاء سلوك الإعداد الأوّلي
sidebarTitle: Onboarding Reference
summary: 'المرجع الكامل للإعداد الأولي عبر CLI: كل خطوة وخيار وحقل إعدادات'
title: مرجع الإعداد الأولي
x-i18n:
    generated_at: "2026-05-10T20:01:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: be3e45f152700f02a212a390cdc02d5432ff531716a089f531de3bb6cc368cc9
    source_path: reference/wizard.md
    workflow: 16
---

هذا هو المرجع الكامل لـ `openclaw onboard`.
للحصول على نظرة عامة عالية المستوى، راجع [الإعداد الأولي (CLI)](/ar/start/wizard).

## تفاصيل التدفق (الوضع المحلي)

<Steps>
  <Step title="Existing config detection">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر **الاحتفاظ بالقيم الحالية** أو **المراجعة والتحديث** أو **إعادة الضبط قبل الإعداد**.
    - لا تؤدي إعادة تشغيل الإعداد الأولي إلى مسح أي شيء ما لم تختر **إعادة الضبط** صراحة
      (أو تمرر `--reset`).
    - القيمة الافتراضية لـ CLI `--reset` هي `config+creds+sessions`؛ استخدم `--reset-scope full`
      لإزالة مساحة العمل أيضًا.
    - إذا كان التكوين غير صالح أو يحتوي على مفاتيح قديمة، يتوقف المعالج ويطلب
      منك تشغيل `openclaw doctor` قبل المتابعة.
    - تستخدم إعادة الضبط `trash` (وليس `rm` أبدًا) وتوفر النطاقات التالية:
      - التكوين فقط
      - التكوين + بيانات الاعتماد + الجلسات
      - إعادة ضبط كاملة (تزيل مساحة العمل أيضًا)

  </Step>
  <Step title="Model/Auth">
    - **مفتاح Anthropic API**: يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يحفظه لاستخدام الخادم الخفي.
    - **مفتاح Anthropic API**: خيار مساعد Anthropic المفضل في الإعداد الأولي/التكوين.
    - **رمز إعداد Anthropic**: ما زال متاحًا في الإعداد الأولي/التكوين، رغم أن OpenClaw يفضل الآن إعادة استخدام Claude CLI عندما يكون متاحًا.
    - **اشتراك OpenAI Code (Codex) (OAuth)**: تدفق عبر المتصفح؛ الصق `code#state`.
      - يعيّن `agents.defaults.model` إلى `openai/gpt-5.5` عبر وقت تشغيل Codex عندما لا يكون النموذج معينًا أو يكون من عائلة OpenAI بالفعل.
    - **اشتراك OpenAI Code (Codex) (إقران الجهاز)**: تدفق إقران عبر المتصفح باستخدام رمز جهاز قصير العمر.
      - يعيّن `agents.defaults.model` إلى `openai/gpt-5.5` عبر وقت تشغيل Codex عندما لا يكون النموذج معينًا أو يكون من عائلة OpenAI بالفعل.
    - **مفتاح OpenAI API**: يستخدم `OPENAI_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يخزنه في ملفات تعريف المصادقة.
      - يعيّن `agents.defaults.model` إلى `openai/gpt-5.5` عندما لا يكون النموذج معينًا، أو يكون `openai/*`، أو `openai-codex/*`.
    - **مفتاح xAI (Grok) API**: يطلب `XAI_API_KEY` ويكوّن xAI كمزود نماذج.
    - **OpenCode**: يطلب `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`، احصل عليه من https://opencode.ai/auth) ويتيح لك اختيار كتالوج Zen أو Go.
    - **Ollama**: يعرض أولًا **السحابة + المحلي** أو **السحابة فقط** أو **المحلي فقط**. يطلب `Cloud only` قيمة `OLLAMA_API_KEY` ويستخدم `https://ollama.com`؛ أما الأوضاع المدعومة بالمضيف فتطلب عنوان URL الأساسي لـ Ollama، وتكتشف النماذج المتاحة، وتسحب النموذج المحلي المحدد تلقائيًا عند الحاجة؛ ويفحص `Cloud + Local` أيضًا ما إذا كان مضيف Ollama هذا مسجل الدخول للوصول السحابي.
    - مزيد من التفاصيل: [Ollama](/ar/providers/ollama)
    - **مفتاح API**: يخزن المفتاح نيابة عنك.
    - **Vercel AI Gateway (وكيل متعدد النماذج)**: يطلب `AI_GATEWAY_API_KEY`.
    - مزيد من التفاصيل: [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: يطلب معرّف الحساب، ومعرّف Gateway، و`CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - مزيد من التفاصيل: [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
    - **MiniMax**: تتم كتابة التكوين تلقائيًا؛ الإعداد الافتراضي المستضاف هو `MiniMax-M2.7`.
      يستخدم إعداد مفتاح API ‏`minimax/...`، ويستخدم إعداد OAuth
      ‏`minimax-portal/...`.
    - مزيد من التفاصيل: [MiniMax](/ar/providers/minimax)
    - **StepFun**: تتم كتابة التكوين تلقائيًا لـ StepFun القياسي أو Step Plan على نقاط النهاية الصينية أو العالمية.
    - يتضمن القياسي حاليًا `step-3.5-flash`، ويتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    - مزيد من التفاصيل: [StepFun](/ar/providers/stepfun)
    - **Synthetic (متوافق مع Anthropic)**: يطلب `SYNTHETIC_API_KEY`.
    - مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic)
    - **Moonshot (Kimi K2)**: تتم كتابة التكوين تلقائيًا.
    - **Kimi Coding**: تتم كتابة التكوين تلقائيًا.
    - مزيد من التفاصيل: [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot)
    - **تخطي**: لم يتم تكوين أي مصادقة بعد.
    - اختر نموذجًا افتراضيًا من الخيارات المكتشفة (أو أدخل المزود/النموذج يدويًا). للحصول على أفضل جودة وتقليل مخاطر حقن المطالبات، اختر أقوى نموذج من أحدث جيل متاح في مكدس مزودك.
    - يشغّل الإعداد الأولي فحصًا للنموذج ويحذر إذا كان النموذج المكوّن غير معروف أو يفتقد المصادقة.
    - الوضع الافتراضي لتخزين مفتاح API هو قيم ملف تعريف مصادقة بنص صريح. استخدم `--secret-input-mode ref` لتخزين مراجع مدعومة بالبيئة بدلًا من ذلك (مثل `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - توجد ملفات تعريف المصادقة في `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (مفاتيح API + OAuth). ‏`~/.openclaw/credentials/oauth.json` هو للاستيراد القديم فقط.
    - مزيد من التفاصيل: [/concepts/oauth](/ar/concepts/oauth)
    <Note>
    نصيحة للخوادم/بيئات دون واجهة رسومية: أكمل OAuth على جهاز يحتوي على متصفح، ثم انسخ
    `auth-profiles.json` لذلك الوكيل (مثل
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو مسار
    `$OPENCLAW_STATE_DIR/...` المطابق) إلى مضيف Gateway. ‏`credentials/oauth.json`
    ليس إلا مصدر استيراد قديمًا.
    </Note>
  </Step>
  <Step title="Workspace">
    - الافتراضي `~/.openclaw/workspace` (قابل للتكوين).
    - يجهز ملفات مساحة العمل المطلوبة لطقس تمهيد الوكيل.
    - تخطيط مساحة العمل الكامل + دليل النسخ الاحتياطي: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - المنفذ، والربط، ووضع المصادقة، وتعرض Tailscale.
    - توصية المصادقة: أبقِ **الرمز** حتى مع local loopback كي تضطر عملاء WS المحليون إلى المصادقة.
    - في وضع الرمز، يوفر الإعداد التفاعلي:
      - **إنشاء/تخزين رمز بنص صريح** (افتراضي)
      - **استخدام SecretRef** (اختياري)
      - يعيد البدء السريع استخدام SecretRefs الموجودة لـ `gateway.auth.token` عبر مزودي `env` و`file` و`exec` لتمهيد فحص الإعداد الأولي/لوحة المعلومات.
      - إذا كان SecretRef ذلك مكوّنًا لكن لا يمكن حله، يفشل الإعداد الأولي مبكرًا برسالة إصلاح واضحة بدل التدهور الصامت في مصادقة وقت التشغيل.
    - في وضع كلمة المرور، يدعم الإعداد التفاعلي أيضًا التخزين بنص صريح أو عبر SecretRef.
    - مسار SecretRef للرمز في الوضع غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير بيئة غير فارغ في بيئة عملية الإعداد الأولي.
      - لا يمكن دمجه مع `--gateway-token`.
    - عطّل المصادقة فقط إذا كنت تثق بالكامل في كل عملية محلية.
    - ما زالت عمليات الربط غير local loopback تتطلب مصادقة.

  </Step>
  <Step title="Channels">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول QR اختياري.
    - [Telegram](/ar/channels/telegram): رمز بوت.
    - [Discord](/ar/channels/discord): رمز بوت.
    - [Google Chat](/ar/channels/googlechat): JSON حساب خدمة + جمهور Webhook.
    - [Mattermost](/ar/channels/mattermost) (Plugin): رمز بوت + عنوان URL أساسي.
    - [Signal](/ar/channels/signal): تثبيت `signal-cli` اختياري + تكوين الحساب.
    - [iMessage](/ar/channels/imessage): مسار CLI ‏`imsg` + الوصول إلى قاعدة بيانات Messages؛ استخدم غلاف SSH عندما يعمل Gateway خارج Mac.
    - أمان الرسائل المباشرة: الافتراضي هو الإقران. ترسل أول رسالة مباشرة رمزًا؛ وافق عبر `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.

  </Step>
  <Step title="Web search">
    - اختر مزودًا مدعومًا مثل Brave أو DuckDuckGo أو Exa أو Firecrawl أو Gemini أو Grok أو Kimi أو MiniMax Search أو Ollama Web Search أو Perplexity أو SearXNG أو Tavily (أو تخطَّ).
    - يمكن للمزودين المدعومين بـ API استخدام متغيرات البيئة أو التكوين الموجود للإعداد السريع؛ أما المزودون بلا مفاتيح فيستخدمون متطلباتهم الخاصة بدلًا من ذلك.
    - تخطَّ باستخدام `--skip-search`.
    - كوّنه لاحقًا: `openclaw configure --section web`.

  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - يتطلب جلسة مستخدم مسجلة الدخول؛ للأنظمة دون واجهة، استخدم LaunchDaemon مخصصًا (غير مرفق).
    - Linux (وWindows عبر WSL2): وحدة systemd للمستخدم
      - يحاول الإعداد الأولي تمكين الاستمرار عبر `loginctl enable-linger <user>` كي يبقى Gateway قيد التشغيل بعد تسجيل الخروج.
      - قد يطلب sudo (يكتب إلى `/var/lib/systemd/linger`)؛ يحاول أولًا من دون sudo.
    - **اختيار وقت التشغيل:** Node (موصى به؛ مطلوب لـ WhatsApp/Telegram). لا يوصى بـ Bun.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا عبر SecretRef، يتحقق تثبيت الخادم الخفي منه لكنه لا يحفظ قيم الرمز ذات النص الصريح المحلولة في بيانات تعريف بيئة خدمة المشرف.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef المكوّن للرمز غير محلول، يتم حظر تثبيت الخادم الخفي مع إرشادات قابلة للتنفيذ.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير معين، يتم حظر تثبيت الخادم الخفي حتى يتم تعيين الوضع صراحة.

  </Step>
  <Step title="Health check">
    - يشغّل Gateway (إذا لزم الأمر) ويشغّل `openclaw health`.
    - نصيحة: يضيف `openclaw status --deep` فحص صحة Gateway الحي إلى خرج الحالة، بما في ذلك فحوص القنوات عندما تكون مدعومة (يتطلب Gateway قابلًا للوصول).

  </Step>
  <Step title="Skills (recommended)">
    - يقرأ Skills المتاحة ويتحقق من المتطلبات.
    - يتيح لك اختيار مدير Node: **npm / pnpm** (لا يوصى بـ bun).
    - يثبت التبعيات الاختيارية (بعضها يستخدم Homebrew على macOS).

  </Step>
  <Step title="Finish">
    - ملخص + خطوات تالية، بما في ذلك مطالبة **كيف تريد أن تفقس وكيلك؟** لـ Terminal أو Browser أو لاحقًا.

  </Step>
</Steps>

<Note>
إذا لم يتم اكتشاف واجهة رسومية، يطبع الإعداد الأولي تعليمات إعادة توجيه منفذ SSH لواجهة Control UI بدلًا من فتح متصفح.
إذا كانت أصول Control UI مفقودة، يحاول الإعداد الأولي بناءها؛ والاحتياطي هو `pnpm ui:build` (يثبت تبعيات واجهة المستخدم تلقائيًا).
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

توجد أمثلة الأوامر الخاصة بالمزود في [أتمتة CLI](/ar/start/wizard-cli-automation#provider-specific-examples).
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

يعرض Gateway تدفق الإعداد الأولي عبر RPC (`wizard.start`، `wizard.next`، `wizard.cancel`، `wizard.status`).
يمكن للعملاء (تطبيق macOS، وControl UI) عرض الخطوات من دون إعادة تنفيذ منطق الإعداد الأولي.

## إعداد Signal (signal-cli)

يمكن للإعداد الأولي تثبيت `signal-cli` من إصدارات GitHub:

- ينزّل أصل الإصدار المناسب.
- يخزنه تحت `~/.openclaw/tools/signal-cli/<version>/`.
- يكتب `channels.signal.cliPath` في تكوينك.

ملاحظات:

- تتطلب إصدارات JVM **Java 21**.
- تُستخدم الإصدارات الأصلية عندما تكون متاحة.
- يستخدم Windows ‏WSL2؛ يتبع تثبيت signal-cli تدفق Linux داخل WSL.

## ما يكتبه المعالج

الحقول المعتادة في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (إذا تم اختيار Minimax)
- `tools.profile` (تستخدم التهيئة الأولية المحلية القيمة الافتراضية `"coding"` عند عدم ضبطها؛ وتُحفَظ القيم الصريحة الحالية)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (تفاصيل السلوك: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- قوائم سماح القنوات (Slack/Discord/Matrix/Microsoft Teams) عند الاشتراك أثناء المطالبات (تُحوَّل الأسماء إلى معرّفات عندما يكون ذلك ممكنًا).
- `skills.install.nodeManager`
  - يقبل `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - لا يزال بإمكان الإعداد اليدوي استخدام `yarn` عبر ضبط `skills.install.nodeManager` مباشرةً.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

يكتب `openclaw agents add` إلى `agents.list[]` و`bindings` الاختيارية.

تُوضَع بيانات اعتماد WhatsApp ضمن `~/.openclaw/credentials/whatsapp/<accountId>/`.
تُخزَّن الجلسات ضمن `~/.openclaw/agents/<agentId>/sessions/`.

تُقدَّم بعض القنوات على هيئة plugins. عند اختيار واحدة أثناء الإعداد، ستطالبك التهيئة الأولية
بتثبيتها (من npm أو من مسار محلي) قبل أن يمكن إعدادها.

## المستندات ذات الصلة

- نظرة عامة على التهيئة الأولية: [التهيئة الأولية (CLI)](/ar/start/wizard)
- التهيئة الأولية لتطبيق macOS: [التهيئة الأولية](/ar/start/onboarding)
- مرجع الإعدادات: [إعدادات Gateway](/ar/gateway/configuration)
- المزوّدون: [WhatsApp](/ar/channels/whatsapp), [Telegram](/ar/channels/telegram), [Discord](/ar/channels/discord), [Google Chat](/ar/channels/googlechat), [Signal](/ar/channels/signal), [iMessage](/ar/channels/imessage)
- Skills: [Skills](/ar/tools/skills), [إعدادات Skills](/ar/tools/skills-config)
