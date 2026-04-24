---
read_when:
    - تشغيل اختبارات smoke الحية لمصفوفة النماذج / الواجهات الخلفية لـ CLI / ACP / مزوّدي الوسائط
    - تصحيح أخطاء تحليل بيانات الاعتماد الخاصة بالاختبارات الحية
    - إضافة اختبار حي جديد خاص بمزوّد معين
sidebarTitle: Live tests
summary: 'الاختبارات الحية (التي تلمس الشبكة): مصفوفة النماذج، وواجهات CLI الخلفية، وACP، ومزوّدو الوسائط، وبيانات الاعتماد'
title: 'الاختبار: المجموعات الحية'
x-i18n:
    generated_at: "2026-04-24T07:46:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03689542176843de6e0163011250d1c1225ee5af492f88acf945b242addd1cc9
    source_path: help/testing-live.md
    workflow: 15
---

للحصول على بدء سريع، وQA runners، ومجموعات unit/integration، وتدفقات Docker، راجع
[الاختبار](/ar/help/testing). تغطي هذه الصفحة مجموعات الاختبار **الحية** (التي تلمس الشبكة):
مصفوفة النماذج، وواجهات CLI الخلفية، وACP، واختبارات مزوّدي الوسائط الحية، بالإضافة
إلى التعامل مع بيانات الاعتماد.

## حي: مسح قدرات Android node

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر مُعلن عنه حاليًا** من Android node متصلة، والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد مسبق/يدوي (المجموعة لا تثبّت التطبيق ولا تشغّله ولا تقترنه).
  - تحقق `node.invoke` في gateway لكل أمر على Android node المحددة.
- الإعداد المسبق المطلوب:
  - أن يكون تطبيق Android متصلًا بالفعل ومقترنًا مع gateway.
  - إبقاء التطبيق في المقدمة.
  - منح الأذونات/موافقات الالتقاط للقدرات التي تتوقع نجاحها.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## حي: smoke للنموذج (مفاتيح الملفات الشخصية)

تنقسم الاختبارات الحية إلى طبقتين حتى نتمكن من عزل الإخفاقات:

- يوضح "النموذج المباشر" ما إذا كان المزوّد/النموذج يستطيع الرد أصلًا بالمفتاح المعطى.
- يوضح "Gateway smoke" ما إذا كان خط أنابيب gateway+agent الكامل يعمل لهذا النموذج (الجلسات، والسجل، والأدوات، وسياسة sandbox، وما إلى ذلك).

### الطبقة 1: إكمال النموذج المباشر (من دون gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لتحديد النماذج التي لديك بيانات اعتماد لها
  - تشغيل عملية إكمال صغيرة لكل نموذج (ومسارات انحدار مستهدفة عند الحاجة)
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- اضبط `OPENCLAW_LIVE_MODELS=modern` (أو `all`، وهو اسم بديل لـ modern) لتشغيل هذه المجموعة فعليًا؛ وإلا فسيتم تخطيها للإبقاء على تركيز `pnpm test:live` على Gateway smoke
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.2 + Codex، وGemini 3، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تستخدم عمليات المسح modern/all افتراضيًا حدًا عالي الإشارة ومنتقى بعناية؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لإجراء مسح حديث شامل أو قيمة موجبة لحد أصغر.
  - تستخدم عمليات المسح الشاملة `OPENCLAW_LIVE_TEST_TIMEOUT_MS` كمهلة للمجموعة الكاملة لاختبار النموذج المباشر. الافتراضي: 60 دقيقة.
  - تعمل عمليات probe الخاصة بالنموذج المباشر بتوازٍ قدره 20 مسارًا افتراضيًا؛ استخدم `OPENCLAW_LIVE_MODEL_CONCURRENCY` للتجاوز.
- كيفية اختيار المزوّدين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن الملفات الشخصية والبدائل الاحتياطية من env
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن الملفات الشخصية** فقط
- لماذا يوجد هذا:
  - يفصل بين “واجهة API الخاصة بالمزوّد معطلة / المفتاح غير صالح” و“خط أنابيب وكيل gateway معطل”
  - يحتوي على انحدارات صغيرة ومعزولة (مثال: تدفقات إعادة تشغيل reasoning في OpenAI Responses/Codex Responses + استدعاءات الأدوات)

### الطبقة 2: Gateway + smoke لوكيل التطوير (ما يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل gateway داخل العملية
  - إنشاء/ترقيع جلسة `agent:dev:*` (مع تجاوز للنموذج في كل تشغيل)
  - التكرار على النماذج التي لها مفاتيح والتحقق من:
    - استجابة “ذات معنى” (من دون أدوات)
    - أن استدعاء أداة حقيقي يعمل (probe للقراءة)
    - probes أدوات إضافية اختيارية (probe لـ exec+read)
    - استمرار عمل مسارات الانحدار الخاصة بـ OpenAI (استدعاء أداة فقط → متابعة)
- تفاصيل الـ probe (حتى تتمكن من شرح الإخفاقات بسرعة):
  - `read` probe: يكتب الاختبار ملف nonce داخل مساحة العمل ويطلب من الوكيل `read` له وإرجاع nonce.
  - `exec+read` probe: يطلب الاختبار من الوكيل كتابة nonce عبر `exec` في ملف مؤقت، ثم `read` له مرة أخرى.
  - image probe: يرفق الاختبار ملف PNG مولّدًا (قط + رمز عشوائي) ويتوقع من النموذج إرجاع `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.2 + Codex، وGemini 3، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم عمليات المسح الحديثة/الكلية للـ gateway افتراضيًا حدًا عالي الإشارة ومنتقى بعناية؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لإجراء مسح حديث شامل أو قيمة موجبة لحد أصغر.
- كيفية اختيار المزوّدين (لتجنب “OpenRouter لكل شيء”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- تكون probes الأدوات + الصور مفعّلة دائمًا في هذا الاختبار الحي:
  - `read` probe + `exec+read` probe (ضغط على الأدوات)
  - يعمل image probe عندما يعلن النموذج دعم إدخال الصور
  - التدفق (نظرة عامة):
    - يولّد الاختبار ملف PNG صغيرًا يحتوي على “CAT” + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسله عبر `agent` باستخدام `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - تقوم Gateway بتحليل المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمّن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: يحتوي الرد على `cat` + الرمز (يُسمح بأخطاء طفيفة في OCR)

نصيحة: لمعرفة ما يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

## حي: smoke لواجهة CLI الخلفية (Claude، أو Codex، أو Gemini، أو واجهات CLI محلية أخرى)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من خط أنابيب Gateway + agent باستخدام واجهة CLI خلفية محلية، من دون لمس الإعداد الافتراضي لديك.
- تعيش القيم الافتراضية الخاصة بـ smoke لكل واجهة خلفية مع تعريف `cli-backend.ts` الخاص بالامتداد المالك.
- التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- القيم الافتراضية:
  - المزوّد/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي السلوك الخاص بالأمر/الوسائط/الصور من بيانات Plugin الخاصة بواجهة CLI الخلفية المالكة.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في المطالبة).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من حقنها في المطالبة.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عندما يكون `IMAGE_ARG` مضبوطًا.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دور ثانٍ والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` لتعطيل probe الافتراضي لاستمرارية الجلسة نفسها من Claude Sonnet إلى Opus (اضبطه على `1` لفرض تفعيله عندما يدعم النموذج المحدد هدف تبديل).

مثال:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

وصفة Docker:

```bash
pnpm test:docker:live-cli-backend
```

وصفات Docker لمزوّد واحد:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

ملاحظات:

- يوجد Docker runner في `scripts/test-live-cli-backend-docker.sh`.
- يشغّل smoke الخاص بواجهة CLI الخلفية الحية داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير الجذر.
- يحل بيانات smoke الخاصة بواجهة CLI من الامتداد المالك، ثم يثبّت حزمة CLI المناسبة لنظام Linux (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) ضمن بادئة قابلة للكتابة ومخزنة مؤقتًا في `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` مصادقة OAuth محمولة لاشتراك Claude Code من خلال `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. وهو يثبت أولًا نجاح `claude -p` مباشرة في Docker، ثم يشغّل دورين لواجهة Gateway CLI الخلفية من دون الحفاظ على متغيرات env الخاصة بمفتاح Anthropic API. ويعطّل هذا المسار الخاص بالاشتراك probes الخاصة بـ Claude MCP/tool والصور افتراضيًا لأن Claude يوجّه حاليًا استخدام تطبيقات الجهات الثالثة عبر فوترة استخدام إضافي بدل حدود خطة الاشتراك العادية.
- أصبح smoke الخاص بواجهة CLI الخلفية الحية الآن يمارس التدفق الكامل نفسه من البداية إلى النهاية لكل من Claude وCodex وGemini: دور نصي، ثم دور تصنيف صورة، ثم استدعاء أداة MCP `cron` يتم التحقق منه عبر gateway CLI.
- كما يقوم smoke الافتراضي لـ Claude بترقيع الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة ما تزال تتذكر ملاحظة سابقة.

## حي: smoke لربط ACP (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط المحادثة الحقيقي في ACP مع وكيل ACP حي:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة اصطناعية لقناة رسائل في مكانها
  - إرسال متابعة عادية على المحادثة نفسها
  - التحقق من أن المتابعة تصل إلى transcript الجلسة المرتبطة بـ ACP
- التفعيل:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- القيم الافتراضية:
  - وكلاء ACP في Docker: `claude,codex,gemini`
  - وكيل ACP لاستخدام `pnpm test:live ...` المباشر: `claude`
  - القناة الاصطناعية: سياق محادثة بنمط رسائل Slack الخاصة
  - الواجهة الخلفية لـ ACP: `acpx`
- التجاوزات:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- ملاحظات:
  - يستخدم هذا المسار سطح `chat.send` في gateway مع حقول originating-route اصطناعية مخصصة للمشرف فقط حتى تتمكن الاختبارات من إرفاق سياق قناة الرسائل من دون ادعاء التسليم خارجيًا.
  - عندما لا تكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` مضبوطة، يستخدم الاختبار سجل الوكلاء المضمّن في Plugin `acpx` لوكيل ACP harness المحدد.

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
pnpm test:docker:live-acp-bind:gemini
```

ملاحظات Docker:

- يوجد Docker runner في `scripts/test-live-acp-bind-docker.sh`.
- افتراضيًا، يشغّل smoke ربط ACP على جميع وكلاء CLI الحية المدعومة بالتتابع: `claude`، ثم `codex`، ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` لتضييق المصفوفة.
- يقوم بتحميل `~/.profile`، وتجهيز مواد المصادقة الخاصة بواجهة CLI المطابقة داخل الحاوية، وتثبيت `acpx` ضمن بادئة npm قابلة للكتابة، ثم يثبّت واجهة CLI الحية المطلوبة (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) إذا كانت مفقودة.
- داخل Docker، يضبط runner القيمة `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` بحيث يحتفظ acpx بمتغيرات env الخاصة بالمزوّد والمحمّلة من profile متاحة لواجهة harness CLI الفرعية.

## حي: smoke لحزمة Codex app-server

- الهدف: التحقق من Codex harness المملوك للـ Plugin عبر المسار العادي
  للطريقة `agent` في gateway:
  - تحميل Plugin `codex` المضمّن
  - اختيار `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول دور وكيل في gateway إلى `openai/gpt-5.2` مع فرض Codex harness
  - إرسال دور ثانٍ إلى جلسة OpenClaw نفسها والتحقق من أن خيط app-server
    يمكنه الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار أوامر gateway نفسه
  - اختياريًا تشغيل اثنين من probes الصدفية المرتفعة الصلاحيات والمراجعة بواسطة Guardian: أحدهما
    أمر غير ضار يجب الموافقة عليه، والآخر رفع زائف لسر يجب
    رفضه حتى يطلب الوكيل الرجوع
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `openai/gpt-5.2`
- probe الصورة الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- probe MCP/tool الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- probe Guardian الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- يضبط smoke القيمة `OPENCLAW_AGENT_HARNESS_FALLBACK=none` حتى لا يتمكن Codex
  harness المعطل من النجاح عبر الرجوع بصمت إلى PI.
- المصادقة: مصادقة Codex app-server من تسجيل الدخول المحلي لاشتراك Codex. ويمكن لاختبارات
  smoke في Docker أيضًا توفير `OPENAI_API_KEY` لعمليات probe غير Codex عند الحاجة،
  بالإضافة إلى نسخ اختيارية من `~/.codex/auth.json` و`~/.codex/config.toml`.

وصفة محلية:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

وصفة Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

ملاحظات Docker:

- يوجد Docker runner في `scripts/test-live-codex-harness-docker.sh`.
- يقوم بتحميل `~/.profile` المركبة، ويمرر `OPENAI_API_KEY`، وينسخ ملفات مصادقة Codex CLI
  عند وجودها، ويثبّت `@openai/codex` ضمن بادئة npm مركبة قابلة للكتابة،
  ويجهّز شجرة المصدر، ثم يشغّل فقط الاختبار الحي لـ Codex-harness.
- يفعّل Docker probes الخاصة بالصور وMCP/tool وGuardian افتراضيًا. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` عندما تحتاج إلى تشغيل
  أضيق لأغراض التصحيح.
- يصدّر Docker أيضًا `OPENCLAW_AGENT_HARNESS_FALLBACK=none`، بما يطابق إعداد
  الاختبار الحي بحيث لا تستطيع الأسماء البديلة القديمة أو الرجوع إلى PI إخفاء
  انحدار Codex harness.

### وصفات حية موصى بها

قوائم السماح الضيقة والصريحة هي الأسرع والأقل عرضة للتذبذب:

- نموذج واحد، مباشر (من دون gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة مزوّدين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- التركيز على Google (مفتاح Gemini API + Antigravity):
  - Gemini (مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

ملاحظات:

- يستخدم `google/...` واجهة Gemini API (مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity OAuth (نقطة نهاية وكيل على نمط Cloud Code Assist).
- يستخدم `google-gemini-cli/...` واجهة Gemini CLI المحلية على جهازك (مع مصادقة منفصلة وخصائص مختلفة للأدوات).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP (مصادقة مفتاح API / الملف الشخصي)؛ وهذا ما يقصده معظم المستخدمين عند قول “Gemini”.
  - CLI: يستدعي OpenClaw ملف `gemini` التنفيذي المحلي؛ وله مصادقته الخاصة ويمكن أن يتصرف بشكل مختلف (البث/دعم الأدوات/اختلاف الإصدارات).

## حي: مصفوفة النماذج (ما الذي نغطيه)

لا توجد “قائمة نماذج CI” ثابتة (فالاختبارات الحية اختيارية)، لكن هذه هي النماذج **الموصى بها** للتغطية المنتظمة على جهاز تطوير يملك مفاتيح.

### مجموعة smoke الحديثة (استدعاء الأدوات + الصور)

هذا هو تشغيل “النماذج الشائعة” الذي نتوقع أن يبقى عاملًا:

- OpenAI (غير Codex): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview` (تجنب النماذج الأقدم Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و`google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

شغّل Gateway smoke مع الأدوات + الصور:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### خط الأساس: استدعاء الأدوات (Read + Exec اختياري)

اختر على الأقل نموذجًا واحدًا من كل عائلة مزوّد:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (من الجيد وجودها):

- xAI: `xai/grok-4` (أو أحدث ما هو متاح)
- Mistral: `mistral/`… (اختر نموذجًا واحدًا يدعم “tools” ويكون مفعّلًا لديك)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### الرؤية: إرسال صورة (مرفق → رسالة متعددة الوسائط)

ضمّن نموذجًا واحدًا على الأقل قادرًا على الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/OpenAI القادرة على الرؤية، إلخ) لتشغيل image probe.

### المجمعات / البوابات البديلة

إذا كانت لديك مفاتيح مفعّلة، فنحن ندعم أيضًا الاختبار عبر:

- OpenRouter: `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين يدعمون الأدوات + الصور)
- OpenCode: `opencode/...` لـ Zen و`opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزوّدون إضافيون يمكنك تضمينهم في المصفوفة الحية (إذا كانت لديك بيانات اعتماد/إعداد):

- مضمّن: `openai`، `openai-codex`، `anthropic`، `google`، `google-vertex`، `google-antigravity`، `google-gemini-cli`، `zai`، `openrouter`، `opencode`، `opencode-go`، `xai`، `groq`، `cerebras`، `mistral`، `github-copilot`
- عبر `models.providers` (نقاط نهاية مخصصة): `minimax` (سحابي/API)، بالإضافة إلى أي proxy متوافق مع OpenAI/Anthropic (LM Studio، وvLLM، وLiteLLM، وما إلى ذلك)

نصيحة: لا تحاول ترميز “كل النماذج” بشكل ثابت في الوثائق. فالقائمة المرجعية هي ما تعيده `discoverModels(...)` على جهازك + أي مفاتيح متاحة.

## بيانات الاعتماد (لا تلتزم بها أبدًا)

تكتشف الاختبارات الحية بيانات الاعتماد بالطريقة نفسها التي يفعلها CLI. والنتائج العملية:

- إذا كان CLI يعمل، فيجب أن تجد الاختبارات الحية المفاتيح نفسها.
- إذا أخبرك اختبار حي بأنه “لا توجد بيانات اعتماد”، فصحح الأمر بالطريقة نفسها التي تصحح بها `openclaw models list` / اختيار النموذج.

- ملفات تعريف المصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (هذا هو المقصود بـ “profile keys” في الاختبارات الحية)
- الإعداد: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى home الاختبار المرحلي عند وجوده، لكنه ليس مخزن مفاتيح الملف الشخصي الرئيسي)
- تقوم التشغيلات الحية المحلية افتراضيًا بنسخ الإعداد النشط، وملفات `auth-profiles.json` الخاصة بكل وكيل، و`credentials/` القديمة، وأدلة مصادقة CLI الخارجية المدعومة إلى home اختبار مؤقت؛ بينما تتخطى البيئات الحية المرحلية `workspace/` و`sandboxes/`، وتتم إزالة تجاوزات المسار الخاصة بـ `agents.*.workspace` / `agentDir` حتى تبقى probes بعيدة عن مساحة العمل الحقيقية على المضيف.

إذا كنت تريد الاعتماد على مفاتيح env (مثل تلك المصدرة في `~/.profile`)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم Docker runners أدناه (فهي تستطيع تركيب `~/.profile` داخل الحاوية).

## Deepgram حي (نسخ الصوت)

- الاختبار: `extensions/deepgram/audio.live.test.ts`
- التفعيل: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan حي

- الاختبار: `extensions/byteplus/live.test.ts`
- التفعيل: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- تجاوز النموذج الاختياري: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media حي

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يمارس مسارات comfy المضمّنة الخاصة بالصور والفيديو و`music_generate`
  - يتخطى كل قدرة ما لم يكن `models.providers.comfy.<capability>` مضبوطًا
  - مفيد بعد تغيير إرسال workflow الخاصة بـ comfy، أو polling، أو التنزيلات، أو تسجيل Plugin

## توليد الصور حي

- الاختبار: `test/image-generation.runtime.live.test.ts`
- الأمر: `pnpm test:live test/image-generation.runtime.live.test.ts`
- الحزام: `pnpm test:live:media image`
- النطاق:
  - يعدّد كل Plugin مسجل لتوليد الصور
  - يحمّل متغيرات env الناقصة الخاصة بالمزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل ملفات تعريف المصادقة المخزنة افتراضيًا، بحيث لا تحجب مفاتيح الاختبار القديمة الموجودة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملف تعريف/نموذجًا صالحًا
  - يشغّل متغيرات توليد الصور القياسية عبر قدرة وقت التشغيل المشتركة:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- المزوّدون المضمّنون المغطَّون حاليًا:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- التضييق الاختياري:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- سلوك المصادقة الاختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل التجاوزات المعتمدة على env فقط

## توليد الموسيقى حي

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- الحزام: `pnpm test:live:media music`
- النطاق:
  - يمارس مسار مزوّد توليد الموسيقى المضمّن المشترك
  - يغطي حاليًا Google وMiniMax
  - يحمّل متغيرات env الخاصة بالمزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل ملفات تعريف المصادقة المخزنة افتراضيًا، بحيث لا تحجب مفاتيح الاختبار القديمة الموجودة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملف تعريف/نموذجًا صالحًا
  - يشغّل كلا وضعي وقت التشغيل المعلنين عندما يكونان متاحين:
    - `generate` مع إدخال قائم على المطالبة فقط
    - `edit` عندما يعلن المزوّد `capabilities.edit.enabled`
  - التغطية الحالية للمسار المشترك:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ملف حي منفصل لـ Comfy، وليس ضمن هذا المسح المشترك
- التضييق الاختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- سلوك المصادقة الاختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل التجاوزات المعتمدة على env فقط

## توليد الفيديو حي

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- الحزام: `pnpm test:live:media video`
- النطاق:
  - يمارس مسار مزوّد توليد الفيديو المضمّن المشترك
  - يستخدم افتراضيًا مسار smoke الآمن للإصدار: مزوّدون غير FAL، وطلب واحد لتحويل النص إلى فيديو لكل مزوّد، ومطالبة lobster مدتها ثانية واحدة، وحدًا أقصى للعملية لكل مزوّد من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` افتراضيًا)
  - يتخطى FAL افتراضيًا لأن زمن انتظار الطابور على جانب المزوّد قد يهيمن على زمن الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحةً
  - يحمّل متغيرات env الخاصة بالمزوّد من shell تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/من env قبل ملفات تعريف المصادقة المخزنة افتراضيًا، بحيث لا تحجب مفاتيح الاختبار القديمة الموجودة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملف تعريف/نموذجًا صالحًا
  - يشغّل `generate` فقط افتراضيًا
  - اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن المزوّد `capabilities.imageToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال الصور المحلية المعتمدة على buffer في المسح المشترك
    - `videoToVideo` عندما يعلن المزوّد `capabilities.videoToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال الفيديو المحلي المعتمد على buffer في المسح المشترك
  - المزوّدون الحاليون المعلنون لكن المتخطَّون في `imageToVideo` ضمن المسح المشترك:
    - `vydra` لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب عنوان URL بعيدًا للصورة
  - التغطية الخاصة بمزوّد Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل هذا الملف `veo3` لتحويل النص إلى فيديو بالإضافة إلى مسار `kling` يستخدم افتراضيًا fixture بعنوان URL بعيد لصورة
  - التغطية الحية الحالية لـ `videoToVideo`:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - المزوّدون الحاليون المعلنون لكن المتخطَّون في `videoToVideo` ضمن المسح المشترك:
    - `alibaba` و`qwen` و`xai` لأن هذه المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة من نوع `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا معتمدًا على buffer، وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات الوصول الخاصة بالمؤسسة لعمليات inpaint/remix الخاصة بالفيديو
- التضييق الاختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزوّد في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل الحد الأقصى للعملية لكل مزوّد من أجل تشغيل smoke أكثر شدة
- سلوك المصادقة الاختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل التجاوزات المعتمدة على env فقط

## حزام الوسائط الحي

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل مجموعات الصور والموسيقى والفيديو الحية المشتركة عبر نقطة دخول أصلية واحدة للمستودع
  - يحمّل تلقائيًا متغيرات env الناقصة الخاصة بالمزوّد من `~/.profile`
  - يضيّق تلقائيًا كل مجموعة إلى المزوّدين الذين يملكون حاليًا مصادقة صالحة افتراضيًا
  - يعيد استخدام `scripts/test-live.mjs`، بحيث يبقى سلوك Heartbeat والوضع الهادئ متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ذو صلة

- [الاختبار](/ar/help/testing) — مجموعات unit وintegration وQA وDocker
