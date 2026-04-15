---
read_when:
    - البحث عن خطوة أو علامة إعداد أولي محددة
    - أتمتة الإعداد الأولي باستخدام الوضع غير التفاعلي
    - تصحيح سلوك الإعداد الأولي
sidebarTitle: Onboarding Reference
summary: 'المرجع الكامل لإعداد CLI: كل خطوة وعلامة وحقل إعدادات'
title: مرجع الإعداد الأولي
x-i18n:
    generated_at: "2026-04-15T14:41:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1db3ff789422617634e6624f9d12c18b6a6c573721226b9c0fa6f6b7956ef33d
    source_path: reference/wizard.md
    workflow: 15
---

# مرجع الإعداد الأولي

هذا هو المرجع الكامل لـ `openclaw onboard`.
للاطلاع على نظرة عامة عالية المستوى، راجع [الإعداد الأولي (CLI)](/ar/start/wizard).

## تفاصيل التدفق (الوضع المحلي)

<Steps>
  <Step title="اكتشاف الإعدادات الحالية">
    - إذا كان `~/.openclaw/openclaw.json` موجودًا، فاختر **الاحتفاظ / التعديل / إعادة التعيين**.
    - لا تؤدي إعادة تشغيل الإعداد الأولي إلى مسح أي شيء **إلا** إذا اخترت صراحةً **إعادة التعيين**
      (أو مرّرت `--reset`).
    - يضبط CLI الخيار `--reset` افتراضيًا على `config+creds+sessions`؛ استخدم `--reset-scope full`
      لإزالة مساحة العمل أيضًا.
    - إذا كانت الإعدادات غير صالحة أو تحتوي على مفاتيح قديمة، يتوقف المعالج ويطلب
      منك تشغيل `openclaw doctor` قبل المتابعة.
    - تستخدم إعادة التعيين `trash` (وليس `rm` مطلقًا) وتوفّر النطاقات التالية:
      - الإعدادات فقط
      - الإعدادات + بيانات الاعتماد + الجلسات
      - إعادة تعيين كاملة (تزيل مساحة العمل أيضًا)
  </Step>
  <Step title="النموذج/المصادقة">
    - **مفتاح Anthropic API**: يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يحفظه لاستخدامه من قبل الخدمة الخلفية.
    - **مفتاح Anthropic API**: هو خيار مساعد Anthropic المفضّل في الإعداد الأولي/الضبط.
    - **رمز إعداد Anthropic**: لا يزال متاحًا في الإعداد الأولي/الضبط، رغم أن OpenClaw يفضّل الآن إعادة استخدام Claude CLI عند توفره.
    - **اشتراك OpenAI Code (Codex) (Codex CLI)**: إذا كان `~/.codex/auth.json` موجودًا، يمكن للإعداد الأولي إعادة استخدامه. تظل بيانات اعتماد Codex CLI المعاد استخدامها مُدارة بواسطة Codex CLI؛ وعند انتهاء صلاحيتها يعيد OpenClaw قراءة هذا المصدر أولًا، وعندما يكون المزوّد قادرًا على تحديثها، يكتب بيانات الاعتماد المحدّثة مرة أخرى إلى مخزن Codex بدلًا من تولي إدارتها بنفسه.
    - **اشتراك OpenAI Code (Codex) (OAuth)**: تدفق عبر المتصفح؛ الصق `code#state`.
      - يضبط `agents.defaults.model` على `openai-codex/gpt-5.4` عندما يكون النموذج غير مضبوط أو `openai/*`.
    - **مفتاح OpenAI API**: يستخدم `OPENAI_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يخزّنه في ملفات تعريف المصادقة.
      - يضبط `agents.defaults.model` على `openai/gpt-5.4` عندما يكون النموذج غير مضبوط، أو `openai/*`، أو `openai-codex/*`.
    - **مفتاح xAI (Grok) API**: يطلب `XAI_API_KEY` ويضبط xAI كمزوّد نماذج.
    - **OpenCode**: يطلب `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`، احصل عليه من https://opencode.ai/auth) ويتيح لك اختيار فهرس Zen أو Go.
    - **Ollama**: يوفّر أولًا الخيارات **Cloud + Local** أو **Cloud only** أو **Local only**. يطلب `Cloud only` قيمة `OLLAMA_API_KEY` ويستخدم `https://ollama.com`؛ أما الأوضاع المعتمدة على المضيف فتطلب عنوان URL الأساسي لـ Ollama، وتكتشف النماذج المتاحة، وتسحب النموذج المحلي المحدد تلقائيًا عند الحاجة؛ كما يتحقق `Cloud + Local` أيضًا مما إذا كان مضيف Ollama هذا قد سجّل الدخول للوصول السحابي.
    - مزيد من التفاصيل: [Ollama](/ar/providers/ollama)
    - **مفتاح API**: يخزن المفتاح لك.
    - **Vercel AI Gateway (وكيل متعدد النماذج)**: يطلب `AI_GATEWAY_API_KEY`.
    - مزيد من التفاصيل: [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: يطلب معرّف الحساب، ومعرّف Gateway، و`CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - مزيد من التفاصيل: [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
    - **MiniMax**: تُكتب الإعدادات تلقائيًا؛ والإعداد المستضاف الافتراضي هو `MiniMax-M2.7`.
      يستخدم إعداد مفتاح API `minimax/...`، ويستخدم إعداد OAuth
      `minimax-portal/...`.
    - مزيد من التفاصيل: [MiniMax](/ar/providers/minimax)
    - **StepFun**: تُكتب الإعدادات تلقائيًا لـ StepFun standard أو Step Plan على نقاط النهاية في الصين أو العالمية.
    - يتضمن Standard حاليًا `step-3.5-flash`، كما يتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    - مزيد من التفاصيل: [StepFun](/ar/providers/stepfun)
    - **Synthetic (متوافق مع Anthropic)**: يطلب `SYNTHETIC_API_KEY`.
    - مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic)
    - **Moonshot (Kimi K2)**: تُكتب الإعدادات تلقائيًا.
    - **Kimi Coding**: تُكتب الإعدادات تلقائيًا.
    - مزيد من التفاصيل: [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot)
    - **تخطي**: لم تُضبط أي مصادقة بعد.
    - اختر نموذجًا افتراضيًا من الخيارات المكتشفة (أو أدخل provider/model يدويًا). للحصول على أفضل جودة وتقليل خطر حقن المطالبات، اختر أقوى نموذج من الجيل الأحدث المتاح ضمن مجموعة المزوّدين لديك.
    - يشغّل الإعداد الأولي فحصًا للنموذج ويعرض تحذيرًا إذا كان النموذج المضبوط غير معروف أو تنقصه المصادقة.
    - يكون وضع تخزين مفاتيح API افتراضيًا على قيم ملفات تعريف المصادقة النصية الصريحة. استخدم `--secret-input-mode ref` لتخزين مراجع مدعومة بمتغيرات البيئة بدلًا من ذلك (على سبيل المثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - توجد ملفات تعريف المصادقة في `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (مفاتيح API + OAuth). ويُعد `~/.openclaw/credentials/oauth.json` مصدر استيراد قديم فقط.
    - مزيد من التفاصيل: [/concepts/oauth](/ar/concepts/oauth)
    <Note>
    نصيحة للخوادم/البيئات دون واجهة: أكمل OAuth على جهاز يحتوي على متصفح، ثم انسخ
    ملف `auth-profiles.json` الخاص بذلك الوكيل (على سبيل المثال
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو المسار المطابق
    `$OPENCLAW_STATE_DIR/...`) إلى مضيف Gateway. يُعد `credentials/oauth.json`
    مصدر استيراد قديمًا فقط.
    </Note>
  </Step>
  <Step title="مساحة العمل">
    - الإعداد الافتراضي `~/.openclaw/workspace` (قابل للضبط).
    - يهيّئ ملفات مساحة العمل اللازمة لطقس تهيئة الوكيل.
    - التخطيط الكامل لمساحة العمل + دليل النسخ الاحتياطي: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - المنفذ، والربط، ووضع المصادقة، وتعريض Tailscale.
    - توصية المصادقة: احتفظ بخيار **Token** حتى مع loopback لكي يتوجب على عملاء WS المحليين المصادقة.
    - في وضع الرمز المميّز، يوفّر الإعداد التفاعلي:
      - **توليد/تخزين رمز مميّز نصي صريح** (الافتراضي)
      - **استخدام SecretRef** (اختياري)
      - يعيد Quickstart استخدام SecretRefs الموجودة في `gateway.auth.token` عبر مزوّدي `env` و`file` و`exec` من أجل فحص الإعداد الأولي/تمهيد لوحة التحكم.
      - إذا كان SecretRef مضبوطًا ولكن تعذر حله، يفشل الإعداد الأولي مبكرًا مع رسالة إصلاح واضحة بدلًا من التراجع الصامت في مصادقة وقت التشغيل.
    - في وضع كلمة المرور، يدعم الإعداد التفاعلي أيضًا التخزين النصي الصريح أو SecretRef.
    - مسار SecretRef للرمز المميّز في الوضع غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير بيئة غير فارغ في بيئة عملية الإعداد الأولي.
      - لا يمكن دمجه مع `--gateway-token`.
    - عطّل المصادقة فقط إذا كنت تثق بالكامل بكل عملية محلية.
    - لا تزال عمليات الربط غير التابعة لـ loopback تتطلب المصادقة.
  </Step>
  <Step title="القنوات">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول QR اختياري.
    - [Telegram](/ar/channels/telegram): رمز البوت المميّز.
    - [Discord](/ar/channels/discord): رمز البوت المميّز.
    - [Google Chat](/ar/channels/googlechat): JSON لحساب خدمة + جمهور Webhook.
    - [Mattermost](/ar/channels/mattermost) (Plugin): رمز البوت المميّز + عنوان URL الأساسي.
    - [Signal](/ar/channels/signal): تثبيت `signal-cli` اختياري + إعداد الحساب.
    - [BlueBubbles](/ar/channels/bluebubbles): **موصى به لـ iMessage**؛ عنوان URL للخادم + كلمة المرور + Webhook.
    - [iMessage](/ar/channels/imessage): مسار `imsg` CLI القديم + وصول إلى قاعدة البيانات.
    - أمان الرسائل المباشرة: الإعداد الافتراضي هو الاقتران. ترسل أول رسالة مباشرة رمزًا؛ وافق عليه عبر `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.
  </Step>
  <Step title="البحث على الويب">
    - اختر مزودًا مدعومًا مثل Brave أو DuckDuckGo أو Exa أو Firecrawl أو Gemini أو Grok أو Kimi أو MiniMax Search أو Ollama Web Search أو Perplexity أو SearXNG أو Tavily (أو تخطّه).
    - يمكن لمزوّدي الخدمات المعتمدين على API استخدام متغيرات البيئة أو الإعدادات الموجودة للإعداد السريع؛ أما المزوّدون الذين لا يحتاجون إلى مفتاح فيستخدمون المتطلبات المسبقة الخاصة بكل مزوّد.
    - تخطَّ ذلك باستخدام `--skip-search`.
    - اضبطه لاحقًا: `openclaw configure --section web`.
  </Step>
  <Step title="تثبيت الخدمة الخلفية">
    - macOS: LaunchAgent
      - يتطلب جلسة مستخدم مسجّل دخوله؛ أما للبيئات دون واجهة فاستخدم LaunchDaemon مخصصًا (غير مرفق).
    - Linux (وWindows عبر WSL2): وحدة مستخدم systemd
      - يحاول الإعداد الأولي تمكين lingering عبر `loginctl enable-linger <user>` حتى يبقى Gateway قيد التشغيل بعد تسجيل الخروج.
      - قد يطلب sudo (يكتب إلى `/var/lib/systemd/linger`)؛ ويحاول أولًا بدون sudo.
    - **اختيار وقت التشغيل:** Node (موصى به؛ ومطلوب لـ WhatsApp/Telegram). ‏Bun **غير موصى به**.
    - إذا كانت مصادقة الرمز المميّز تتطلب رمزًا وكان `gateway.auth.token` مُدارًا عبر SecretRef، فإن تثبيت الخدمة الخلفية يتحقق منه لكنه لا يحفظ قيم الرموز المميّزة النصية الصريحة المحلولة ضمن بيانات بيئة خدمة المشرف.
    - إذا كانت مصادقة الرمز المميّز تتطلب رمزًا وكان SecretRef المضبوط للرمز غير محلول، فسيتم حظر تثبيت الخدمة الخلفية مع إرشادات عملية.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مضبوطين بينما `gateway.auth.mode` غير مضبوط، فسيتم حظر تثبيت الخدمة الخلفية إلى أن يُضبط الوضع صراحةً.
  </Step>
  <Step title="فحص السلامة">
    - يبدأ تشغيل Gateway (إذا لزم الأمر) ويشغّل `openclaw health`.
    - نصيحة: يضيف `openclaw status --deep` فحص سلامة Gateway المباشر إلى مخرجات الحالة، بما في ذلك فحوصات القنوات عند دعمها (ويتطلب Gateway يمكن الوصول إليه).
  </Step>
  <Step title="Skills (موصى بها)">
    - يقرأ Skills المتاحة ويفحص المتطلبات.
    - يتيح لك اختيار مدير Node: **npm / pnpm** (bun غير موصى به).
    - يثبّت التبعيات الاختيارية (يستخدم بعضها Homebrew على macOS).
  </Step>
  <Step title="إنهاء">
    - ملخص + الخطوات التالية، بما في ذلك تطبيقات iOS/Android/macOS للحصول على ميزات إضافية.
  </Step>
</Steps>

<Note>
إذا لم يتم اكتشاف واجهة رسومية، يطبع الإعداد الأولي تعليمات إعادة توجيه منفذ SSH لـ Control UI بدلًا من فتح متصفح.
إذا كانت أصول Control UI مفقودة، يحاول الإعداد الأولي بناءها؛ ويكون البديل هو `pnpm ui:build` (مع تثبيت تبعيات UI تلقائيًا).
</Note>

## الوضع غير التفاعلي

استخدم `--non-interactive` لأتمتة الإعداد الأولي أو تشغيله ضمن سكربتات:

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

أضف `--json` للحصول على ملخص يمكن قراءته آليًا.

SecretRef لرمز Gateway المميّز في الوضع غير التفاعلي:

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
لا يعني `--json` **تلقائيًا** الوضع غير التفاعلي. استخدم `--non-interactive` (و`--workspace`) في السكربتات.
</Note>

توجد أمثلة أوامر خاصة بالمزوّدين في [أتمتة CLI](/ar/start/wizard-cli-automation#provider-specific-examples).
استخدم صفحة المرجع هذه لمعاني العلامات وترتيب الخطوات.

### إضافة وكيل (غير تفاعلي)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC لمعالج Gateway

يعرّض Gateway تدفق الإعداد الأولي عبر RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
يمكن للعملاء (تطبيق macOS وControl UI) عرض الخطوات دون إعادة تنفيذ منطق الإعداد الأولي.

## إعداد Signal ‏(`signal-cli`)

يمكن للإعداد الأولي تثبيت `signal-cli` من إصدارات GitHub:

- ينزّل أصل الإصدار المناسب.
- يخزّنه تحت `~/.openclaw/tools/signal-cli/<version>/`.
- يكتب `channels.signal.cliPath` إلى إعداداتك.

ملاحظات:

- تتطلب إصدارات JVM **Java 21**.
- تُستخدم الإصدارات الأصلية عندما تكون متاحة.
- يستخدم Windows ‏WSL2؛ ويتبع تثبيت signal-cli تدفق Linux داخل WSL.

## ما الذي يكتبه المعالج

الحقول النموذجية في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (إذا تم اختيار Minimax)
- `tools.profile` (يضبط الإعداد الأولي المحلي القيمة الافتراضية على `"coding"` عندما تكون غير مضبوطة؛ ويتم الاحتفاظ بالقيم الصريحة الموجودة)
- `gateway.*` (الوضع، والربط، والمصادقة، وTailscale)
- `session.dmScope` (تفاصيل السلوك: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken` و`channels.discord.token` و`channels.matrix.*` و`channels.signal.*` و`channels.imessage.*`
- قوائم السماح للقنوات (Slack/Discord/Matrix/Microsoft Teams) عند اختيارك ذلك أثناء المطالبات (تُحل الأسماء إلى معرّفات عندما يكون ذلك ممكنًا).
- `skills.install.nodeManager`
  - يقبل `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - لا يزال يمكن للإعدادات اليدوية استخدام `yarn` عن طريق ضبط `skills.install.nodeManager` مباشرةً.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

يكتب `openclaw agents add` إلى `agents.list[]` و`bindings` الاختيارية.

تنتقل بيانات اعتماد WhatsApp إلى `~/.openclaw/credentials/whatsapp/<accountId>/`.
وتُخزَّن الجلسات تحت `~/.openclaw/agents/<agentId>/sessions/`.

تُقدَّم بعض القنوات على شكل Plugins. عند اختيار إحداها أثناء الإعداد،
سيطلب منك الإعداد الأولي تثبيتها (عبر npm أو من مسار محلي) قبل أن يمكن ضبطها.

## المستندات ذات الصلة

- نظرة عامة على الإعداد الأولي: [الإعداد الأولي (CLI)](/ar/start/wizard)
- الإعداد الأولي لتطبيق macOS: [الإعداد الأولي](/ar/start/onboarding)
- مرجع الإعدادات: [إعداد Gateway](/ar/gateway/configuration)
- المزوّدون: [WhatsApp](/ar/channels/whatsapp)، [Telegram](/ar/channels/telegram)، [Discord](/ar/channels/discord)، [Google Chat](/ar/channels/googlechat)، [Signal](/ar/channels/signal)، [BlueBubbles](/ar/channels/bluebubbles) (iMessage)، [iMessage](/ar/channels/imessage) (قديم)
- Skills: [Skills](/ar/tools/skills)، [إعدادات Skills](/ar/tools/skills-config)
