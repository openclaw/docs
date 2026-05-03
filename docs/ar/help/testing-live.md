---
read_when:
    - تشغيل مصفوفة النماذج الحية / الواجهة الخلفية لـ CLI / ACP / اختبارات الدخان لموفّر الوسائط
    - استكشاف أخطاء حل بيانات اعتماد الاختبارات المباشرة وإصلاحها
    - إضافة اختبار مباشر جديد خاص بموفّر
sidebarTitle: Live tests
summary: 'الاختبارات الحية (التي تتعامل مع الشبكة): مصفوفة النماذج، واجهات CLI الخلفية، ACP، موفرو الوسائط، بيانات الاعتماد'
title: 'الاختبار: مجموعات الاختبار الحية'
x-i18n:
    generated_at: "2026-05-03T07:33:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4057d8875fa3404108e89e4381c1dd14e96abbc2af13c4934fc6c0dbf878fc00
    source_path: help/testing-live.md
    workflow: 16
---

للبدء السريع، ومشغلات ضمان الجودة، ومجموعات اختبارات الوحدة/التكامل، وتدفقات Docker، راجع
[الاختبار](/ar/help/testing). تغطي هذه الصفحة مجموعات الاختبار **الحية** (التي تلامس الشبكة):
مصفوفة النماذج، وخلفيات CLI، وACP، واختبارات موفري الوسائط الحية، بالإضافة إلى
التعامل مع بيانات الاعتماد.

## حي: أوامر فحص الدخان للملف المحلي

حمّل `~/.profile` قبل الفحوصات الحية الارتجالية حتى تتطابق مفاتيح الموفرين ومسارات الأدوات
المحلية مع صدفتك:

```bash
source ~/.profile
```

فحص دخان آمن للوسائط:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

فحص دخان آمن لجاهزية المكالمات الصوتية:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` تشغيل تجريبي جاف ما لم يكن `--yes` موجودًا أيضًا. استخدم `--yes` فقط
عندما تريد عمدًا إجراء مكالمة إشعار حقيقية. بالنسبة إلى Twilio وTelnyx و
Plivo، يتطلب فحص الجاهزية الناجح عنوان URL عامًا لـ Webhook؛ ويتم رفض بدائل
local loopback/الخاصة المحلية حسب التصميم.

## حي: مسح قدرات Node Android

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر مُعلن عنه حاليًا** بواسطة Node Android متصل والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد مسبق/يدوي (لا تثبت المجموعة التطبيق أو تشغله أو تقرنه).
  - تحقق Gateway `node.invoke` لكل أمر على حدة لـ Node Android المحدد.
- الإعداد المسبق المطلوب:
  - تطبيق Android متصل ومقترن بالفعل بـ Gateway.
  - إبقاء التطبيق في المقدمة.
  - منح الأذونات/موافقة الالتقاط للقدرات التي تتوقع نجاحها.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## حي: فحص دخان النماذج (مفاتيح الملف الشخصي)

تنقسم الاختبارات الحية إلى طبقتين حتى نتمكن من عزل الإخفاقات:

- "النموذج المباشر" يخبرنا أن الموفر/النموذج يستطيع الإجابة أصلًا باستخدام المفتاح المحدد.
- "فحص دخان Gateway" يخبرنا أن مسار Gateway+الوكيل الكامل يعمل لذلك النموذج (الجلسات، السجل، الأدوات، سياسة صندوق العزل، إلخ).

### الطبقة 1: إكمال النموذج المباشر (دون Gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (وانحدارات موجهة عند الحاجة)
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- اضبط `OPENCLAW_LIVE_MODELS=modern` (أو `all`، كاسم مستعار للحديثة) لتشغيل هذه المجموعة فعليًا؛ وإلا فستتخطاها لإبقاء `pnpm test:live` مركزًا على فحص دخان Gateway
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` اسم مستعار لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - افتراضيًا، تستخدم مسوحات الحديثة/الكل حدًا منتقى عالي الإشارة؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لمسح حديث شامل أو رقمًا موجبًا لحد أصغر.
  - تستخدم المسوحات الشاملة `OPENCLAW_LIVE_TEST_TIMEOUT_MS` كمهلة اختبار النموذج المباشر بالكامل. الافتراضي: 60 دقيقة.
  - تعمل مجسات النموذج المباشر بتوازٍ من 20 مسارًا افتراضيًا؛ اضبط `OPENCLAW_LIVE_MODEL_CONCURRENCY` للتجاوز.
- كيفية اختيار الموفرين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن الملف الشخصي وبدائل البيئة
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن الملف الشخصي** فقط
- سبب وجود هذا:
  - يفصل "واجهة API للموفر معطلة / المفتاح غير صالح" عن "مسار وكيل Gateway معطل"
  - يحتوي انحدارات صغيرة ومعزولة (مثال: إعادة تشغيل استدلال OpenAI Responses/Codex Responses + تدفقات استدعاء الأدوات)

### الطبقة 2: فحص دخان Gateway + وكيل التطوير (ما يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل Gateway داخل العملية
  - إنشاء/ترقيع جلسة `agent:dev:*` (تجاوز النموذج لكل تشغيل)
  - التكرار عبر النماذج ذات المفاتيح والتحقق من:
    - استجابة "ذات معنى" (دون أدوات)
    - عمل استدعاء أداة حقيقي (مسبار قراءة)
    - مجسات أدوات إضافية اختيارية (مسبار تنفيذ+قراءة)
    - استمرار عمل مسارات انحدار OpenAI (استدعاء أداة فقط → متابعة)
- تفاصيل المجسات (حتى تتمكن من شرح الإخفاقات بسرعة):
  - مسبار `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل `read` قراءته وترديد nonce مرة أخرى.
  - مسبار `exec+read`: يطلب الاختبار من الوكيل استخدام `exec` لكتابة nonce في ملف مؤقت، ثم `read` لقراءته مرة أخرى.
  - مسبار الصورة: يرفق الاختبار صورة PNG مولدة (cat + رمز عشوائي) ويتوقع من النموذج إرجاع `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` اسم مستعار لقائمة السماح الحديثة
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - افتراضيًا، تستخدم مسوحات Gateway الحديثة/الكل حدًا منتقى عالي الإشارة؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لمسح حديث شامل أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار الموفرين (تجنب "كل شيء عبر OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- مجسات الأدوات + الصور مفعلة دائمًا في هذا الاختبار الحي:
  - مسبار `read` + مسبار `exec+read` (ضغط الأدوات)
  - يعمل مسبار الصورة عندما يعلن النموذج دعم إدخال الصور
  - التدفق (بمستوى عالٍ):
    - يولد الاختبار PNG صغيرًا يحتوي على "CAT" + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسله عبر `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التأكيد: يحتوي الرد على `cat` + الرمز (تسامح OCR: يُسمح بأخطاء طفيفة)

<Tip>
لمعرفة ما يمكنك اختباره على جهازك (ومعرفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## حي: فحص دخان خلفية CLI (Claude أو Codex أو Gemini أو غيرها من CLIs المحلية)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من مسار Gateway + الوكيل باستخدام خلفية CLI محلية، دون لمس إعداداتك الافتراضية.
- تعيش افتراضيات فحص الدخان الخاصة بالخلفية مع تعريف `cli-backend.ts` الخاص بالـ Plugin المالك.
- التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- الافتراضيات:
  - الموفر/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/الوسائط/الصورة من بيانات تعريف Plugin خلفية CLI المالكة.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في الموجه). تعطل وصفات Docker هذا افتراضيًا ما لم يُطلب صراحة.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من حقنها في الموجه.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عند ضبط `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دورة ثانية والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` للاشتراك في مسبار استمرارية الجلسة نفسها Claude Sonnet -> Opus عندما يدعم النموذج المحدد هدف تبديل. تعطل وصفات Docker هذا افتراضيًا من أجل موثوقية التجميع.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` للاشتراك في مسبار MCP/الأدوات عبر local loopback. تعطل وصفات Docker هذا افتراضيًا ما لم يُطلب صراحة.

مثال:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

فحص دخان رخيص لإعداد Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

هذا لا يطلب من Gemini توليد استجابة. يكتب إعدادات النظام نفسها
التي يعطيها OpenClaw لـ Gemini، ثم يشغل `gemini --debug mcp list` لإثبات أن خادم
`transport: "streamable-http"` المحفوظ يُطبّع إلى هيئة HTTP MCP الخاصة بـ Gemini
ويمكنه الاتصال بخادم MCP محلي يعمل عبر streamable-HTTP.

وصفة Docker:

```bash
pnpm test:docker:live-cli-backend
```

وصفات Docker لموفر واحد:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

ملاحظات:

- يوجد مشغل Docker في `scripts/test-live-cli-backend-docker.sh`.
- يشغل فحص دخان خلفية CLI الحي داخل صورة Docker للمستودع كمستخدم `node` غير جذر.
- يحل بيانات تعريف فحص دخان CLI من Plugin المالك، ثم يثبت حزمة CLI المناسبة لـ Linux (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزنة مؤقتًا عند `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` مصادقة OAuth محمولة لاشتراك Claude Code عبر إما `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. يثبت أولًا تشغيل `claude -p` المباشر في Docker، ثم يشغل دورتين لخلفية CLI في Gateway دون الاحتفاظ بمتغيرات بيئة مفتاح API الخاصة بـ Anthropic. يعطل مسار الاشتراك هذا مجسات Claude MCP/الأدوات والصور افتراضيًا لأن Claude يوجه حاليًا استخدام تطبيقات الطرف الثالث عبر فوترة استخدام إضافية بدلًا من حدود خطة الاشتراك العادية.
- يمارس فحص دخان خلفية CLI الحي الآن التدفق نفسه من البداية إلى النهاية لـ Claude وCodex وGemini: دورة نصية، ودورة تصنيف صورة، ثم استدعاء أداة MCP `cron` متحقق منه عبر CLI Gateway.
- يقوم فحص دخان Claude الافتراضي أيضًا بترقيع الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة ما زالت تتذكر ملاحظة سابقة.

## حي: فحص دخان ربط ACP (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط محادثة ACP الحقيقي باستخدام وكيل ACP مباشر:
  - أرسل `/acp spawn <agent> --bind here`
  - اربط محادثة قناة رسائل اصطناعية في مكانها
  - أرسل متابعة عادية في المحادثة نفسها
  - تحقق من أن المتابعة تصل إلى نص جلسة ACP المرتبطة
- التفعيل:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- القيم الافتراضية:
  - وكلاء ACP في Docker: `claude,codex,gemini`
  - وكيل ACP للتشغيل المباشر عبر `pnpm test:live ...`: `claude`
  - القناة الاصطناعية: سياق محادثة بنمط رسالة مباشرة في Slack
  - خلفية ACP: `acpx`
- التجاوزات:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- ملاحظات:
  - يستخدم هذا المسار سطح Gateway `chat.send` مع حقول مسار منشأ اصطناعية مخصّصة للمشرفين فقط، بحيث يمكن للاختبارات إرفاق سياق قناة الرسائل من دون التظاهر بالتسليم خارجياً.
  - عند عدم ضبط `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND`، يستخدم الاختبار سجل الوكلاء المدمج في Plugin `acpx` المضمن لوكيل حزمة اختبار ACP المحدد.
  - إنشاء MCP الخاص بـ Cron للجلسة المرتبطة يكون بأفضل جهد افتراضياً، لأن حزم اختبار ACP الخارجية يمكن أن تلغي استدعاءات MCP بعد نجاح إثبات الربط/الصورة؛ اضبط `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` لجعل فحص Cron اللاحق للربط صارماً.

مثال:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

وصفة Docker:

```bash
pnpm test:docker:live-acp-bind
```

وصفات Docker لوكيل واحد:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

ملاحظات Docker:

- مشغّل Docker موجود في `scripts/test-live-acp-bind-docker.sh`.
- افتراضياً، يشغّل فحص ACP bind smoke على وكلاء CLI المباشرين المجمّعين بالتسلسل: `claude`، ثم `codex`، ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` لتضييق المصفوفة.
- يحمّل `~/.profile`، ويجهّز مادة مصادقة CLI المطابقة داخل الحاوية، ثم يثبت CLI المباشر المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو Factory Droid عبر `https://app.factory.ai/cli` أو `@google/gemini-cli` أو `opencode-ai`) إذا كان مفقوداً. خلفية ACP نفسها هي حزمة `acpx/runtime` المدمجة من Plugin `acpx` الرسمي.
- متغير Docker الخاص بـ Droid يجهّز `~/.factory` للإعدادات، ويمرر `FACTORY_API_KEY`، ويتطلب مفتاح API هذا لأن مصادقة Factory OAuth/keyring المحلية غير قابلة للنقل إلى الحاوية. يستخدم إدخال السجل المدمج في ACPX وهو `droid exec --output-format acp`.
- متغير Docker الخاص بـ OpenCode هو مسار انحدار صارم لوكيل واحد. يكتب نموذجاً افتراضياً مؤقتاً في `OPENCODE_CONFIG_CONTENT` من `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (الافتراضي `opencode/kimi-k2.6`) بعد تحميل `~/.profile`، ويتطلب `pnpm test:docker:live-acp-bind:opencode` نص مساعد مرتبط بدلاً من قبول التخطي العام بعد الربط.
- استدعاءات CLI المباشرة لـ `acpx` ليست إلا مساراً يدوياً/تحايلياً لمقارنة السلوك خارج Gateway. يفحص ACP bind smoke في Docker خلفية وقت تشغيل `acpx` المدمجة في OpenClaw.

## مباشر: فحص smoke لحزمة اختبار خادم تطبيق Codex

- الهدف: التحقق من حزمة اختبار Codex المملوكة للـ Plugin عبر طريقة Gateway العادية
  `agent`:
  - تحميل Plugin `codex` المضمن
  - تحديد `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول دورة وكيل Gateway إلى `openai/gpt-5.5` مع فرض حزمة اختبار Codex
  - إرسال دورة ثانية إلى جلسة OpenClaw نفسها والتحقق من أن خيط خادم التطبيق
    يمكنه الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار أمر Gateway نفسه
  - اختيارياً، تشغيل فحصين لقشرة مصعّدين راجعهما Guardian: أمر حميد
    ينبغي أن تتم الموافقة عليه ورفع سر وهمي ينبغي رفضه كي يطلب الوكيل رداً
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `openai/gpt-5.5`
- فحص الصورة الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- فحص MCP/الأداة الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- فحص Guardian الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- يستخدم فحص smoke `agentRuntime.id: "codex"` حتى لا تتمكن حزمة اختبار Codex المعطلة
  من النجاح عبر الرجوع الصامت إلى PI.
- المصادقة: مصادقة خادم تطبيق Codex من تسجيل دخول اشتراك Codex المحلي. يمكن لفحوص smoke في Docker
  أيضاً توفير `OPENAI_API_KEY` لفحوص غير Codex عند الاقتضاء،
  إضافة إلى نسخ اختيارية من `~/.codex/auth.json` و`~/.codex/config.toml`.

وصفة محلية:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

وصفة Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

ملاحظات Docker:

- مشغّل Docker موجود في `scripts/test-live-codex-harness-docker.sh`.
- يحمّل `~/.profile` المركّب، ويمرر `OPENAI_API_KEY`، وينسخ ملفات مصادقة Codex CLI
  عند وجودها، ويثبت `@openai/codex` في بادئة npm مركبة قابلة للكتابة،
  ويجهّز شجرة المصدر، ثم يشغّل اختبار Codex-harness المباشر فقط.
- يفعّل Docker فحوص الصورة وMCP/الأداة وGuardian افتراضياً. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` عندما تحتاج إلى تشغيل تصحيح أضيق.
- يستخدم Docker إعداد وقت تشغيل Codex الصريح نفسه، لذلك لا يمكن للأسماء المستعارة القديمة أو الرجوع إلى PI
  إخفاء انحدار في حزمة اختبار Codex.

### وصفات مباشرة موصى بها

قوائم السماح الضيقة والصريحة هي الأسرع والأقل عرضة للتقطع:

- نموذج واحد، مباشر (من دون Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، فحص smoke عبر Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة مزودين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تركيز Google (مفتاح Gemini API + Antigravity):
  - Gemini (مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- فحص smoke للتفكير التكيفي في Google:
  - إذا كانت المفاتيح المحلية في ملف تعريف القشرة: `source ~/.profile`
  - الافتراضي الديناميكي لـ Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - ميزانية Gemini 2.5 الديناميكية: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

ملاحظات:

- يستخدم `google/...` Gemini API (مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity OAuth (نقطة نهاية وكيل بنمط Cloud Code Assist).
- يستخدم `google-gemini-cli/...` Gemini CLI المحلي على جهازك (مصادقة منفصلة وخصوصيات أدوات).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة لدى Google عبر HTTP (مفتاح API / مصادقة ملف تعريف)؛ وهذا ما يعنيه معظم المستخدمين بـ “Gemini”.
  - CLI: ينفّذ OpenClaw ملف `gemini` المحلي عبر القشرة؛ وله مصادقته الخاصة وقد يتصرف بشكل مختلف (دعم البث/الأدوات/اختلاف الإصدارات).

## مباشر: مصفوفة النماذج (ما نغطيه)

لا توجد “قائمة نماذج CI” ثابتة (التشغيل المباشر اختياري)، لكن هذه هي النماذج **الموصى بها** للتغطية المنتظمة على جهاز تطوير يحتوي على المفاتيح.

### مجموعة smoke حديثة (استدعاء أدوات + صورة)

هذا هو تشغيل “النماذج الشائعة” الذي نتوقع أن يظل يعمل:

- OpenAI (غير Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview` (تجنب نماذج Gemini 2.x الأقدم)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و`google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` و`deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

شغّل فحص smoke عبر Gateway مع الأدوات + الصورة:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### الأساس: استدعاء الأدوات (Read + Exec اختياري)

اختر نموذجاً واحداً على الأقل لكل عائلة مزودين:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (مفيدة):

- xAI: `xai/grok-4.3` (أو أحدث متاح)
- Mistral: `mistral/`… (اختر نموذجاً واحداً يدعم “tools” ومفعّلاً لديك)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### الرؤية: إرسال صورة (مرفق → رسالة متعددة الوسائط)

ضمّن نموذجاً واحداً على الأقل يدعم الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (متغيرات Claude/Gemini/OpenAI الداعمة للرؤية، إلخ) لتشغيل فحص الصورة.

### المجمّعات / البوابات البديلة

إذا كانت لديك مفاتيح مفعّلة، ندعم أيضاً الاختبار عبر:

- OpenRouter: `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين يدعمون الأدوات+الصورة)
- OpenCode: `opencode/...` لـ Zen و`opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزودون إضافيون يمكنك تضمينهم في المصفوفة المباشرة (إذا كانت لديك بيانات اعتماد/إعدادات):

- المدمجون: `openai`، `openai-codex`، `anthropic`، `google`، `google-vertex`، `google-antigravity`، `google-gemini-cli`، `zai`، `openrouter`، `opencode`، `opencode-go`، `xai`، `groq`، `cerebras`، `mistral`، `github-copilot`
- عبر `models.providers` (نقاط نهاية مخصصة): `minimax` (سحابة/API)، إضافة إلى أي وسيط متوافق مع OpenAI/Anthropic (LM Studio وvLLM وLiteLLM، إلخ)

<Tip>
لا تثبّت "all models" بشكل صريح في المستندات. القائمة المرجعية هي كل ما تُرجعه `discoverModels(...)` على جهازك إضافة إلى أي مفاتيح متاحة.
</Tip>

## بيانات الاعتماد (لا تلتزم بها أبداً)

تكتشف الاختبارات المباشرة بيانات الاعتماد بالطريقة نفسها التي يستخدمها CLI. الآثار العملية:

- إذا كان CLI يعمل، فينبغي للاختبارات الحية أن تعثر على المفاتيح نفسها.
- إذا قال اختبار حي "no creds"، فصحّح ذلك بالطريقة نفسها التي تصحّح بها `openclaw models list` / اختيار النموذج.

- ملفات تعريف المصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (هذا ما تعنيه "مفاتيح ملف التعريف" في الاختبارات الحية)
- الإعدادات: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- مجلد الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى المنزل الحي المرحلي عند وجوده، لكنه ليس مخزن مفاتيح ملف التعريف الرئيسي)
- تنسخ عمليات التشغيل الحية المحلية الإعدادات النشطة، وملفات `auth-profiles.json` لكل وكيل، و`credentials/` القديمة، ومجلدات مصادقة CLI الخارجية المدعومة إلى منزل اختبار مؤقت افتراضيًا؛ وتتخطى المنازل الحية المرحلية `workspace/` و`sandboxes/`، وتُزال تجاوزات مسارات `agents.*.workspace` / `agentDir` حتى تبقى عمليات الفحص بعيدة عن مساحة عمل مضيفك الحقيقية.

إذا أردت الاعتماد على مفاتيح البيئة (مثلًا المصدّرة في `~/.profile`)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغلات Docker أدناه (يمكنها وصل `~/.profile` داخل الحاوية).

## Deepgram حي (نسخ الصوت)

- الاختبار: `extensions/deepgram/audio.live.test.ts`
- التفعيل: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## خطة ترميز BytePlus حية

- الاختبار: `extensions/byteplus/live.test.ts`
- التفعيل: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- تجاوز النموذج اختياريًا: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## وسائط سير عمل ComfyUI الحية

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يختبر مسارات comfy المضمّنة للصور والفيديو و`music_generate`
  - يتخطى كل قدرة ما لم تكن `plugins.entries.comfy.config.<capability>` مهيأة
  - مفيد بعد تغيير إرسال سير عمل comfy، أو الاستقصاء، أو التنزيلات، أو تسجيل Plugin

## توليد الصور الحي

- الاختبار: `test/image-generation.runtime.live.test.ts`
- الأمر: `pnpm test:live test/image-generation.runtime.live.test.ts`
- أداة الاختبار: `pnpm test:live:media image`
- النطاق:
  - يحصي كل Plugin مزوّد مسجل لتوليد الصور
  - يحمّل متغيرات بيئة المزوّد الناقصة من صدفة تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملف تعريف/نموذجًا قابلًا للاستخدام
  - يشغّل كل مزوّد مهيأ عبر وقت تشغيل توليد الصور المشترك:
    - `<provider>:generate`
    - `<provider>:edit` عندما يعلن المزوّد دعم التحرير
- المزوّدون المضمّنون الحاليون المشمولون:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- تضييق اختياري:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض المصادقة عبر مخزن ملفات التعريف وتجاهل التجاوزات المعتمدة على البيئة فقط

لمسار CLI المشحون، أضف فحص `infer` سريعًا بعد نجاح الاختبار الحي للمزوّد/وقت التشغيل:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

يغطي هذا تحليل وسائط CLI، وحل الإعدادات/الوكيل الافتراضي، وتفعيل Plugin المضمّن، ووقت تشغيل توليد الصور المشترك، وطلب المزوّد الحي. من المتوقع أن تكون اعتماديات Plugin موجودة قبل تحميل وقت التشغيل.

## توليد الموسيقى الحي

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- أداة الاختبار: `pnpm test:live:media music`
- النطاق:
  - يختبر مسار مزوّد توليد الموسيقى المضمّن المشترك
  - يغطي حاليًا Google وMiniMax
  - يحمّل متغيرات بيئة المزوّد من صدفة تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملف تعريف/نموذجًا قابلًا للاستخدام
  - يشغّل نمطي وقت التشغيل المعلنين عند توفرهما:
    - `generate` مع إدخال قائم على الموجّه فقط
    - `edit` عندما يعلن المزوّد `capabilities.edit.enabled`
  - تغطية المسار المشترك الحالية:
    - `google`: `generate`، `edit`
    - `minimax`: `generate`
    - `comfy`: ملف Comfy حي منفصل، وليس هذا الفحص المشترك
- تضييق اختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض المصادقة عبر مخزن ملفات التعريف وتجاهل التجاوزات المعتمدة على البيئة فقط

## توليد الفيديو الحي

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- أداة الاختبار: `pnpm test:live:media video`
- النطاق:
  - يختبر مسار مزوّد توليد الفيديو المضمّن المشترك
  - يعتمد افتراضيًا مسار الفحص السريع الآمن للإصدار: مزوّدون غير FAL، وطلب نص إلى فيديو واحد لكل مزوّد، وموجّه لوبستر مدته ثانية واحدة، وحد عملية لكل مزوّد من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` افتراضيًا)
  - يتخطى FAL افتراضيًا لأن زمن انتظار طابور المزوّد قد يهيمن على وقت الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحةً
  - يحمّل متغيرات بيئة المزوّد من صدفة تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملف تعريف/نموذجًا قابلًا للاستخدام
  - يشغّل `generate` فقط افتراضيًا
  - عيّن `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن المزوّد `capabilities.imageToVideo.enabled` ويقبل المزوّد/النموذج المختار إدخال صورة محلية مدعومًا بمخزن مؤقت في الفحص المشترك
    - `videoToVideo` عندما يعلن المزوّد `capabilities.videoToVideo.enabled` ويقبل المزوّد/النموذج المختار إدخال فيديو محلي مدعومًا بمخزن مؤقت في الفحص المشترك
  - مزوّدو `imageToVideo` المعلنون لكن المتخطون حاليًا في الفحص المشترك:
    - `vydra` لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب عنوان URL لصورة بعيدة
  - تغطية Vydra الخاصة بالمزوّد:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل ذلك الملف `veo3` للنص إلى الفيديو بالإضافة إلى مسار `kling` يستخدم مثبت عنوان URL لصورة بعيدة افتراضيًا
  - تغطية `videoToVideo` الحية الحالية:
    - `runway` فقط عندما يكون النموذج المختار هو `runway/gen4_aleph`
  - مزوّدو `videoToVideo` المعلنون لكن المتخطون حاليًا في الفحص المشترك:
    - `alibaba`، `qwen`، `xai` لأن هذه المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة من نوع `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا مدعومًا بمخزن مؤقت، وهذا المسار غير مقبول في الفحص المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات الوصول الخاصة بالمؤسسة إلى ترميم/إعادة مزج الفيديو
- تضييق اختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزوّد في الفحص الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل حد كل عملية مزوّد لفحص سريع مكثف
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض المصادقة عبر مخزن ملفات التعريف وتجاهل التجاوزات المعتمدة على البيئة فقط

## أداة اختبار الوسائط الحية

- الأمر: `pnpm test:live:media`
- الغرض:
  - تشغّل مجموعات الاختبارات الحية المشتركة للصور والموسيقى والفيديو عبر نقطة دخول أصلية في المستودع
  - تحمّل تلقائيًا متغيرات بيئة المزوّد الناقصة من `~/.profile`
  - تضيّق تلقائيًا كل مجموعة إلى المزوّدين الذين يملكون حاليًا مصادقة قابلة للاستخدام افتراضيًا
  - تعيد استخدام `scripts/test-live.mjs`، لذلك يبقى سلوك Heartbeat والوضع الهادئ متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ذات صلة

- [الاختبار](/ar/help/testing) — مجموعات اختبارات الوحدة والتكامل وQA وDocker
