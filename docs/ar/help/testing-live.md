---
read_when:
    - تشغيل اختبارات smoke الحية لمصفوفة النماذج / خلفية CLI / ACP / موفّر الوسائط
    - تصحيح أخطاء حل بيانات اعتماد الاختبار الحي
    - إضافة اختبار مباشر جديد خاص بموفّر
sidebarTitle: Live tests
summary: 'الاختبارات الحية (التي تلامس الشبكة): مصفوفة النماذج، واجهات CLI الخلفية، ACP، مزودو الوسائط، بيانات الاعتماد'
title: 'الاختبار: مجموعات الاختبارات الحية'
x-i18n:
    generated_at: "2026-06-28T20:43:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 087ec52b395131889d4ae113f304d71199c58dc9f61a1a5e1e511ae4c5b48c0b
    source_path: help/testing-live.md
    workflow: 16
---

للبدء السريع، ومشغّلات ضمان الجودة، ومجموعات اختبارات الوحدة/التكامل، وتدفقات Docker، راجع
[الاختبار](/ar/help/testing). تغطي هذه الصفحة مجموعات الاختبار **المباشرة** (التي تلامس الشبكة):
مصفوفة النماذج، وخلفيات CLI، وACP، واختبارات موفّري الوسائط المباشرة، بالإضافة إلى
التعامل مع بيانات الاعتماد.

## مباشر: أوامر فحص محلي سريع

صدّر مفتاح الموفّر المطلوب في بيئة العملية قبل الفحوصات المباشرة المخصصة.

فحص وسائط آمن:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

فحص آمن لجاهزية مكالمة صوتية:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` تشغيل تجريبي جاف ما لم يكن `--yes` موجودًا أيضًا. استخدم `--yes` فقط
عندما تريد عمدًا إجراء مكالمة إشعار حقيقية. بالنسبة إلى Twilio وTelnyx و
Plivo، يتطلب فحص الجاهزية الناجح عنوان URL عامًا لـ Webhook؛ ويتم رفض بدائل
local loopback/الخاصة محليًا فقط حسب التصميم.

## مباشر: مسح قدرات عقدة Android

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر معلن عنه حاليًا** بواسطة عقدة Android متصلة والتأكد من سلوك عقد الأمر.
- النطاق:
  - إعداد مشروط/يدوي مسبق (لا تثبّت المجموعة التطبيق ولا تشغّله ولا تقرنه).
  - تحقق Gateway `node.invoke` أمرًا تلو الآخر لعقدة Android المحددة.
- الإعداد المسبق المطلوب:
  - تطبيق Android متصل ومقترن بالفعل بـ Gateway.
  - إبقاء التطبيق في الواجهة الأمامية.
  - منح الأذونات/موافقة الالتقاط للقدرات التي تتوقع نجاحها.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## مباشر: فحص النماذج السريع (مفاتيح الملفات الشخصية)

تنقسم الاختبارات المباشرة إلى طبقتين حتى نستطيع عزل الإخفاقات:

- "النموذج المباشر" يخبرنا أن الموفّر/النموذج يمكنه الإجابة أساسًا باستخدام المفتاح المحدد.
- "فحص Gateway السريع" يخبرنا أن خط أنابيب Gateway+الوكيل الكامل يعمل لذلك النموذج (الجلسات، السجل، الأدوات، سياسة sandbox، إلخ).

### الطبقة 1: إكمال النموذج المباشر (بدون Gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي تملك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (وانحدارات مستهدفة عند الحاجة)
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` عند استدعاء Vitest مباشرة)
- اضبط `OPENCLAW_LIVE_MODELS=modern` أو `small` أو `all` (اسم مستعار لـ modern) لتشغيل هذه المجموعة فعليًا؛ وإلا فسيتم تخطيها لإبقاء `pnpm test:live` مركزًا على فحص Gateway السريع
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 5.1، MiniMax M3، Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small` لتشغيل قائمة السماح المقيدة للنماذج الصغيرة (مسارات Qwen 8B/9B المتوافقة محليًا، Ollama Gemma، OpenRouter Qwen/GLM، وZ.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` اسم مستعار لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تستخدم تشغيلات نماذج Ollama الصغيرة المحلية افتراضيًا `http://127.0.0.1:11434`؛ اضبط `OPENCLAW_LIVE_OLLAMA_BASE_URL` فقط لنقاط نهاية LAN أو المخصصة أو Ollama Cloud.
  - تستخدم عمليات مسح modern/all وsmall حدودها المنسقة افتراضيًا؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لمسح شامل للملفات الشخصية المحددة أو رقمًا موجبًا لحد أصغر.
  - تستخدم عمليات المسح الشاملة `OPENCLAW_LIVE_TEST_TIMEOUT_MS` لمهلة اختبار النموذج المباشر بالكامل. الافتراضي: 60 دقيقة.
  - تعمل مجسات النموذج المباشر بتوازٍ قدره 20 افتراضيًا؛ اضبط `OPENCLAW_LIVE_MODEL_CONCURRENCY` للتجاوز.
- كيفية اختيار الموفّرين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن الملفات الشخصية وبدائل env
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن الملفات الشخصية** فقط
- سبب وجود هذا:
  - يفصل بين "واجهة API للموفّر معطلة / المفتاح غير صالح" و"خط أنابيب وكيل Gateway معطل"
  - يحتوي على انحدارات صغيرة ومعزولة (مثال: إعادة تشغيل استدلال OpenAI Responses/Codex Responses + تدفقات استدعاء الأدوات)

### الطبقة 2: فحص Gateway + وكيل التطوير السريع (ما يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل Gateway داخل العملية
  - إنشاء/تصحيح جلسة `agent:dev:*` (تجاوز النموذج لكل تشغيل)
  - تكرار النماذج ذات المفاتيح والتأكد من:
    - استجابة "ذات معنى" (بلا أدوات)
    - عمل استدعاء أداة حقيقي (مجس قراءة)
    - مجسات أدوات إضافية اختيارية (مجس exec+read)
    - استمرار عمل مسارات انحدار OpenAI (استدعاء أداة فقط → متابعة)
- تفاصيل المجسات (حتى يمكنك شرح الإخفاقات بسرعة):
  - مجس `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل `read` له وترديد nonce.
  - مجس `exec+read`: يطلب الاختبار من الوكيل أن يكتب nonce باستخدام `exec` في ملف مؤقت، ثم يستخدم `read` لقراءته مرة أخرى.
  - مجس الصورة: يرفق الاختبار PNG مولدة (cat + رمز عشوائي) ويتوقع أن يعيد النموذج `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`test/helpers/live-image-probe.ts`.
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` عند استدعاء Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M3، Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` لتشغيل قائمة السماح المقيدة نفسها للنماذج الصغيرة عبر خط أنابيب Gateway+الوكيل الكامل
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` اسم مستعار لقائمة السماح الحديثة
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم عمليات مسح Gateway لـ modern/all وsmall حدودها المنسقة افتراضيًا؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لمسح شامل محدد أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار الموفّرين (لتجنب "كل شيء من OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- مجسات الأدوات + الصور مفعّلة دائمًا في هذا الاختبار المباشر:
  - مجس `read` + مجس `exec+read` (ضغط أدوات)
  - يعمل مجس الصورة عندما يعلن النموذج دعم إدخال الصور
  - التدفق (بمستوى عالٍ):
    - يولّد الاختبار PNG صغيرة تحتوي على "CAT" + رمز عشوائي (`test/helpers/live-image-probe.ts`)
    - يرسلها عبر `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمّن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التأكيد: يحتوي الرد على `cat` + الرمز (تسامح OCR: الأخطاء البسيطة مسموحة)

<Tip>
لرؤية ما يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## مباشر: فحص خلفية CLI السريع (Claude أو Gemini أو CLIs محلية أخرى)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من خط أنابيب Gateway + الوكيل باستخدام خلفية CLI محلية، دون لمس إعداداتك الافتراضية.
- تعيش افتراضيات الفحص السريع الخاصة بالخلفية مع تعريف `cli-backend.ts` الخاص بالامتداد المالك.
- التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` عند استدعاء Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- الافتراضيات:
  - الموفّر/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/الوسائط/الصور من بيانات Plugin الوصفية لخلفية CLI المالكة.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في المطالبة). تعطل وصفات Docker هذا افتراضيًا ما لم يُطلب صراحة.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من حقن المطالبة.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عند ضبط `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دورة ثانية والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` للاشتراك في مجس استمرارية الجلسة نفسها من Claude Sonnet -> Opus عندما يدعم النموذج المحدد هدف تبديل. تعطل وصفات Docker هذا افتراضيًا لتحسين موثوقية التجميع.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` للاشتراك في مجس MCP/الأدوات عبر local loopback. تعطل وصفات Docker هذا افتراضيًا ما لم يُطلب صراحة.

مثال:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

فحص سريع رخيص لإعداد Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

هذا لا يطلب من Gemini توليد استجابة. يكتب إعدادات النظام نفسها التي يمنحها
OpenClaw إلى Gemini، ثم يشغّل `gemini --debug mcp list` لإثبات أن خادم
`transport: "streamable-http"` المحفوظ تتم مطابقته مع شكل HTTP MCP الخاص بـ Gemini
ويمكنه الاتصال بخادم MCP محلي بنمط streamable-HTTP.

وصفة Docker:

```bash
pnpm test:docker:live-cli-backend
```

وصفات Docker لموفّر واحد:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

ملاحظات:

- يوجد مشغّل Docker في `scripts/test-live-cli-backend-docker.sh`.
- يشغّل فحص خلفية CLI المباشر السريع داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير جذري.
- يحل بيانات فحص CLI الوصفية من الامتداد المالك، ثم يثبّت حزمة CLI المطابقة على Linux (`@anthropic-ai/claude-code` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزنة مؤقتًا عند `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` OAuth محمولًا لاشتراك Claude Code إما عبر `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. يثبت أولًا `claude -p` المباشر في Docker، ثم يشغّل دورتين لخلفية Gateway CLI دون الحفاظ على متغيرات env الخاصة بمفتاح Anthropic API. يعطل مسار الاشتراك هذا مجسات Claude MCP/الأدوات والصور افتراضيًا لأنه يستهلك حدود استخدام الاشتراك الذي تم تسجيل الدخول به، ويمكن لـ Anthropic تغيير سلوك فوترة وحدود معدلات Claude Agent SDK / `claude -p` دون إصدار OpenClaw.
- يمارس فحص خلفية CLI المباشر السريع الآن التدفق الطرفي نفسه لكل من Claude وGemini: دورة نصية، دورة تصنيف صورة، ثم استدعاء أداة MCP `cron` مُتحقق منه عبر Gateway CLI.
- يحدّث فحص Claude الافتراضي أيضًا الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة لا تزال تتذكر ملاحظة سابقة.

## مباشر: قابلية وصول وكيل APNs HTTP/2

- الاختبار: `src/infra/push-apns-http2.live.test.ts`
- الهدف: النفاذ عبر وكيل HTTP CONNECT محلي إلى نقطة نهاية sandbox APNs من Apple، وإرسال طلب تحقق APNs HTTP/2، والتأكد من أن استجابة Apple الحقيقية `403 InvalidProviderToken` تعود عبر مسار الوكيل.
- التفعيل:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- مهلة اختيارية:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## مباشر: فحص ربط ACP السريع (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من مسار ربط محادثة ACP الحقيقي مع وكيل ACP مباشر:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة قناة رسائل اصطناعية في موضعها
  - إرسال متابعة عادية على المحادثة نفسها
  - التحقق من وصول المتابعة إلى سجل جلسة ACP المرتبطة
- التفعيل:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- الإعدادات الافتراضية:
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
  - يستخدم هذا المسار سطح `chat.send` في Gateway مع حقول مسار منشأ اصطناعية للمشرفين فقط، بحيث يمكن للاختبارات إرفاق سياق قناة رسائل دون ادعاء التسليم خارجيا.
  - عند عدم ضبط `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND`، يستخدم الاختبار سجل الوكلاء المدمج في Plugin `acpx` المضمن لوكيل حزمة اختبار ACP المحدد.
  - إنشاء MCP Cron للجلسة المرتبطة يبذل أفضل جهد افتراضيا، لأن حزم اختبار ACP الخارجية قد تلغي استدعاءات MCP بعد نجاح إثبات الربط/الصورة؛ اضبط `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` لجعل مسبار Cron بعد الربط صارما.

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
- افتراضيا، يشغل اختبار دخان ربط ACP ضد وكلاء CLI المباشرين التجميعيين بالتسلسل: `claude`، ثم `codex`، ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` لتضييق المصفوفة.
- يجهز مواد مصادقة CLI المطابقة داخل الحاوية، ثم يثبت CLI المباشر المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو Factory Droid عبر `https://app.factory.ai/cli` أو `@google/gemini-cli` أو `opencode-ai`) إذا كان مفقودا. خلفية ACP نفسها هي حزمة `acpx/runtime` المضمنة من Plugin `acpx` الرسمي.
- يجهز متغير Docker الخاص بـ Droid المسار `~/.factory` للإعدادات، ويمرر `FACTORY_API_KEY`، ويتطلب مفتاح API هذا لأن مصادقة OAuth/سلسلة المفاتيح المحلية الخاصة بـ Factory غير قابلة للنقل إلى الحاوية. ويستخدم إدخال السجل المدمج في ACPX وهو `droid exec --output-format acp`.
- متغير Docker الخاص بـ OpenCode هو مسار انحدار صارم لوكيل واحد. يكتب نموذجا افتراضيا مؤقتا في `OPENCODE_CONFIG_CONTENT` من `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (الافتراضي `opencode/kimi-k2.6`)، ويتطلب `pnpm test:docker:live-acp-bind:opencode` سجل مساعد مرتبطا بدلا من قبول التخطي العام بعد الربط.
- استدعاءات CLI المباشرة لـ `acpx` هي فقط مسار يدوي/التفاف لمقارنة السلوك خارج Gateway. اختبار دخان ربط ACP في Docker يمارس خلفية وقت تشغيل `acpx` المضمنة في OpenClaw.

## مباشر: اختبار دخان حزمة خادم التطبيق Codex

- الهدف: التحقق من حزمة Codex المملوكة للـ Plugin عبر طريقة Gateway
  `agent` العادية:
  - تحميل Plugin `codex` المضمن
  - اختيار `openai/gpt-5.5`، الذي يوجه أدوار وكيل OpenAI عبر Codex افتراضيا
  - إرسال أول دور وكيل عبر Gateway إلى `openai/gpt-5.5` مع تحديد حزمة Codex
  - إرسال دور ثان إلى جلسة OpenClaw نفسها والتحقق من أن خيط خادم التطبيق
    يمكنه الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار أوامر Gateway نفسه
  - اختياريا، تشغيل مسباري صدفة مصعدين ومراجعين من Guardian: أمر حميد
    ينبغي أن تتم الموافقة عليه، ورفع سر زائف ينبغي
    رفضه بحيث يسأل الوكيل مرة أخرى
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `openai/gpt-5.5`
- مسبار صورة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- مسبار MCP/أداة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- مسبار Guardian اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- يجبر اختبار الدخان provider/model `agentRuntime.id: "codex"` حتى لا تتمكن حزمة Codex
  المعطلة من النجاح عبر الرجوع بصمت إلى OpenClaw.
- المصادقة: مصادقة خادم تطبيق Codex من تسجيل دخول اشتراك Codex المحلي. يمكن لاختبارات دخان Docker
  أيضا توفير `OPENAI_API_KEY` للمسابير غير الخاصة بـ Codex عند الانطباق،
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
- يمرر `OPENAI_API_KEY`، وينسخ ملفات مصادقة CLI الخاصة بـ Codex عند وجودها، ويثبت
  `@openai/codex` داخل بادئة npm مثبتة قابلة للكتابة،
  ويجهز شجرة المصدر، ثم يشغل اختبار Codex-harness المباشر فقط.
- يفعّل Docker مسابير الصورة وMCP/الأداة وGuardian افتراضيا. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` عندما تحتاج إلى تشغيل تصحيح أضيق.
- يستخدم Docker إعداد وقت تشغيل Codex الصريح نفسه، لذلك لا تستطيع الأسماء البديلة القديمة أو رجوع OpenClaw
  إخفاء انحدار حزمة Codex.

### وصفات مباشرة موصى بها

قوائم السماح الضيقة والصريحة هي الأسرع والأقل عرضة للتذبذب:

- نموذج واحد، مباشر (دون Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- ملف تعريف مباشر لنموذج صغير:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- ملف تعريف Gateway لنموذج صغير:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- اختبار دخان Ollama Cloud API:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- نموذج واحد، اختبار دخان Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة مزودين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- اختبار دخان مباشر لخطة ترميز Z.AI GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- تركيز Google (مفتاح Gemini API + Antigravity):
  - Gemini (مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- اختبار دخان التفكير التكيفي في Google:
  - الإعداد الديناميكي الافتراضي لـ Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - الميزانية الديناميكية لـ Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

ملاحظات:

- يستخدم `google/...` واجهة Gemini API (مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity OAuth (نقطة نهاية وكيل بنمط Cloud Code Assist).
- يستخدم `google-gemini-cli/...` CLI المحلي لـ Gemini على جهازك (مصادقة منفصلة وخصوصيات أدوات).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP (مفتاح API / مصادقة ملف تعريف)؛ وهذا ما يقصده معظم المستخدمين بـ "Gemini".
  - CLI: يستدعي OpenClaw برنامجا محليا ثنائيا باسم `gemini` عبر الصدفة؛ له مصادقته الخاصة وقد يتصرف بشكل مختلف (دعم البث/الأدوات/تفاوت الإصدارات).

## مباشر: مصفوفة النماذج (ما نغطيه)

لا توجد "قائمة نماذج CI" ثابتة (التشغيل المباشر اختياري)، لكن هذه هي النماذج **الموصى بها** لتغطيتها بانتظام على جهاز تطوير مع المفاتيح.

### مجموعة دخان حديثة (استدعاء أدوات + صورة)

هذا هو تشغيل "النماذج الشائعة" الذي نتوقع أن يظل عاملا:

- OpenAI (غير Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview` (تجنب نماذج Gemini 2.x الأقدم)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و`google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` و`deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (API عام) أو `zai/glm-5.2` (خطة ترميز)
- MiniMax: `minimax/MiniMax-M3`

شغّل اختبار دخان Gateway مع الأدوات + الصورة:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### خط أساس: استدعاء الأدوات (Read + Exec اختياري)

اختر واحدا على الأقل لكل عائلة مزود:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (API عام) أو `zai/glm-5.2` (خطة ترميز)
- MiniMax: `minimax/MiniMax-M3`

تغطية إضافية اختيارية (من الجيد وجودها):

- xAI: `xai/grok-4.3` (أو أحدث المتاح)
- Mistral: `mistral/`… (اختر نموذجا قادرا على "الأدوات" ومفعلا لديك)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### الرؤية: إرسال صورة (مرفق → رسالة متعددة الوسائط)

ضمّن نموذجا واحدا على الأقل قادرا على الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (متغيرات Claude/Gemini/OpenAI القادرة على الرؤية، إلخ) لممارسة مسبار الصورة.

### المجمعات / البوابات البديلة

إذا كانت لديك مفاتيح مفعلة، فإننا ندعم أيضا الاختبار عبر:

- OpenRouter: `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين قادرين على الأدوات+الصور)
- OpenCode: `opencode/...` لـ Zen و`opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزودون إضافيون يمكنك تضمينهم في المصفوفة المباشرة (إذا كانت لديك بيانات اعتماد/إعداد):

- مضمّن: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- عبر `models.providers` (نقاط نهاية مخصصة): `minimax` (السحابة/API)، إضافة إلى أي وسيط متوافق مع OpenAI/Anthropic (LM Studio، vLLM، LiteLLM، إلخ)

<Tip>
لا تضع "كل النماذج" بشكل ثابت في المستندات. القائمة المعتمدة هي أيًّا كان ما ترجعه `discoverModels(...)` على جهازك، إضافة إلى أي مفاتيح متاحة.
</Tip>

## بيانات الاعتماد (لا تودعها أبدًا)

تكتشف الاختبارات الحية بيانات الاعتماد بالطريقة نفسها التي يستخدمها CLI. الآثار العملية:

- إذا كان CLI يعمل، فينبغي أن تعثر الاختبارات الحية على المفاتيح نفسها.
- إذا قال اختبار حي "no creds"، فصحّح المشكلة بالطريقة نفسها التي ستصحح بها `openclaw models list` / اختيار النموذج.

- ملفات تعريف المصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (هذا ما يعنيه "profile keys" في الاختبارات الحية)
- الإعدادات: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى المنزل الحي المرحلي عند وجوده، لكنه ليس مخزن مفاتيح الملف الشخصي الرئيسي)
- تنسخ التشغيلات المحلية الحية الإعداد النشط، وملفات `auth-profiles.json` لكل وكيل، و`credentials/` القديمة، وأدلة مصادقة CLI الخارجية المدعومة إلى منزل اختبار مؤقت افتراضيًا؛ وتتخطى المنازل الحية المرحلية `workspace/` و`sandboxes/`، وتُزال تجاوزات مسارات `agents.*.workspace` / `agentDir` كي تبقى المجسات بعيدة عن مساحة عمل مضيفك الحقيقية.

إذا أردت الاعتماد على مفاتيح env، فصدّرها قبل الاختبارات المحلية أو استخدم
مشغلات Docker أدناه مع `OPENCLAW_PROFILE_FILE` صريح.

## Deepgram حي (نسخ الصوت)

- الاختبار: `extensions/deepgram/audio.live.test.ts`
- التفعيل: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## خطة ترميز BytePlus حية

- الاختبار: `extensions/byteplus/live.test.ts`
- التفعيل: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- تجاوز اختياري للنموذج: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## وسائط سير عمل ComfyUI حية

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يختبر مسارات الصور والفيديو و`music_generate` المضمّنة في comfy
  - يتخطى كل قدرة ما لم تكن `plugins.entries.comfy.config.<capability>` مهيأة
  - مفيد بعد تغيير إرسال سير عمل comfy، أو الاستقصاء، أو التنزيلات، أو تسجيل Plugin

## توليد الصور حيًا

- الاختبار: `test/image-generation.runtime.live.test.ts`
- الأمر: `pnpm test:live test/image-generation.runtime.live.test.ts`
- الحاضنة: `pnpm test:live:media image`
- النطاق:
  - يحصي كل Plugin مسجل لمزوّد توليد الصور
  - يستخدم متغيرات env الخاصة بالمزوّد والمصدّرة مسبقًا قبل الاستكشاف
  - يستخدم مفاتيح API الحية/env قبل ملفات تعريف المصادقة المخزنة افتراضيًا، بحيث لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا قابلًا للاستخدام
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل التجاوزات المعتمدة على env فقط

لمسار CLI المشحون، أضف اختبار دخان `infer` بعد نجاح الاختبار الحي
للمزوّد/وقت التشغيل:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

يغطي هذا تحليل وسائط CLI، وحل إعدادات/وكيل افتراضي، وتفعيل
Plugin المضمّن، ووقت تشغيل توليد الصور المشترك، وطلب المزوّد الحي.
من المتوقع أن تكون تبعيات Plugin موجودة قبل تحميل وقت التشغيل.

## توليد الموسيقى حيًا

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- الحاضنة: `pnpm test:live:media music`
- النطاق:
  - يختبر مسار مزوّد توليد الموسيقى المضمّن المشترك
  - يغطي حاليًا Google وMiniMax
  - يستخدم متغيرات env الخاصة بالمزوّد والمصدّرة مسبقًا قبل الاستكشاف
  - يستخدم مفاتيح API الحية/env قبل ملفات تعريف المصادقة المخزنة افتراضيًا، بحيث لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا قابلًا للاستخدام
  - يشغّل نمطي وقت التشغيل المعلنين عند توفرهما:
    - `generate` بإدخال موجّه فقط
    - `edit` عندما يعلن المزوّد `capabilities.edit.enabled`
  - تغطية المسار المشترك الحالية:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ملف Comfy الحي منفصل، وليس هذا المسح المشترك
- تضييق اختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل التجاوزات المعتمدة على env فقط

## توليد الفيديو حيًا

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- الحاضنة: `pnpm test:live:media video`
- النطاق:
  - يختبر مسار مزوّد توليد الفيديو المضمّن المشترك
  - يضبط افتراضيًا مسار دخان آمن للإصدار: مزوّدون غير FAL، وطلب نص إلى فيديو واحد لكل مزوّد، وموجّه لوبستر مدته ثانية واحدة، وحد أقصى للعملية لكل مزوّد من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` افتراضيًا)
  - يتخطى FAL افتراضيًا لأن زمن انتظار الطابور من جهة المزوّد قد يهيمن على وقت الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحة
  - يستخدم متغيرات env الخاصة بالمزوّد والمصدّرة مسبقًا قبل الاستكشاف
  - يستخدم مفاتيح API الحية/env قبل ملفات تعريف المصادقة المخزنة افتراضيًا، بحيث لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملفًا شخصيًا/نموذجًا قابلًا للاستخدام
  - يشغّل `generate` فقط افتراضيًا
  - اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن المزوّد `capabilities.imageToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال صورة محلية مدعومة بمخزن مؤقت في المسح المشترك
    - `videoToVideo` عندما يعلن المزوّد `capabilities.videoToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال فيديو محلي مدعوم بمخزن مؤقت في المسح المشترك
  - مزوّدو `imageToVideo` المعلنون لكن المتخطون حاليًا في المسح المشترك:
    - `vydra` لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب URL صورة بعيدًا
  - تغطية Vydra الخاصة بالمزوّد:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل ذلك الملف `veo3` نص إلى فيديو إضافة إلى مسار `kling` يستخدم تثبيت URL صورة بعيدًا افتراضيًا
  - تغطية `videoToVideo` الحية الحالية:
    - `runway` فقط عندما يكون النموذج المحدد `runway/gen4_aleph`
  - مزوّدو `videoToVideo` المعلنون لكن المتخطون حاليًا في المسح المشترك:
    - `alibaba`, `qwen`, `xai` لأن تلك المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا مدعومًا بمخزن مؤقت، وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات وصول تحرير الفيديو الخاصة بالمؤسسة
- تضييق اختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزوّد في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل حد كل عملية مزوّد لتشغيل دخان مكثف
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل التجاوزات المعتمدة على env فقط

## حاضنة الوسائط الحية

- الأمر: `pnpm test:live:media`
- الغرض:
  - تشغّل مجموعات الاختبارات الحية المشتركة للصور والموسيقى والفيديو عبر نقطة دخول واحدة أصلية للمستودع
  - تستخدم متغيرات env الخاصة بالمزوّد والمصدّرة مسبقًا
  - تضيّق كل مجموعة تلقائيًا افتراضيًا إلى المزوّدين الذين لديهم حاليًا مصادقة قابلة للاستخدام
  - تعيد استخدام `scripts/test-live.mjs`، لذلك يبقى سلوك Heartbeat ووضع الهدوء متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ذات صلة

- [الاختبار](/ar/help/testing) - مجموعات اختبارات الوحدة، والتكامل، وQA، وDocker
