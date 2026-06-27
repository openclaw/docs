---
read_when:
    - تشغيل اختبارات الدخان الحية لمصفوفة النماذج / الواجهة الخلفية لـ CLI / ACP / مزود الوسائط
    - تصحيح أخطاء حل بيانات اعتماد الاختبار الحي
    - إضافة اختبار مباشر جديد خاص بالموفّر
sidebarTitle: Live tests
summary: 'الاختبارات المباشرة (التي تتصل بالشبكة): مصفوفة النماذج، واجهات CLI الخلفية، ACP، موفرو الوسائط، بيانات الاعتماد'
title: 'الاختبار: مجموعات الاختبار الحية'
x-i18n:
    generated_at: "2026-06-27T17:47:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe2bc8d775450803781caaf22079d5a4634537eb3a15c29e91be5b328d6b32b1
    source_path: help/testing-live.md
    workflow: 16
---

للبدء السريع ومشغلات ضمان الجودة ومجموعات اختبارات الوحدة/التكامل وتدفقات Docker، راجع
[الاختبار](/ar/help/testing). تغطي هذه الصفحة مجموعات الاختبار **الحية** (التي تلامس الشبكة):
مصفوفة النماذج، وواجهات CLI الخلفية، وACP، واختبارات موفري الوسائط الحية، إضافة إلى
التعامل مع بيانات الاعتماد.

## حي: أوامر smoke المحلية

صدّر مفتاح الموفر المطلوب في بيئة العملية قبل فحوصات live
المخصصة.

Smoke وسائط آمن:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke آمن لجاهزية المكالمات الصوتية:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` هو تشغيل تجريبي ما لم يكن `--yes` موجودًا أيضًا. استخدم `--yes` فقط
عندما تريد عمدًا إجراء مكالمة إخطار حقيقية. بالنسبة إلى Twilio وTelnyx و
Plivo، يتطلب فحص الجاهزية الناجح عنوان URL عامًا للـ Webhook؛ فالبدائل المحلية فقط
local loopback/الخاصة مرفوضة حسب التصميم.

## حي: مسح قدرات عقدة Android

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر معلن عنه حاليًا** من عقدة Android متصلة والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد مسبق/يدوي (لا تثبّت المجموعة التطبيق ولا تشغّله ولا تقرنه).
  - تحقق `node.invoke` في Gateway أمرًا بأمر لعقدة Android المحددة.
- الإعداد المسبق المطلوب:
  - تطبيق Android متصل مسبقًا + مقترن بالـ Gateway.
  - إبقاء التطبيق في المقدمة.
  - منح الأذونات/الموافقة على الالتقاط للقدرات التي تتوقع نجاحها.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## حي: smoke النماذج (مفاتيح الملفات الشخصية)

تنقسم الاختبارات الحية إلى طبقتين كي نتمكن من عزل الإخفاقات:

- "النموذج المباشر" يخبرنا أن الموفر/النموذج يستطيع الإجابة أصلًا بالمفتاح المعطى.
- "Gateway smoke" يخبرنا أن خط أنابيب Gateway+الوكيل الكامل يعمل لذلك النموذج (الجلسات، السجل، الأدوات، سياسة sandbox، إلخ).

### الطبقة 1: إكمال النموذج المباشر (بلا Gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي تملك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (وتراجعات مستهدفة عند الحاجة)
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- عيّن `OPENCLAW_LIVE_MODELS=modern` أو `small` أو `all` (اسم بديل لـ modern) لتشغيل هذه المجموعة فعليًا؛ وإلا فستُتخطى لإبقاء `pnpm test:live` مركزًا على Gateway smoke
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 5.1، MiniMax M3، Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small` لتشغيل قائمة سماح النماذج الصغيرة المقيدة (مسارات Qwen 8B/9B المتوافقة محليًا، وOllama Gemma، وOpenRouter Qwen/GLM، وZ.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تعمل تشغيلات نماذج Ollama الصغيرة المحلية افتراضيًا على `http://127.0.0.1:11434`؛ عيّن `OPENCLAW_LIVE_OLLAMA_BASE_URL` فقط لنقاط نهاية LAN أو المخصصة أو Ollama Cloud.
  - تستخدم مسوحات modern/all وsmall حدودها المنسقة افتراضيًا؛ عيّن `OPENCLAW_LIVE_MAX_MODELS=0` لمسح شامل للملف الشخصي المحدد أو رقمًا موجبًا لحد أصغر.
  - تستخدم المسوحات الشاملة `OPENCLAW_LIVE_TEST_TIMEOUT_MS` لمهلة اختبار النموذج المباشر كله. الافتراضي: 60 دقيقة.
  - تعمل مجسات النموذج المباشر بتوازٍ مقداره 20 افتراضيًا؛ عيّن `OPENCLAW_LIVE_MODEL_CONCURRENCY` للتجاوز.
- كيفية اختيار الموفرين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن الملفات الشخصية وبدائل env الاحتياطية
  - عيّن `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن الملفات الشخصية** فقط
- سبب وجود هذا:
  - يفصل بين "واجهة API للموفر معطلة / المفتاح غير صالح" و"خط أنابيب وكيل Gateway معطل"
  - يحتوي تراجعات صغيرة ومعزولة (مثال: إعادة تشغيل الاستدلال في OpenAI Responses/Codex Responses + تدفقات استدعاء الأدوات)

### الطبقة 2: Gateway + smoke وكيل التطوير (ما يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل Gateway داخل العملية
  - إنشاء/تصحيح جلسة `agent:dev:*` (تجاوز النموذج لكل تشغيل)
  - تكرار النماذج ذات المفاتيح والتحقق من:
    - استجابة "ذات معنى" (بلا أدوات)
    - عمل استدعاء أداة حقيقي (مجس قراءة)
    - مجسات أدوات إضافية اختيارية (مجس exec+read)
    - استمرار عمل مسارات تراجع OpenAI (استدعاء أداة فقط → متابعة)
- تفاصيل المجسات (كي تتمكن من تفسير الإخفاقات بسرعة):
  - مجس `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل `read` له وإرجاع nonce.
  - مجس `exec+read`: يطلب الاختبار من الوكيل استخدام `exec` لكتابة nonce في ملف مؤقت، ثم `read` له.
  - مجس الصورة: يرفق الاختبار ملف PNG مولدًا (cat + رمز عشوائي) ويتوقع أن يعيد النموذج `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`test/helpers/live-image-probe.ts`.
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M3، Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` لتشغيل قائمة سماح النماذج الصغيرة المقيدة نفسها عبر خط أنابيب Gateway+الوكيل الكامل
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو عيّن `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم مسوحات Gateway لـ modern/all وsmall حدودها المنسقة افتراضيًا؛ عيّن `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لمسح محدد شامل أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار الموفرين (تجنب "كل شيء عبر OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- مجسات الأدوات + الصور مفعلة دائمًا في هذا الاختبار الحي:
  - مجس `read` + مجس `exec+read` (إجهاد الأدوات)
  - يعمل مجس الصورة عندما يعلن النموذج دعم إدخال الصور
  - التدفق (بمستوى عالٍ):
    - يولّد الاختبار ملف PNG صغيرًا يحتوي على "CAT" + رمز عشوائي (`test/helpers/live-image-probe.ts`)
    - يرسله عبر `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يفسر Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمّن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: يحتوي الرد على `cat` + الرمز (تسامح OCR: الأخطاء البسيطة مسموحة)

<Tip>
لمعرفة ما يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## حي: smoke واجهة CLI الخلفية (Claude أو Gemini أو واجهات CLI محلية أخرى)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من خط أنابيب Gateway + الوكيل باستخدام واجهة CLI خلفية محلية، دون لمس إعدادك الافتراضي.
- تعيش إعدادات smoke الافتراضية الخاصة بكل واجهة خلفية مع تعريف `cli-backend.ts` الخاص بالامتداد المالك.
- التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- الإعدادات الافتراضية:
  - الموفر/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/الوسيطات/الصورة من بيانات metadata الخاصة بـ Plugin واجهة CLI الخلفية المالكة.
- التجاوزات (اختياري):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في المحث). تعطل وصفات Docker هذا افتراضيًا ما لم يُطلب صراحة.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسيطات CLI بدلًا من حقنها في المحث.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسيطات الصور عندما يكون `IMAGE_ARG` معينًا.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دور ثانٍ والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` للاشتراك في مجس استمرارية الجلسة نفسها من Claude Sonnet إلى Opus عندما يدعم النموذج المحدد هدف تبديل. تعطل وصفات Docker هذا افتراضيًا لتحسين موثوقية التجميع.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` للاشتراك في مجس MCP/الأداة local loopback. تعطل وصفات Docker هذا افتراضيًا ما لم يُطلب صراحة.

مثال:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke رخيص لإعداد Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

لا يطلب هذا من Gemini توليد رد. يكتب إعدادات النظام نفسها التي يعطيها
OpenClaw إلى Gemini، ثم يشغّل `gemini --debug mcp list` لإثبات أن خادم
`transport: "streamable-http"` المحفوظ يُطبّع إلى شكل HTTP MCP الخاص بـ Gemini
ويمكنه الاتصال بخادم MCP محلي عبر streamable-HTTP.

وصفة Docker:

```bash
pnpm test:docker:live-cli-backend
```

وصفات Docker لموفر واحد:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

ملاحظات:

- يوجد مشغّل Docker في `scripts/test-live-cli-backend-docker.sh`.
- يشغّل smoke واجهة CLI الخلفية الحي داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير الجذري.
- يحل بيانات metadata الخاصة بـ CLI smoke من الامتداد المالك، ثم يثبت حزمة CLI المطابقة على Linux (`@anthropic-ai/claude-code` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخبأة في `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` OAuth محمولًا لاشتراك Claude Code عبر إما `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. يثبت أولًا تشغيل `claude -p` المباشر في Docker، ثم يشغّل دورين لواجهة Gateway CLI الخلفية دون الاحتفاظ بمتغيرات env الخاصة بمفاتيح Anthropic API. يعطل مسار الاشتراك هذا مجسات Claude MCP/الأدوات والصور افتراضيًا لأن Claude يوجّه حاليًا استخدام تطبيقات الجهات الخارجية عبر فوترة استخدام إضافية بدلًا من حدود خطة الاشتراك العادية.
- يمارس smoke واجهة CLI الخلفية الحي الآن التدفق الكامل نفسه لكل من Claude وGemini: دور نصي، ودور تصنيف صورة، ثم استدعاء أداة MCP `cron` مثبت عبر CLI للـ Gateway.
- كما يصحح smoke الافتراضي لـ Claude الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة ما زالت تتذكر ملاحظة سابقة.

## حي: قابلية الوصول إلى وكيل APNs عبر HTTP/2

- الاختبار: `src/infra/push-apns-http2.live.test.ts`
- الهدف: إنشاء نفق عبر وكيل HTTP CONNECT محلي إلى نقطة نهاية APNs sandbox الخاصة بـ Apple، وإرسال طلب التحقق من APNs عبر HTTP/2، والتحقق من رجوع استجابة Apple الحقيقية `403 InvalidProviderToken` عبر مسار الوكيل.
- التفعيل:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- المهلة الاختيارية:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## حي: smoke ربط ACP (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط محادثة ACP الحقيقي مع وكيل ACP مباشر:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة قناة رسائل اصطناعية في مكانها
  - إرسال متابعة عادية على المحادثة نفسها
  - التحقق من وصول المتابعة إلى نسخة جلسة ACP المرتبطة
- التفعيل:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- الافتراضيات:
  - وكلاء ACP في Docker: `claude,codex,gemini`
  - وكيل ACP للتشغيل المباشر `pnpm test:live ...`: `claude`
  - القناة الاصطناعية: سياق محادثة بأسلوب رسالة Slack مباشرة
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
  - يستخدم هذا المسار سطح gateway `chat.send` مع حقول مسار منشأ اصطناعية مقتصرة على المسؤول، حتى تتمكن الاختبارات من إرفاق سياق قناة الرسائل من دون ادعاء التسليم خارجيًا.
  - عندما لا يكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` مضبوطًا، يستخدم الاختبار سجل الوكلاء المدمج في Plugin `acpx` المضمن لوكيل حاضنة اختبار ACP المحدد.
  - إنشاء MCP الخاص بـ Cron للجلسة المرتبطة هو محاولة بأفضل جهد افتراضيًا، لأن حاضنات اختبار ACP الخارجية قد تلغي استدعاءات MCP بعد نجاح إثبات الربط/الصورة؛ اضبط `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` لجعل مسبار Cron بعد الربط صارمًا.

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

- مشغل Docker موجود في `scripts/test-live-acp-bind-docker.sh`.
- افتراضيًا، يشغل اختبار ACP bind الدخاني مقابل وكلاء CLI المباشرين التجميعيين بالتسلسل: `claude`، ثم `codex`، ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` لتضييق المصفوفة.
- يجهز مواد مصادقة CLI المطابقة داخل الحاوية، ثم يثبت CLI المباشر المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو Factory Droid عبر `https://app.factory.ai/cli` أو `@google/gemini-cli` أو `opencode-ai`) إذا كان مفقودًا. خلفية ACP نفسها هي حزمة `acpx/runtime` المضمنة من Plugin `acpx` الرسمي.
- يجهز متغير Droid Docker `~/.factory` للإعدادات، ويمرر `FACTORY_API_KEY`، ويتطلب مفتاح API هذا لأن مصادقة Factory المحلية عبر OAuth/حلقة المفاتيح غير قابلة للنقل إلى الحاوية. يستخدم إدخال سجل ACPX المدمج `droid exec --output-format acp`.
- متغير OpenCode Docker هو مسار انحدار صارم لوكيل واحد. يكتب نموذجًا افتراضيًا مؤقتًا في `OPENCODE_CONFIG_CONTENT` من `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (الافتراضي `opencode/kimi-k2.6`)، ويتطلب `pnpm test:docker:live-acp-bind:opencode` نسخة مساعد مرتبطة بدلًا من قبول التخطي العام بعد الربط.
- استدعاءات CLI المباشرة لـ `acpx` هي فقط مسار يدوي/التفافي لمقارنة السلوك خارج Gateway. اختبار Docker ACP bind الدخاني يشغل خلفية وقت تشغيل `acpx` المضمنة في OpenClaw.

## مباشر: اختبار دخاني لحاضنة اختبار خادم تطبيق Codex

- الهدف: التحقق من حاضنة اختبار Codex المملوكة للـ Plugin عبر طريقة gateway
  `agent` العادية:
  - تحميل Plugin `codex` المضمن
  - اختيار `openai/gpt-5.5`، الذي يوجه دورات وكيل OpenAI عبر Codex افتراضيًا
  - إرسال دورة وكيل gateway أولى إلى `openai/gpt-5.5` مع حاضنة اختبار Codex محددة
  - إرسال دورة ثانية إلى جلسة OpenClaw نفسها والتحقق من أن خيط خادم التطبيق
    يمكنه الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار أمر gateway نفسه
  - تشغيل مسبارين اختياريين لأوامر shell مصعدة ومراجعة بواسطة Guardian: أمر حميد
    ينبغي الموافقة عليه ورفع سر زائف ينبغي رفضه كي يسأل الوكيل مرة أخرى
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `openai/gpt-5.5`
- مسبار صورة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- مسبار MCP/أداة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- مسبار Guardian اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- يفرض الاختبار الدخاني provider/model `agentRuntime.id: "codex"` حتى لا تتمكن حاضنة اختبار Codex
  المعطلة من النجاح عبر الرجوع بصمت إلى OpenClaw.
- المصادقة: مصادقة خادم تطبيق Codex من تسجيل دخول اشتراك Codex المحلي. يمكن لاختبارات Docker
  الدخانية أيضًا توفير `OPENAI_API_KEY` لمسابير غير Codex عند الانطباق،
  إضافة إلى نسخ اختيارية من `~/.codex/auth.json` و`~/.codex/config.toml`.

وصفة محلية:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

وصفة Docker:

```bash
pnpm test:docker:live-codex-harness
```

ملاحظات Docker:

- مشغل Docker موجود في `scripts/test-live-codex-harness-docker.sh`.
- يمرر `OPENAI_API_KEY`، وينسخ ملفات مصادقة Codex CLI عند وجودها، ويثبت
  `@openai/codex` في بادئة npm قابلة للكتابة ومثبتة،
  ويجهز شجرة المصدر، ثم يشغل اختبار Codex-harness المباشر فقط.
- يفعّل Docker مسابير الصورة وMCP/الأداة وGuardian افتراضيًا. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` عندما تحتاج إلى تشغيل تصحيح أضيق.
- يستخدم Docker إعداد وقت تشغيل Codex الصريح نفسه، لذلك لا يمكن للأسماء المستعارة القديمة أو رجوع OpenClaw
  إخفاء انحدار في حاضنة اختبار Codex.

### الوصفات المباشرة الموصى بها

قوائم السماح الضيقة والصريحة هي الأسرع والأقل عرضة للتقلب:

- نموذج واحد، مباشر (بلا gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- ملف تعريف مباشر لنموذج صغير:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- ملف تعريف gateway لنموذج صغير:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- اختبار Ollama Cloud API دخاني:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- نموذج واحد، اختبار gateway دخاني:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة مزودين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- اختبار دخاني مباشر لخطة برمجة Z.AI GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- تركيز Google (مفتاح Gemini API + Antigravity):
  - Gemini (مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- اختبار دخاني للتفكير التكيفي في Google:
  - الافتراضي الديناميكي Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - ميزانية ديناميكية Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

ملاحظات:

- يستخدم `google/...` واجهة Gemini API (مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity OAuth (نقطة نهاية وكيل بأسلوب Cloud Code Assist).
- يستخدم `google-gemini-cli/...` Gemini CLI المحلي على جهازك (مصادقة منفصلة + خصوصيات أدوات).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة لدى Google عبر HTTP (مفتاح API / مصادقة ملف تعريف)؛ وهذا ما يقصده معظم المستخدمين بـ "Gemini".
  - CLI: يشغل OpenClaw ملفًا ثنائيًا محليًا باسم `gemini` عبر shell؛ له مصادقته الخاصة وقد يتصرف بشكل مختلف (دعم البث/الأدوات/تفاوت الإصدارات).

## مباشر: مصفوفة النماذج (ما نغطيه)

لا توجد "قائمة نماذج CI" ثابتة (المباشر اختياري)، لكن هذه هي النماذج **الموصى بها** لتغطيتها بانتظام على جهاز تطوير مع مفاتيح.

### مجموعة الاختبار الدخاني الحديثة (استدعاء الأدوات + صورة)

هذا هو تشغيل "النماذج الشائعة" الذي نتوقع استمرار عمله:

- OpenAI (غير Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview` (تجنب نماذج Gemini 2.x الأقدم)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و`google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` و`deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (API عام) أو `zai/glm-5.2` (خطة برمجة)
- MiniMax: `minimax/MiniMax-M3`

شغل اختبار gateway الدخاني مع الأدوات + الصورة:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### خط الأساس: استدعاء الأدوات (Read + Exec اختياري)

اختر واحدًا على الأقل لكل عائلة مزود:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (API عام) أو `zai/glm-5.2` (خطة برمجة)
- MiniMax: `minimax/MiniMax-M3`

تغطية إضافية اختيارية (مفيدة):

- xAI: `xai/grok-4.3` (أو أحدث المتاح)
- Mistral: `mistral/`… (اختر نموذجًا واحدًا قادرًا على "الأدوات" لديك مفعّلًا)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### الرؤية: إرسال صورة (مرفق → رسالة متعددة الوسائط)

ضمّن نموذجًا واحدًا على الأقل قادرًا على الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (متغيرات Claude/Gemini/OpenAI القادرة على الرؤية، إلخ) لتشغيل مسبار الصورة.

### المجمّعات / بوابات بديلة

إذا كانت لديك مفاتيح مفعّلة، ندعم أيضًا الاختبار عبر:

- OpenRouter: `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين قادرين على الأدوات+الصور)
- OpenCode: `opencode/...` لـ Zen و`opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزيد من المزودين الذين يمكنك تضمينهم في المصفوفة المباشرة (إذا كانت لديك بيانات اعتماد/إعدادات):

- مدمجة: `openai`، `anthropic`، `google`، `google-vertex`، `google-antigravity`، `google-gemini-cli`، `zai`، `openrouter`، `opencode`، `opencode-go`، `xai`، `groq`، `cerebras`، `mistral`، `github-copilot`
- عبر `models.providers` (نقاط نهاية مخصصة): `minimax` (السحابة/API)، إضافة إلى أي وكيل متوافق مع OpenAI/Anthropic (LM Studio، vLLM، LiteLLM، إلخ.)

<Tip>
لا تضع "كل النماذج" بصيغة ثابتة في الوثائق. القائمة الموثوقة هي كل ما تُرجعه `discoverModels(...)` على جهازك، إضافة إلى أي مفاتيح متاحة.
</Tip>

## بيانات الاعتماد (لا تُدرجها في أي commit مطلقًا)

تكتشف الاختبارات الحية بيانات الاعتماد بالطريقة نفسها التي يفعل بها CLI. الآثار العملية:

- إذا كان CLI يعمل، فينبغي أن تعثر الاختبارات الحية على المفاتيح نفسها.
- إذا قال اختبار حي "no creds"، فصحّح المشكلة بالطريقة نفسها التي تصحح بها `openclaw models list` / اختيار النموذج.

- ملفات تعريف المصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (هذا هو المقصود بعبارة "profile keys" في الاختبارات الحية)
- التكوين: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى الصفحة الرئيسية الحية المرحلية عند وجوده، لكنه ليس مخزن مفاتيح ملف التعريف الرئيسي)
- تنسخ التشغيلات المحلية الحية التكوين النشط، وملفات `auth-profiles.json` لكل وكيل، و`credentials/` القديمة، وأدلة مصادقة CLI الخارجية المدعومة إلى صفحة اختبار رئيسية مؤقتة افتراضيًا؛ وتتخطى الصفحات الرئيسية الحية المرحلية `workspace/` و`sandboxes/`، وتُزال تجاوزات مسارات `agents.*.workspace` / `agentDir` حتى تبقى المجسات بعيدة عن مساحة عمل مضيفك الحقيقية.

إذا أردت الاعتماد على مفاتيح البيئة، فصدّرها قبل الاختبارات المحلية أو استخدم
مشغلات Docker أدناه مع `OPENCLAW_PROFILE_FILE` صريح.

## Deepgram حي (نسخ الصوت)

- الاختبار: `extensions/deepgram/audio.live.test.ts`
- التفعيل: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## خطة ترميز BytePlus الحية

- الاختبار: `extensions/byteplus/live.test.ts`
- التفعيل: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- تجاوز اختياري للنموذج: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## وسائط سير عمل ComfyUI الحية

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يختبر مسارات الصور والفيديو و`music_generate` المدمجة في comfy
  - يتخطى كل إمكانية ما لم يكن `plugins.entries.comfy.config.<capability>` مهيأ
  - مفيد بعد تغيير إرسال سير عمل comfy أو الاستقصاء أو التنزيلات أو تسجيل Plugin

## توليد الصور الحي

- الاختبار: `test/image-generation.runtime.live.test.ts`
- الأمر: `pnpm test:live test/image-generation.runtime.live.test.ts`
- حزمة الاختبار: `pnpm test:live:media image`
- النطاق:
  - يسرد كل Plugin مزوّد توليد صور مسجل
  - يستخدم متغيرات بيئة المزوّد المصدّرة مسبقًا قبل الفحص
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملف تعريف/نموذجًا صالحًا للاستخدام
  - يشغّل كل مزوّد مهيأ عبر وقت تشغيل توليد الصور المشترك:
    - `<provider>:generate`
    - `<provider>:edit` عندما يعلن المزوّد دعم التحرير
- المزوّدون المدمجون الحاليون المشمولون:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن ملفات التعريف وتجاهل التجاوزات المعتمدة على البيئة فقط

لمسار CLI المشحون، أضف اختبار دخان `infer` بعد نجاح اختبار
المزوّد/وقت التشغيل الحي:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

يغطي هذا تحليل وسائط CLI، وحل التكوين/الوكيل الافتراضي، وتفعيل
Plugin المدمج، ووقت تشغيل توليد الصور المشترك، وطلب المزوّد الحي.
يُتوقع أن تكون تبعيات Plugin موجودة قبل تحميل وقت التشغيل.

## توليد الموسيقى الحي

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- حزمة الاختبار: `pnpm test:live:media music`
- النطاق:
  - يختبر مسار مزوّد توليد الموسيقى المدمج المشترك
  - يغطي حاليًا Google وMiniMax
  - يستخدم متغيرات بيئة المزوّد المصدّرة مسبقًا قبل الفحص
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملف تعريف/نموذجًا صالحًا للاستخدام
  - يشغّل وضعي وقت التشغيل المعلنين عند توفرهما:
    - `generate` مع إدخال موجّه فقط
    - `edit` عندما يعلن المزوّد `capabilities.edit.enabled`
  - تغطية المسار المشترك الحالية:
    - `google`: `generate`، `edit`
    - `minimax`: `generate`
    - `comfy`: ملف Comfy حي منفصل، وليس هذا الفحص المشترك
- تضييق اختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن ملفات التعريف وتجاهل التجاوزات المعتمدة على البيئة فقط

## توليد الفيديو الحي

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- حزمة الاختبار: `pnpm test:live:media video`
- النطاق:
  - يختبر مسار مزوّد توليد الفيديو المدمج المشترك
  - يضبط افتراضيًا مسار اختبار الدخان الآمن للإصدار: مزوّدون غير FAL، وطلب نص إلى فيديو واحد لكل مزوّد، وموجّه جراد بحر مدته ثانية واحدة، وحد أقصى للعملية لكل مزوّد من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` افتراضيًا)
  - يتخطى FAL افتراضيًا لأن زمن انتظار الطابور لدى المزوّد قد يهيمن على وقت الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحةً
  - يستخدم متغيرات بيئة المزوّد المصدّرة مسبقًا قبل الفحص
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملف تعريف/نموذجًا صالحًا للاستخدام
  - يشغّل `generate` فقط افتراضيًا
  - اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن المزوّد `capabilities.imageToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال صورة محلية مدعومة بمخزن مؤقت في الفحص المشترك
    - `videoToVideo` عندما يعلن المزوّد `capabilities.videoToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال فيديو محلي مدعوم بمخزن مؤقت في الفحص المشترك
  - مزوّدو `imageToVideo` المعلنون لكن المتخطّون حاليًا في الفحص المشترك:
    - `vydra` لأن `veo3` المدمج نصي فقط، و`kling` المدمج يتطلب URL صورة بعيدًا
  - تغطية Vydra الخاصة بالمزوّد:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل ذلك الملف مسار `veo3` من نص إلى فيديو، إضافة إلى مسار `kling` يستخدم أداة تثبيت URL صورة بعيدة افتراضيًا
  - تغطية `videoToVideo` الحية الحالية:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - مزوّدو `videoToVideo` المعلنون لكن المتخطّون حاليًا في الفحص المشترك:
    - `alibaba`، `qwen`، `xai` لأن هذه المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة من نوع `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا مدعومًا بمخزن مؤقت، وهذا المسار غير مقبول في الفحص المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات وصول تحرير الفيديو الخاصة بالمؤسسة
- تضييق اختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزوّد في الفحص الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل حد كل عملية مزوّد في تشغيل دخان مكثف
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن ملفات التعريف وتجاهل التجاوزات المعتمدة على البيئة فقط

## حزمة الاختبار الحية للوسائط

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل مجموعات الصور والموسيقى والفيديو الحية المشتركة عبر نقطة دخول أصلية للمستودع
  - يستخدم متغيرات بيئة المزوّد المصدّرة مسبقًا
  - يضيّق كل مجموعة تلقائيًا إلى المزوّدين الذين يملكون حاليًا مصادقة صالحة للاستخدام افتراضيًا
  - يعيد استخدام `scripts/test-live.mjs`، بحيث يظل سلوك Heartbeat والوضع الهادئ متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ذو صلة

- [الاختبار](/ar/help/testing) - مجموعات اختبارات الوحدة والتكامل وQA وDocker
