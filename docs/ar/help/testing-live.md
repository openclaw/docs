---
read_when:
    - تشغيل اختبارات سلامة أولية مباشرة لمصفوفة النماذج / الواجهة الخلفية لـ CLI / ACP / موفّر الوسائط
    - استكشاف أخطاء حلّ بيانات اعتماد الاختبارات الحية وإصلاحها
    - إضافة اختبار مباشر جديد خاص بمزوّد خدمة
sidebarTitle: Live tests
summary: 'اختبارات مباشرة (تتصل بالشبكة): مصفوفة النماذج، واجهات CLI الخلفية، ACP، موفرو الوسائط، بيانات الاعتماد'
title: 'الاختبار: مجموعات الاختبار المباشرة'
x-i18n:
    generated_at: "2026-05-04T18:23:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03b8ca6348137a55c8d5f67c9c166a130a75a744f6a433cb00496756b29d7016
    source_path: help/testing-live.md
    workflow: 16
---

للبداية السريعة، ومشغلات QA، ومجموعات اختبارات الوحدة/التكامل، وتدفقات Docker، راجع
[الاختبار](/ar/help/testing). تغطي هذه الصفحة مجموعات الاختبار **المباشرة** (التي تلامس الشبكة):
مصفوفة النماذج، وخلفيات CLI، وACP، واختبارات موفري الوسائط المباشرة، بالإضافة إلى
التعامل مع بيانات الاعتماد.

## مباشر: أوامر اختبار دخان الملفات الشخصية المحلية

استورد `~/.profile` قبل الفحوصات المباشرة المخصصة حتى تتطابق مفاتيح الموفرين ومسارات الأدوات المحلية
مع صدفتك:

```bash
source ~/.profile
```

اختبار دخان آمن للوسائط:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

اختبار دخان آمن لجاهزية مكالمة صوتية:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` تشغيل تجريبي ما لم يكن `--yes` موجودًا أيضًا. استخدم `--yes` فقط
عندما تريد عمدًا إجراء مكالمة إشعار حقيقية. بالنسبة إلى Twilio وTelnyx و
Plivo، يتطلب فحص الجاهزية الناجح عنوان Webhook URL عامًا؛ يتم رفض بدائل
local loopback/الخاصة محليًا حسب التصميم.

## مباشر: مسح قدرات Node Android

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر معلن حاليًا** بواسطة Node Android متصلة والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد مسبق/يدوي مشروط (لا تقوم المجموعة بتثبيت/تشغيل/إقران التطبيق).
  - تحقق Gateway `node.invoke` أمرًا بأمر لـ Node Android المحددة.
- الإعداد المسبق المطلوب:
  - تطبيق Android متصل ومقترن بالفعل مع Gateway.
  - إبقاء التطبيق في المقدمة.
  - منح الأذونات/موافقة الالتقاط للقدرات التي تتوقع نجاحها.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## مباشر: اختبار دخان النماذج (مفاتيح الملفات الشخصية)

تنقسم الاختبارات المباشرة إلى طبقتين حتى نتمكن من عزل حالات الفشل:

- "النموذج المباشر" يخبرنا ما إذا كان الموفر/النموذج يستطيع الإجابة أصلًا باستخدام المفتاح المعطى.
- "اختبار دخان Gateway" يخبرنا ما إذا كان مسار Gateway+الوكيل الكامل يعمل لذلك النموذج (الجلسات، السجل، الأدوات، سياسة صندوق العزل، وما إلى ذلك).

### الطبقة 1: إكمال النموذج المباشر (بدون Gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (وانحدارات مستهدفة عند الحاجة)
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- اضبط `OPENCLAW_LIVE_MODELS=modern` (أو `all`، وهو اسم بديل لـ modern) لتشغيل هذه المجموعة فعليًا؛ وإلا فإنها تتخطى للحفاظ على تركيز `pnpm test:live` على اختبار دخان Gateway
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تعتمد عمليات المسح الحديثة/الكل حدًا افتراضيًا منسقًا عالي الإشارة؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لمسح حديث شامل أو رقمًا موجبًا لحد أصغر.
  - تستخدم عمليات المسح الشاملة `OPENCLAW_LIVE_TEST_TIMEOUT_MS` لمهلة اختبار النموذج المباشر بالكامل. الافتراضي: 60 دقيقة.
  - تعمل مجسات النموذج المباشر بتوازٍ من 20 مهمة افتراضيًا؛ اضبط `OPENCLAW_LIVE_MODEL_CONCURRENCY` للتجاوز.
- كيفية اختيار الموفرين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن الملفات الشخصية وبدائل البيئة
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن الملفات الشخصية** فقط
- لماذا يوجد هذا:
  - يفصل بين "واجهة API الخاصة بالموفر معطلة / المفتاح غير صالح" و"مسار وكيل Gateway معطل"
  - يحتوي على انحدارات صغيرة ومعزولة (مثال: إعادة تشغيل الاستدلال في OpenAI Responses/Codex Responses + تدفقات استدعاء الأدوات)

### الطبقة 2: اختبار دخان Gateway + وكيل التطوير (ما يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل Gateway داخل العملية
  - إنشاء/ترقيع جلسة `agent:dev:*` (تجاوز النموذج لكل تشغيل)
  - تكرار النماذج ذات المفاتيح والتحقق من:
    - استجابة "ذات معنى" (بدون أدوات)
    - عمل استدعاء أداة حقيقي (مجس قراءة)
    - مجسات أدوات إضافية اختيارية (مجس تنفيذ+قراءة)
    - استمرار عمل مسارات انحدار OpenAI (استدعاء أداة فقط → متابعة)
- تفاصيل المجسات (حتى تتمكن من شرح حالات الفشل بسرعة):
  - مجس `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل `read` قراءته وإرجاع nonce.
  - مجس `exec+read`: يطلب الاختبار من الوكيل كتابة nonce باستخدام `exec` في ملف مؤقت، ثم `read` قراءته مرة أخرى.
  - مجس الصورة: يرفق الاختبار ملف PNG مولدًا (قطة + رمز عشوائي) ويتوقع من النموذج إرجاع `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تعتمد عمليات مسح Gateway الحديثة/الكل حدًا افتراضيًا منسقًا عالي الإشارة؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لمسح حديث شامل أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار الموفرين (تجنب "كل شيء من OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- مجسات الأدوات + الصور مفعلة دائمًا في هذا الاختبار المباشر:
  - مجس `read` + مجس `exec+read` (ضغط الأدوات)
  - يعمل مجس الصورة عندما يعلن النموذج دعم إدخال الصور
  - التدفق (مستوى عالٍ):
    - يولد الاختبار ملف PNG صغيرًا يحتوي على "CAT" + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسله عبر `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: يحتوي الرد على `cat` + الرمز (تحمل OCR: مسموح بأخطاء طفيفة)

<Tip>
لمعرفة ما يمكنك اختباره على جهازك (ومعرفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## مباشر: اختبار دخان خلفية CLI (Claude أو Codex أو Gemini أو CLIs محلية أخرى)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من مسار Gateway + الوكيل باستخدام خلفية CLI محلية، دون لمس تكوينك الافتراضي.
- تعيش افتراضيات اختبار الدخان الخاصة بكل خلفية مع تعريف `cli-backend.ts` الخاص بالامتداد المالك.
- التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- الافتراضيات:
  - الموفر/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/الوسائط/الصورة من بيانات Plugin الخلفية المالكة لـ CLI.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في الموجه). تعطل وصفات Docker هذا افتراضيًا ما لم يُطلب صراحة.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من حقنها في الموجه.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عند تعيين `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دور ثانٍ والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` للاشتراك في مجس استمرارية الجلسة نفسها من Claude Sonnet -> Opus عندما يدعم النموذج المحدد هدف تبديل. تعطل وصفات Docker هذا افتراضيًا من أجل موثوقية التجميع.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` للاشتراك في مجس MCP/الأداة عبر local loopback. تعطل وصفات Docker هذا افتراضيًا ما لم يُطلب صراحة.

مثال:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

اختبار دخان رخيص لتكوين Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

هذا لا يطلب من Gemini توليد استجابة. يكتب إعدادات النظام نفسها التي
يعطيها OpenClaw إلى Gemini، ثم يشغل `gemini --debug mcp list` لإثبات أن خادم
`transport: "streamable-http"` المحفوظ يتم تطبيعه إلى شكل MCP HTTP الخاص بـ Gemini
ويمكنه الاتصال بخادم MCP محلي قابل للبث عبر HTTP.

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
- يشغل اختبار دخان خلفية CLI المباشر داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير جذري.
- يحل بيانات اختبار دخان CLI من الامتداد المالك، ثم يثبت حزمة Linux CLI المطابقة (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزنة مؤقتًا عند `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` اشتراك Claude Code OAuth قابلًا للنقل عبر إما `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. يثبت أولًا تشغيل `claude -p` المباشر في Docker، ثم يشغل دورتين لخلفية Gateway CLI دون الحفاظ على متغيرات بيئة مفتاح Anthropic API. يعطل مسار الاشتراك هذا مجسات Claude MCP/الأداة والصورة افتراضيًا لأن Claude يوجه حاليًا استخدام تطبيقات الجهات الخارجية عبر فوترة استخدام إضافي بدلًا من حدود خطة الاشتراك العادية.
- يختبر اختبار دخان خلفية CLI المباشر الآن التدفق الكامل نفسه لـ Claude وCodex وGemini: دور نصي، ثم دور تصنيف صورة، ثم استدعاء أداة MCP `cron` يتم التحقق منه عبر Gateway CLI.
- يرقع اختبار الدخان الافتراضي لـ Claude أيضًا الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة لا تزال تتذكر ملاحظة سابقة.

## مباشر: قابلية وصول وكيل APNs HTTP/2

- الاختبار: `src/infra/push-apns-http2.live.test.ts`
- الهدف: إنشاء نفق عبر وكيل HTTP CONNECT محلي إلى نقطة نهاية APNs الخاصة بصندوق عزل Apple، وإرسال طلب تحقق APNs HTTP/2، والتحقق من عودة استجابة Apple الحقيقية `403 InvalidProviderToken` عبر مسار الوكيل.
- التفعيل:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- مهلة اختيارية:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## مباشر: اختبار دخان ربط ACP (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط محادثة ACP الحقيقي مع وكيل ACP حي:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة قناة رسائل اصطناعية في مكانها
  - إرسال متابعة عادية في المحادثة نفسها
  - التحقق من وصول المتابعة إلى نص جلسة ACP المرتبطة
- التفعيل:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- الإعدادات الافتراضية:
  - وكلاء ACP في Docker: `claude,codex,gemini`
  - وكيل ACP للتشغيل المباشر `pnpm test:live ...`: `claude`
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
  - يستخدم هذا المسار سطح Gateway `chat.send` مع حقول مسار منشأ اصطناعية مخصصة للمسؤول فقط، بحيث يمكن للاختبارات إرفاق سياق قناة الرسائل من دون التظاهر بالتسليم خارجيًا.
  - عندما لا يكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` معينًا، يستخدم الاختبار سجل الوكلاء المدمج في Plugin `acpx` المضمن لوكيل ACP المختار للتسخير.
  - إنشاء MCP الخاص بـ Cron للجلسة المرتبطة هو أفضل جهد افتراضيًا لأن تسخيرات ACP الخارجية يمكن أن تلغي استدعاءات MCP بعد نجاح إثبات الربط/الصورة؛ عيّن `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` لجعل فحص Cron بعد الربط صارمًا.

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
- افتراضيًا، يشغل فحص ACP bind السريع ضد وكلاء CLI الحيين التجميعيين بالتتابع: `claude`، ثم `codex`، ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`، أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`، أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`، أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`، أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` لتضييق المصفوفة.
- يحمّل `~/.profile`، ويرحل مواد مصادقة CLI المطابقة إلى الحاوية، ثم يثبت CLI الحي المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو Factory Droid عبر `https://app.factory.ai/cli` أو `@google/gemini-cli` أو `opencode-ai`) إذا كانت مفقودة. خلفية ACP نفسها هي حزمة `acpx/runtime` المضمنة من Plugin `acpx` الرسمي.
- متغير Docker الخاص بـ Droid يرحل `~/.factory` للإعدادات، ويمرر `FACTORY_API_KEY`، ويتطلب مفتاح API هذا لأن مصادقة Factory المحلية عبر OAuth/حافظة المفاتيح غير قابلة للنقل إلى الحاوية. يستخدم إدخال السجل المدمج في ACPX وهو `droid exec --output-format acp`.
- متغير Docker الخاص بـ OpenCode هو مسار انحدار صارم لوكيل واحد. يكتب نموذجًا افتراضيًا مؤقتًا في `OPENCODE_CONFIG_CONTENT` من `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (الافتراضي `opencode/kimi-k2.6`) بعد تحميل `~/.profile`، ويتطلب `pnpm test:docker:live-acp-bind:opencode` نص مساعد مرتبط بدلًا من قبول التجاوز العام بعد الربط.
- استدعاءات CLI المباشرة لـ `acpx` ليست سوى مسار يدوي/التفاف للمقارنة بين السلوك خارج Gateway. يفحص فحص ACP bind السريع في Docker خلفية وقت تشغيل `acpx` المضمنة في OpenClaw.

## حي: فحص سريع لتسخير خادم تطبيق Codex

- الهدف: التحقق من التسخير المملوك من Plugin لـ Codex عبر طريقة Gateway العادية
  `agent`:
  - تحميل Plugin المضمن `codex`
  - اختيار `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول دورة وكيل Gateway إلى `openai/gpt-5.5` مع فرض تسخير Codex
  - إرسال دورة ثانية إلى جلسة OpenClaw نفسها والتحقق من أن خيط خادم التطبيق
    يمكنه الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار أوامر Gateway نفسه
  - اختياريًا تشغيل فحصين مصعدين للصدفة بمراجعة Guardian: أمر حميد
    ينبغي أن تتم الموافقة عليه ورفع سر مزيف ينبغي
    رفضه بحيث يسأل الوكيل مجددًا
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `openai/gpt-5.5`
- فحص صورة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- فحص MCP/أداة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- فحص Guardian اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- يستخدم الفحص السريع `agentRuntime.id: "codex"` حتى لا يستطيع تسخير Codex المعطل
  النجاح عبر الرجوع الصامت إلى PI.
- المصادقة: مصادقة خادم تطبيق Codex من تسجيل الدخول المحلي لاشتراك Codex. يمكن لفحوصات Docker السريعة أيضًا توفير `OPENAI_API_KEY` للفحوصات غير الخاصة بـ Codex عند الاقتضاء،
  بالإضافة إلى `~/.codex/auth.json` و`~/.codex/config.toml` المنسوخين اختياريًا.

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

- مشغل Docker موجود في `scripts/test-live-codex-harness-docker.sh`.
- يحمّل `~/.profile` المركب، ويمرر `OPENAI_API_KEY`، وينسخ ملفات مصادقة Codex CLI
  عند وجودها، ويثبت `@openai/codex` في بادئة npm مركبة قابلة للكتابة،
  ويرحل شجرة المصدر، ثم يشغل اختبار Codex-harness الحي فقط.
- يفعّل Docker فحوصات الصورة وMCP/الأداة وGuardian افتراضيًا. عيّن
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` عندما تحتاج إلى تشغيل تصحيح أضيق.
- يستخدم Docker إعداد وقت تشغيل Codex الصريح نفسه، لذلك لا يمكن للأسماء المستعارة القديمة أو
  الرجوع إلى PI إخفاء انحدار في تسخير Codex.

### وصفات حية موصى بها

قوائم السماح الضيقة والصريحة هي الأسرع والأقل عرضة للتذبذب:

- نموذج واحد، مباشر (بلا Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، فحص Gateway سريع:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة موفرين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تركيز Google (مفتاح Gemini API + Antigravity):
  - Gemini (مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- فحص سريع للتفكير التكيفي في Google:
  - إذا كانت المفاتيح المحلية موجودة في ملف تعريف الصدفة: `source ~/.profile`
  - الافتراضي الديناميكي لـ Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - ميزانية Gemini 2.5 الديناميكية: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

ملاحظات:

- يستخدم `google/...` واجهة Gemini API (مفتاح API).
- يستخدم `google-antigravity/...` جسر OAuth الخاص بـ Antigravity (نقطة نهاية وكيل بنمط Cloud Code Assist).
- يستخدم `google-gemini-cli/...` Gemini CLI المحلي على جهازك (مصادقة منفصلة + خصوصيات أدوات).
- مقارنة Gemini API مع Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة لدى Google عبر HTTP (مفتاح API / مصادقة ملف تعريف)؛ هذا ما يقصده معظم المستخدمين بـ “Gemini”.
  - CLI: يشغل OpenClaw ملفًا ثنائيًا محليًا باسم `gemini` عبر الصدفة؛ لديه مصادقته الخاصة ويمكن أن يتصرف بشكل مختلف (دعم البث/الأدوات/اختلاف الإصدارات).

## حي: مصفوفة النماذج (ما نغطيه)

لا توجد "قائمة نماذج CI" ثابتة (الحي اختياري)، لكن هذه هي النماذج **الموصى بها** لتغطيتها بانتظام على جهاز تطوير لديه مفاتيح.

### مجموعة الفحص السريع الحديثة (استدعاء الأدوات + صورة)

هذا هو تشغيل "النماذج الشائعة" الذي نتوقع إبقاءه عاملًا:

- OpenAI (غير Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview` (تجنب نماذج Gemini 2.x الأقدم)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و`google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` و`deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

شغّل فحص Gateway السريع مع الأدوات + الصورة:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### الأساس: استدعاء الأدوات (قراءة + تنفيذ اختياري)

اختر واحدًا على الأقل لكل عائلة موفرين:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (جيدة إن توفرت):

- xAI: `xai/grok-4.3` (أو الأحدث المتاح)
- Mistral: `mistral/`… (اختر نموذجًا واحدًا قادرًا على "الأدوات" ومفعلًا لديك)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### الرؤية: إرسال صورة (مرفق → رسالة متعددة الوسائط)

أدرج نموذجًا واحدًا على الأقل قادرًا على الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (متغيرات Claude/Gemini/OpenAI القادرة على الرؤية، إلخ) لتشغيل فحص الصورة.

### المجمعات / البوابات البديلة

إذا كانت لديك مفاتيح مفعلة، فنحن ندعم أيضًا الاختبار عبر:

- OpenRouter: `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين قادرين على الأدوات+الصور)
- OpenCode: `opencode/...` لـ Zen و`opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

موفرون إضافيون يمكنك تضمينهم في المصفوفة الحية (إذا كانت لديك بيانات اعتماد/إعدادات):

- مدمج: `openai`، `openai-codex`، `anthropic`، `google`، `google-vertex`، `google-antigravity`، `google-gemini-cli`، `zai`، `openrouter`، `opencode`، `opencode-go`، `xai`، `groq`، `cerebras`، `mistral`، `github-copilot`
- عبر `models.providers` (نقاط نهاية مخصصة): `minimax` (سحابة/API)، بالإضافة إلى أي وكيل متوافق مع OpenAI/Anthropic (LM Studio، وvLLM، وLiteLLM، إلخ)

<Tip>
لا ترمز "كل النماذج" صراحة في الوثائق. القائمة الموثوقة هي كل ما يعيده `discoverModels(...)` على جهازك بالإضافة إلى أي مفاتيح متاحة.
</Tip>

## بيانات الاعتماد (لا تلتزم بها أبدًا)

تكتشف الاختبارات الحية بيانات الاعتماد بالطريقة نفسها التي يستخدمها CLI. الآثار العملية:

- إذا كان CLI يعمل، فينبغي أن تعثر الاختبارات المباشرة على المفاتيح نفسها.
- إذا قال اختبار مباشر “no creds”، فصحّح المشكلة بالطريقة نفسها التي تصحّح بها `openclaw models list` / اختيار النموذج.

- ملفات تعريف المصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (هذا ما تعنيه “profile keys” في الاختبارات المباشرة)
- الإعداد: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى الصفحة الرئيسية المباشرة المرحلية عند وجوده، لكنه ليس مخزن مفاتيح الملف الشخصي الرئيسي)
- تنسخ التشغيلات المحلية المباشرة افتراضياً الإعداد النشط، وملفات `auth-profiles.json` لكل وكيل، و`credentials/` القديمة، وأدلة مصادقة CLI الخارجية المدعومة إلى صفحة رئيسية مؤقتة للاختبار؛ وتتخطى الصفحات الرئيسية المباشرة المرحلية `workspace/` و`sandboxes/`، وتُزال تجاوزات مسار `agents.*.workspace` / `agentDir` حتى تبقى عمليات الفحص بعيدة عن مساحة عمل المضيف الحقيقية لديك.

إذا أردت الاعتماد على مفاتيح البيئة (مثلاً المصدّرة في `~/.profile`)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغلات Docker أدناه (يمكنها وصل `~/.profile` داخل الحاوية).

## Deepgram مباشر (نسخ صوتي)

- الاختبار: `extensions/deepgram/audio.live.test.ts`
- التفعيل: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## خطة ترميز BytePlus مباشرة

- الاختبار: `extensions/byteplus/live.test.ts`
- التفعيل: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- تجاوز النموذج الاختياري: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## وسائط سير عمل ComfyUI مباشرة

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يختبر مسارات الصور والفيديو و`music_generate` المضمّنة في comfy
  - يتخطى كل إمكانية ما لم يكن `plugins.entries.comfy.config.<capability>` مُعداً
  - مفيد بعد تغيير إرسال سير عمل comfy أو الاستقصاء أو التنزيلات أو تسجيل Plugin

## توليد الصور مباشرة

- الاختبار: `test/image-generation.runtime.live.test.ts`
- الأمر: `pnpm test:live test/image-generation.runtime.live.test.ts`
- حزمة الاختبار: `pnpm test:live:media image`
- النطاق:
  - يحصي كل Plugin مسجل لمزوّد توليد الصور
  - يحمّل متغيرات بيئة المزوّد الناقصة من صدفة تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API المباشرة/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضياً، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملف تعريف/نموذجاً قابلاً للاستخدام
  - يشغّل كل مزوّد مُعد عبر وقت تشغيل توليد الصور المشترك:
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
- التضييق الاختياري:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- سلوك المصادقة الاختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل التجاوزات المعتمدة على البيئة فقط

لمسار CLI المشحون، أضف فحص `infer` سريعاً بعد نجاح اختبار المزوّد/وقت التشغيل المباشر:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

يغطي هذا تحليل وسيطات CLI، وحل إعداد/الوكيل الافتراضي، وتفعيل Plugin المضمّن، ووقت تشغيل توليد الصور المشترك، وطلب المزوّد المباشر. يُتوقع أن تكون اعتماديات Plugin موجودة قبل تحميل وقت التشغيل.

## توليد الموسيقى مباشرة

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- حزمة الاختبار: `pnpm test:live:media music`
- النطاق:
  - يختبر مسار مزوّد توليد الموسيقى المضمّن المشترك
  - يغطي حالياً Google وMiniMax
  - يحمّل متغيرات بيئة المزوّد من صدفة تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API المباشرة/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضياً، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملف تعريف/نموذجاً قابلاً للاستخدام
  - يشغّل وضعي وقت التشغيل المعلنين عند توفرهما:
    - `generate` مع إدخال مطالبة فقط
    - `edit` عندما يعلن المزوّد `capabilities.edit.enabled`
  - تغطية المسار المشترك الحالية:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ملف Comfy المباشر منفصل، وليس ضمن هذا الفحص المشترك
- التضييق الاختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- سلوك المصادقة الاختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل التجاوزات المعتمدة على البيئة فقط

## توليد الفيديو مباشرة

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- حزمة الاختبار: `pnpm test:live:media video`
- النطاق:
  - يختبر مسار مزوّد توليد الفيديو المضمّن المشترك
  - يعتمد افتراضياً مسار الفحص السريع الآمن للإصدار: مزوّدون غير FAL، وطلب نص إلى فيديو واحد لكل مزوّد، ومطالبة جراد بحر مدتها ثانية واحدة، وحد عملية لكل مزوّد من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` افتراضياً)
  - يتخطى FAL افتراضياً لأن زمن انتظار الطابور من جهة المزوّد قد يهيمن على وقت الإصدار؛ مرر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحة
  - يحمّل متغيرات بيئة المزوّد من صدفة تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API المباشرة/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضياً، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملف تعريف/نموذجاً قابلاً للاستخدام
  - يشغّل `generate` فقط افتراضياً
  - عيّن `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضاً عند توفرها:
    - `imageToVideo` عندما يعلن المزوّد `capabilities.imageToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال صورة محلية مدعومة بمخزن مؤقت في الفحص المشترك
    - `videoToVideo` عندما يعلن المزوّد `capabilities.videoToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال فيديو محلي مدعوم بمخزن مؤقت في الفحص المشترك
  - مزوّدو `imageToVideo` المعلنون لكن المتخطون حالياً في الفحص المشترك:
    - `vydra` لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب عنوان URL لصورة بعيدة
  - تغطية Vydra الخاصة بالمزوّد:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل ذلك الملف مسار `veo3` من نص إلى فيديو إضافة إلى مسار `kling` يستخدم مثبت عنوان URL لصورة بعيدة افتراضياً
  - تغطية `videoToVideo` المباشرة الحالية:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - مزوّدو `videoToVideo` المعلنون لكن المتخطون حالياً في الفحص المشترك:
    - `alibaba`, `qwen`, `xai` لأن تلك المسارات تتطلب حالياً عناوين URL مرجعية بعيدة من نوع `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالاً محلياً مدعوماً بمخزن مؤقت، وذلك المسار غير مقبول في الفحص المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات وصول خاصة بالمؤسسة لتلوين/إعادة مزج الفيديو
- التضييق الاختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لإدراج كل مزوّد في الفحص الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل حد كل عملية مزوّد لتشغيل فحص سريع قوي
- سلوك المصادقة الاختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات الشخصية وتجاهل التجاوزات المعتمدة على البيئة فقط

## حزمة اختبار الوسائط المباشرة

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل مجموعات الاختبارات المباشرة المشتركة للصور والموسيقى والفيديو عبر نقطة دخول أصلية واحدة في المستودع
  - يحمّل تلقائياً متغيرات بيئة المزوّد الناقصة من `~/.profile`
  - يضيّق تلقائياً كل مجموعة افتراضياً إلى المزوّدين الذين لديهم حالياً مصادقة قابلة للاستخدام
  - يعيد استخدام `scripts/test-live.mjs`، لذا يبقى سلوك Heartbeat والوضع الهادئ متسقاً
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ذو صلة

- [الاختبار](/ar/help/testing) — مجموعات اختبارات الوحدة والتكامل وQA وDocker
