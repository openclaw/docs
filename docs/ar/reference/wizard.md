---
read_when:
    - البحث عن خطوة أو علامة محددة في الإعداد الأولي
    - أتمتة الإعداد الأولي باستخدام الوضع غير التفاعلي
    - تصحيح أخطاء سلوك الإعداد الأولي
sidebarTitle: Onboarding Reference
summary: 'المرجع الكامل للإعداد الأولي عبر CLI: كل خطوة وعلامة وحقل إعدادات'
title: مرجع الإعداد الأولي
x-i18n:
    generated_at: "2026-07-16T14:51:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6c345887da0102c73f72623105d052ea9262006206dd70bae8f94aad1349423d
    source_path: reference/wizard.md
    workflow: 16
---

هذا هو المرجع الكامل لـ `openclaw onboard`.
للحصول على نظرة عامة عالية المستوى، راجع [الإعداد الأولي (CLI)](/ar/start/wizard). وللاطلاع على السلوك والمخرجات
خطوة بخطوة، راجع [مرجع إعداد CLI](/ar/start/wizard-cli-reference).

## تفاصيل التدفق (الوضع المحلي)

<Steps>
  <Step title="إعادة الضبط (اختياري)">
    - `--reset` يعيد ضبط الحالة قبل تشغيل الإعداد؛ وبدونه، تؤدي إعادة تشغيل الإعداد الأولي
      إلى الاحتفاظ بالإعدادات الحالية وإعادة استخدامها كقيم افتراضية.
    - `--reset-scope` يتحكم فيما يزيله `--reset`: ‏`config` (ملف الإعدادات
      فقط)، أو `config+creds+sessions` (الافتراضي)، أو `full` (يزيل أيضًا
      مساحة العمل).
    - إذا كان ملف الإعدادات غير صالح، يتوقف الإعداد الأولي ويطلب تشغيل
      `openclaw doctor` أولًا، ثم إعادة تشغيل الإعداد.
    - تنقل إعادة الضبط الحالة إلى سلة المهملات (ولا تحذفها مباشرةً أبدًا).

  </Step>
  <Step title="الإقرار بالمخاطر">
    - تطلب منك أول عملية تشغيل (أو أي عملية تشغيل قبل تعيين `wizard.securityAcknowledgedAt`)
      تأكيد فهمك أن الوكلاء يتمتعون بقدرات قوية وأن الوصول الكامل
      إلى النظام ينطوي على مخاطر.
    - يتطلب `--non-interactive` تحديد `--accept-risk` صراحةً؛ وبدونه،
      يخرج الإعداد الأولي بخطأ بدلًا من عرض مطالبة.
    - تعرض عمليات التشغيل التفاعلية مطالبة تأكيد بدلًا من العلامة؛ ويؤدي الرفض
      إلى إلغاء الإعداد.

  </Step>
  <Step title="النموذج/المصادقة">
    - **مفتاح Anthropic API**: يستخدم `ANTHROPIC_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يحفظه لاستخدام البرنامج الخفي.
    - **Anthropic Claude CLI**: المسار المحلي المفضل عند وجود تسجيل دخول مسبق إلى Claude CLI؛ ويظل OpenClaw يدعم مصادقة رمز إعداد Anthropic كبديل.
    - **اشتراك OpenAI Code (Codex) ‏(OAuth)**: تدفق عبر المتصفح؛ الصق `code#state`.
      - في إعداد جديد من دون نموذج أساسي، يعيّن `agents.defaults.model` إلى `openai/gpt-5.6-sol` عبر بيئة تشغيل Codex.
    - **اشتراك OpenAI Code (Codex) ‏(إقران الجهاز)**: تدفق إقران عبر المتصفح باستخدام رمز جهاز قصير الأجل.
      - في إعداد جديد من دون نموذج أساسي، يعيّن `agents.defaults.model` إلى `openai/gpt-5.6-sol` عبر بيئة تشغيل Codex.
    - **مفتاح OpenAI API**: يستخدم `OPENAI_API_KEY` إذا كان موجودًا أو يطلب مفتاحًا، ثم يخزنه في ملفات تعريف المصادقة.
      - في إعداد جديد من دون نموذج أساسي، يعيّن `agents.defaults.model` إلى `openai/gpt-5.6`؛ ويُحل معرّف نموذج API المباشر المجرّد إلى فئة Sol.
    - تحافظ إضافة OpenAI أو إعادة مصادقته على أي نموذج أساسي صريح موجود، بما في ذلك `openai/gpt-5.5`. إذا كان الحساب لا يتيح GPT-5.6، فحدّد `openai/gpt-5.5` صراحةً؛ لا يخفض OpenClaw مستوى النموذج تلقائيًا دون إشعار.
    - **xAI OAuth**: تسجيل دخول عبر المتصفح باستخدام رمز جهاز من دون الحاجة إلى رد اتصال على localhost، لذا يعمل أيضًا عبر SSH/Docker/VPS ‏(`--auth-choice xai-oauth`).
    - **مفتاح xAI API**: يطلب `XAI_API_KEY` ‏(`--auth-choice xai-api-key`).
    - لا يزال `--auth-choice xai-device-code` يعمل كاسم مستعار للتوافق اليدوي فقط لتدفق OAuth نفسه باستخدام رمز جهاز xAI؛ استخدم `xai-oauth` للبرامج النصية الجديدة.
    - **OpenCode**: يطلب `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`، ويمكن الحصول عليه من https://opencode.ai/auth) ويتيح اختيار كتالوج Zen أو Go.
    - **Ollama**: يعرض أولًا **السحابة + المحلي** أو **السحابة فقط** أو **المحلي فقط**. يطلب `Cloud only` قيمة `OLLAMA_API_KEY` ويستخدم `https://ollama.com`؛ أما الأوضاع المدعومة بالمضيف فتطلب عنوان URL الأساسي لـ Ollama (الافتراضي `http://127.0.0.1:11434`)، وتكتشف النماذج المتاحة، وتسحب النموذج المحلي المحدد تلقائيًا عند الحاجة؛ كما يتحقق `Cloud + Local` مما إذا كان مضيف Ollama مسجل الدخول للوصول إلى السحابة.
    - مزيد من التفاصيل: [Ollama](/ar/providers/ollama)
    - **مفتاح API**: يخزن المفتاح بالنيابة عنك.
    - **Vercel AI Gateway (وكيل متعدد النماذج)**: يطلب `AI_GATEWAY_API_KEY`.
    - مزيد من التفاصيل: [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: يطلب معرّف الحساب، ومعرّف Gateway، و`CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - مزيد من التفاصيل: [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
    - **MiniMax**: تُكتب الإعدادات تلقائيًا؛ والقيمة الافتراضية المستضافة هي `MiniMax-M3`.
      يستخدم إعداد مفتاح API القيمة `minimax/...`، ويستخدم إعداد OAuth
      القيمة `minimax-portal/...`.
    - مزيد من التفاصيل: [MiniMax](/ar/providers/minimax)
    - **StepFun**: تُكتب الإعدادات تلقائيًا لـ StepFun القياسي أو Step Plan على نقاط النهاية الصينية أو العالمية.
    - القيمة الافتراضية الحالية للوضع القياسي هي `step-3.5-flash`؛ ويتضمن Step Plan أيضًا `step-3.5-flash-2603`.
    - مزيد من التفاصيل: [StepFun](/ar/providers/stepfun)
    - **Synthetic (متوافق مع Anthropic)**: يطلب `SYNTHETIC_API_KEY`.
    - مزيد من التفاصيل: [Synthetic](/ar/providers/synthetic)
    - **Moonshot (Kimi K2)**: تُكتب الإعدادات تلقائيًا.
    - **Kimi Coding**: تُكتب الإعدادات تلقائيًا.
    - مزيد من التفاصيل: [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot)
    - **موفر مخصص**: يعمل مع نقاط نهاية متوافقة مع OpenAI أو OpenAI Responses أو Anthropic. علامات الوضع غير التفاعلي: `--auth-choice custom-api-key`، و`--custom-base-url`، و`--custom-model-id`، و`--custom-api-key` (اختياري؛ يرجع إلى `CUSTOM_API_KEY`)، و`--custom-provider-id` (اختياري؛ يُشتق تلقائيًا من عنوان URL الأساسي)، و`--custom-compatibility openai|openai-responses|anthropic` (الافتراضي `openai`)، و`--custom-image-input` / `--custom-text-input` (لتجاوز اكتشاف نموذج الرؤية المستنتج).
    - **تخطي**: لم تُضبط المصادقة بعد.
    - اختر نموذجًا افتراضيًا من الخيارات المكتشفة (أو أدخل الموفر/النموذج يدويًا). للحصول على أفضل جودة وتقليل مخاطر حقن المطالبات، اختر أقوى نموذج من أحدث جيل متاح في مجموعة تقنيات موفرك.
    - يجري الإعداد الأولي فحصًا للنموذج ويحذر إذا كان النموذج المضبوط غير معروف أو يفتقر إلى المصادقة.
    - يستخدم وضع تخزين مفتاح API افتراضيًا قيم ملفات تعريف المصادقة بنص صريح. استخدم `--secret-input-mode ref` لتخزين مراجع مدعومة بمتغيرات البيئة بدلًا من ذلك (مثل `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)؛ ويجب أن يكون متغير البيئة المشار إليه معيّنًا مسبقًا، وإلا يفشل الإعداد الأولي فورًا.
    - توجد ملفات تعريف المصادقة في `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (مفاتيح API وOAuth). أما `~/.openclaw/credentials/oauth.json` فهو للاستيراد القديم فقط.
    - مزيد من التفاصيل: [OAuth](/ar/concepts/oauth)
    <Note>
    نصيحة للأنظمة دون واجهة رسومية/الخوادم: أكمل OAuth على جهاز مزود بمتصفح، ثم انسخ
    ملف `auth-profiles.json` الخاص بذلك الوكيل (على سبيل المثال
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`، أو مسار
    `$OPENCLAW_STATE_DIR/...` المطابق) إلى مضيف Gateway. لا يُستخدم `credentials/oauth.json`
    إلا كمصدر استيراد قديم.
    </Note>
  </Step>
  <Step title="مساحة العمل">
    - القيمة الافتراضية `~/.openclaw/workspace` (قابلة للضبط).
    - ينشئ ملفات مساحة العمل الأولية اللازمة لإجراء تمهيد الوكيل.
    - التخطيط الكامل لمساحة العمل + دليل النسخ الاحتياطي: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - المنفذ (الافتراضي **18789**)، والربط، ووضع المصادقة، والإتاحة عبر Tailscale.
    - توصية المصادقة: أبقِ **الرمز المميز** مفعّلًا حتى مع الاسترجاع الحلقي كي تُلزم عملاء WS المحليين بالمصادقة.
    - في وضع الرمز المميز، يعرض الإعداد التفاعلي:
      - **إنشاء/تخزين رمز مميز بنص صريح** (الافتراضي)
      - **استخدام SecretRef** (اشتراك اختياري)
      - يعيد البدء السريع استخدام مراجع SecretRef الحالية لـ `gateway.auth.token` عبر موفري `env` و`file` و`exec` لإجراء فحص الإعداد الأولي وتمهيد لوحة المعلومات.
      - إذا كان SecretRef مضبوطًا ولكن يتعذر حله، يفشل الإعداد الأولي مبكرًا مع رسالة إصلاح واضحة بدلًا من خفض مستوى مصادقة بيئة التشغيل بصمت.
    - في وضع كلمة المرور، يدعم الإعداد التفاعلي أيضًا التخزين بنص صريح أو باستخدام SecretRef.
    - مسار SecretRef للرمز المميز في الوضع غير التفاعلي: `--gateway-token-ref-env <ENV_VAR>`.
      - يتطلب متغير بيئة غير فارغ في بيئة عملية الإعداد الأولي.
      - لا يمكن دمجه مع `--gateway-token`.
    - لا تعطّل المصادقة إلا إذا كنت تثق تمامًا بكل عملية محلية.
    - لا تزال عمليات الربط غير الحلقية تتطلب المصادقة.

  </Step>
  <Step title="القنوات">
    - [WhatsApp](/ar/channels/whatsapp): تسجيل دخول اختياري عبر رمز QR.
    - [Telegram](/ar/channels/telegram): رمز البوت.
    - [Discord](/ar/channels/discord): رمز البوت.
    - [Google Chat](/ar/channels/googlechat): ملف JSON لحساب الخدمة + جمهور Webhook.
    - [Mattermost](/ar/channels/mattermost) ‏(Plugin): رمز البوت + عنوان URL الأساسي.
    - [Signal](/ar/channels/signal) ‏(Plugin): تثبيت اختياري لـ `signal-cli` + إعدادات الحساب.
    - [iMessage](/ar/channels/imessage): مسار CLI لـ `imsg` + الوصول إلى قاعدة بيانات Messages؛ استخدم مغلف SSH عندما يعمل Gateway خارج جهاز Mac.
    - تتوفر Discord وFeishu وMicrosoft Teams وQQ Bot وSlack وقنوات أخرى على هيئة
      Plugins يمكن للإعداد الأولي تثبيتها بالنيابة عنك. الكتالوج الكامل: [القنوات](/ar/channels).
    - أمان الرسائل المباشرة: الإقران هو الإعداد الافتراضي. ترسل أول رسالة مباشرة رمزًا؛ وافق عليه عبر `openclaw pairing approve <channel> <code>` أو استخدم قوائم السماح.

  </Step>
  <Step title="البحث على الويب">
    - اختر موفرًا مدعومًا مثل Brave أو Codex (البحث المستضاف) أو DuckDuckGo أو Exa أو Firecrawl أو Gemini أو Grok أو Kimi أو MiniMax Search أو Ollama Web Search أو Parallel أو Perplexity أو SearXNG أو Tavily (أو تخطَّ هذه الخطوة).
    - يمكن للموفرين المدعومين بواجهة API استخدام متغيرات البيئة أو الإعدادات الحالية للإعداد السريع؛ أما الموفرون الذين لا يحتاجون إلى مفتاح فيستخدمون متطلباتهم الخاصة بدلًا من ذلك.
    - تخطَّ باستخدام `--skip-search`.
    - للضبط لاحقًا: `openclaw configure --section web`.

  </Step>
  <Step title="تثبيت البرنامج الخفي">
    - macOS: ‏LaunchAgent
      - يتطلب جلسة مستخدم مسجل الدخول؛ وللأنظمة دون واجهة رسومية، استخدم LaunchDaemon مخصصًا (غير مضمّن).
    - Linux (وWindows عبر WSL2): وحدة مستخدم systemd
      - يحاول الإعداد الأولي تمكين الاستمرار عبر `loginctl enable-linger <user>` كي يظل Gateway قيد التشغيل بعد تسجيل الخروج.
      - قد يطلب sudo (ويكتب `/var/lib/systemd/linger`)؛ ويحاول أولًا من دون sudo.
    - Windows الأصلي: يبدأ بالمهمة المجدولة؛ وإذا رُفض إنشاء المهمة، يعود OpenClaw إلى عنصر تسجيل دخول لكل مستخدم في مجلد Startup ويشغّل Gateway فورًا.
    - **اختيار بيئة التشغيل:** يلزم Node لأن مخزن حالة بيئة التشغيل الأساسي يستخدم `node:sqlite`. تُرحّل خدمات Bun القديمة إلى Node أثناء الإصلاح.
    - إذا كانت مصادقة الرمز المميز تتطلب رمزًا وكانت `gateway.auth.token` مُدارة بواسطة SecretRef، يتحقق تثبيت البرنامج الخفي منها لكنه لا يحفظ قيم الرمز المميز المحلولة بنص صريح في بيانات بيئة خدمة المشرف الوصفية.
    - إذا كانت مصادقة الرمز المميز تتطلب رمزًا وكان SecretRef المضبوط للرمز غير قابل للحل، يُحظر تثبيت البرنامج الخفي مع إرشادات قابلة للتنفيذ.
    - إذا ضُبط كل من `gateway.auth.token` و`gateway.auth.password` ولم يُعيّن `gateway.auth.mode`، يُحظر تثبيت البرنامج الخفي حتى يُعيّن الوضع صراحةً.

  </Step>
  <Step title="فحص السلامة">
    - يشغّل Gateway (عند الحاجة) وينفّذ `openclaw health`.
    - نصيحة: يضيف `openclaw status --deep` فحص سلامة Gateway المباشر إلى مخرجات الحالة، بما في ذلك فحوصات القنوات عند دعمها (يتطلب Gateway يمكن الوصول إليه).

  </Step>
  <Step title="Skills (موصى بها)">
    - يقرأ Skills المتاحة ويتحقق من المتطلبات.
    - يتيح اختيار مدير Node: ‏**npm / pnpm / bun**.
    - يثبّت تلقائيًا التبعيات الاختيارية لـ Skills المضمّنة والموثوقة (يستخدم بعضها Homebrew على macOS).
    - يتخطى Skills التي لا يتوفر لها المتطلب المسبق لمثبّت Homebrew أو uv أو Go، ويجمعها مع إرشادات الإعداد اليدوي، ويوجهك إلى `openclaw doctor` بعد تثبيت المتطلب المسبق.

  </Step>
  <Step title="الإنهاء">
    - ملخص + الخطوات التالية، بما في ذلك مطالبة **كيف تريد أن تفقس وكيلك؟** لاختيار الطرفية أو المتصفح أو التأجيل.

  </Step>
</Steps>

<Note>
إذا لم تُكتشف واجهة مستخدم رسومية، فستطبع عملية الإعداد تعليمات إعادة توجيه منفذ SSH لواجهة التحكم بدلًا من فتح متصفح.
إذا كانت أصول واجهة التحكم مفقودة، فستحاول عملية الإعداد بناءها؛ والخيار الاحتياطي هو `pnpm ui:build` (يثبّت تبعيات واجهة المستخدم تلقائيًا).
</Note>

## الوضع غير التفاعلي

استخدم `--non-interactive --accept-risk` لأتمتة عملية الإعداد أو تشغيلها عبر برنامج نصي (هذه
العلامة هي الإقرار المطلوب بالمخاطر؛ وتنتهي عملية الإعداد بخطأ
من دونها):

```bash
openclaw onboard --non-interactive --accept-risk \
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

مرجع SecretRef لرمز Gateway في الوضع غير التفاعلي:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` و`--gateway-token-ref-env` متعارضان ولا يمكن استخدامهما معًا.

<Note>
لا يعني `--json` الوضع غير التفاعلي **ضمنيًا**. استخدم `--non-interactive --accept-risk` (و`--workspace`) للبرامج النصية.
</Note>

توجد أمثلة الأوامر الخاصة بكل موفّر في [أتمتة CLI](/ar/start/wizard-cli-automation#provider-specific-examples).
استخدم هذه الصفحة المرجعية لمعرفة دلالات العلامات وترتيب الخطوات.

### إضافة وكيل (غير تفاعلي)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` معرّف وكيل محجوز ولا يمكن استخدامه مع `openclaw agents add`.

## RPC لمعالج Gateway

يتيح Gateway تدفق الإعداد عبر RPC ‏(`wizard.start`، و`wizard.next`، و`wizard.cancel`، و`wizard.status`).
يمكن للعملاء (تطبيق macOS وواجهة التحكم) عرض الخطوات من دون إعادة تنفيذ منطق الإعداد.

## إعداد Signal ‏(signal-cli)

تكتشف عملية الإعداد ما إذا كان `signal-cli` موجودًا في `PATH`، وإذا كان مفقودًا، تعرض تثبيته:

- ‏Linux x86-64: ينزّل إصدار GraalVM الأصلي الرسمي من إصدارات `signal-cli` على GitHub ويخزّنه ضمن `~/.openclaw/tools/signal-cli/<version>/`.
- ‏macOS والبُنى الأخرى: يثبّته عبر Homebrew بدلًا من ذلك.
- ‏Windows الأصلي: غير مدعوم حتى الآن؛ شغّل عملية الإعداد داخل WSL2 للحصول على مسار تثبيت Linux.
- يكتب `channels.signal.cliPath` إلى إعداداتك في كلتا الحالتين.

## ما يكتبه المعالج

الحقول المعتادة في `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` عند تمرير `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (إذا تم اختيار Minimax)
- `tools.profile` (تكون القيمة الافتراضية للإعداد المحلي هي `"coding"` عند عدم تعيينها؛ وتُحفظ القيم الصريحة الموجودة)
- `gateway.*` (الوضع، والربط، والمصادقة، وTailscale)
- `session.dmScope` (تكون القيمة الافتراضية للإعداد المحلي هي `"per-channel-peer"` عند عدم تعيينها؛ وتُحفظ القيم الصريحة الموجودة. التفاصيل: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`، و`channels.discord.token`، و`channels.matrix.*`، و`channels.signal.*`، و`channels.imessage.*`
- قوائم السماح بالرسائل المباشرة للقنوات عند الاشتراك فيها أثناء مطالبات القنوات. يحوّل Discord وMatrix وMicrosoft Teams وSlack الأسماء إلى معرّفات متى أمكن؛ بينما تأخذ القنوات الأخرى المعرّفات مباشرةً (مثل معرّفات مرسلي Telegram الرقمية أو أرقام هواتف WhatsApp).
- `skills.install.nodeManager`
  - يقبل `setup --node-manager` القيم `npm` أو `pnpm` أو `bun`.
  - لا يزال من الممكن أن يستخدم الإعداد اليدوي `yarn` من خلال تعيين `skills.install.nodeManager` مباشرةً.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

يكتب `openclaw agents add` القيمة `agents.list[]` والقيمة الاختيارية `bindings`.

توضع بيانات اعتماد WhatsApp ضمن `~/.openclaw/credentials/whatsapp/<accountId>/`.
تُخزّن الجلسات النشطة والنصوص المفرّغة في
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. ويُستخدم
الدليل `~/.openclaw/agents/<agentId>/sessions/` لمدخلات الترحيل القديمة
وعناصر الأرشفة/الدعم.

تُقدَّم بعض القنوات على هيئة plugins. عند اختيار إحداها أثناء الإعداد، ستطالبك عملية الإعداد
بتثبيتها (من npm أو من مسار محلي) قبل أن تتمكن من تهيئتها.

## الوثائق ذات الصلة

- نظرة عامة على الإعداد: [الإعداد (CLI)](/ar/start/wizard)
- مرجع إعداد CLI: [مرجع إعداد CLI](/ar/start/wizard-cli-reference)
- إعداد تطبيق macOS: [الإعداد](/ar/start/onboarding)
- مرجع الإعدادات: [إعداد Gateway](/ar/gateway/configuration)
- الموفّرون: [WhatsApp](/ar/channels/whatsapp)، و[Telegram](/ar/channels/telegram)، و[Discord](/ar/channels/discord)، و[Google Chat](/ar/channels/googlechat)، و[Signal](/ar/channels/signal)، و[iMessage](/ar/channels/imessage)
- Skills: [Skills](/ar/tools/skills)، [إعدادات Skills](/ar/tools/skills-config)
