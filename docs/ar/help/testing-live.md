---
read_when:
    - تشغيل مصفوفة النماذج الحية / الواجهة الخلفية لـ CLI / ACP / اختبارات smoke لموفّر الوسائط
    - تصحيح أخطاء حل بيانات اعتماد الاختبارات الحية
    - إضافة اختبار مباشر جديد خاص بموفّر
sidebarTitle: Live tests
summary: 'الاختبارات الحية (التي تتعامل مع الشبكة): مصفوفة النماذج، واجهات CLI الخلفية، ACP، مزوّدو الوسائط، بيانات الاعتماد'
title: 'الاختبار: مجموعات الاختبارات الحية'
x-i18n:
    generated_at: "2026-05-06T07:58:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: a17a8065fd15c6d86ab782cb1fdb00d0b2558be2d43fb7cab3ca6e511055b82e
    source_path: help/testing-live.md
    workflow: 16
---

للبدء السريع، ومشغلات QA، ومجموعات اختبارات الوحدة/التكامل، وتدفقات Docker، راجع
[الاختبار](/ar/help/testing). تغطي هذه الصفحة مجموعات الاختبارات **الحية** (التي تلامس الشبكة):
مصفوفة النماذج، وخلفيات CLI، وACP، واختبارات موفري الوسائط الحية، بالإضافة إلى
التعامل مع بيانات الاعتماد.

## حي: أوامر فحص الدخان للملف الشخصي المحلي

قم بتحميل `~/.profile` قبل الفحوصات الحية المخصصة حتى تتطابق مفاتيح الموفّر ومسارات الأدوات
المحلية مع الصدفة لديك:

```bash
source ~/.profile
```

فحص دخان وسائط آمن:

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

`voicecall smoke` هو تشغيل جاف ما لم يكن `--yes` موجودًا أيضًا. استخدم `--yes` فقط
عندما تريد عمدًا إجراء مكالمة إشعار حقيقية. بالنسبة إلى Twilio وTelnyx و
Plivo، يتطلب فحص الجاهزية الناجح عنوان URL عامًا لـ Webhook؛ يتم رفض بدائل
local loopback/الخاصة المحلية بحكم التصميم.

## حي: مسح قدرات Node على Android

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر معلن عنه حاليًا** بواسطة Node Android متصل والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد مسبق/يدوي (المجموعة لا تثبت/تشغل/تقرن التطبيق).
  - تحقق `node.invoke` في Gateway أمرًا بأمر لـ Node Android المحدد.
- الإعداد المسبق المطلوب:
  - تطبيق Android متصل بالفعل ومقترن بـ Gateway.
  - إبقاء التطبيق في المقدمة.
  - منح الأذونات/موافقة الالتقاط للقدرات التي تتوقع نجاحها.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## حي: فحص دخان النماذج (مفاتيح الملف الشخصي)

تنقسم الاختبارات الحية إلى طبقتين حتى نتمكن من عزل الأعطال:

- "النموذج المباشر" يخبرنا ما إذا كان الموفّر/النموذج يستطيع الإجابة أصلًا بالمفتاح المعطى.
- "فحص دخان Gateway" يخبرنا ما إذا كان مسار Gateway+الوكيل الكامل يعمل لذلك النموذج (الجلسات، والسجل، والأدوات، وسياسة الصندوق الرملي، وغير ذلك).

### الطبقة 1: إكمال النموذج المباشر (بدون Gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لتحديد النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (وانحدارات مستهدفة عند الحاجة)
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- اضبط `OPENCLAW_LIVE_MODELS=modern` (أو `all`، اسم مستعار للحديثة) لتشغيل هذه المجموعة فعليًا؛ وإلا فسيتم تخطيها لإبقاء `pnpm test:live` مركزًا على فحص دخان Gateway
- كيفية تحديد النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم مستعار لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تستخدم مسوحات modern/all حدًا منسقًا عالي الإشارة افتراضيًا؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لمسح حديث شامل أو رقمًا موجبًا لحد أصغر.
  - تستخدم المسوحات الشاملة `OPENCLAW_LIVE_TEST_TIMEOUT_MS` لمهلة اختبار النموذج المباشر بالكامل. الافتراضي: 60 دقيقة.
  - تعمل مجسات النموذج المباشر بتوازٍ مقداره 20 افتراضيًا؛ اضبط `OPENCLAW_LIVE_MODEL_CONCURRENCY` للتجاوز.
- كيفية تحديد الموفّرين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن الملفات الشخصية وبدائل env الاحتياطية
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن الملفات الشخصية** فقط
- سبب وجود هذا:
  - يفصل "واجهة API الخاصة بالموفّر معطلة / المفتاح غير صالح" عن "مسار وكيل Gateway معطل"
  - يحتوي على انحدارات صغيرة ومعزولة (مثال: إعادة تشغيل التفكير في OpenAI Responses/Codex Responses + تدفقات استدعاء الأدوات)

### الطبقة 2: فحص دخان Gateway + وكيل التطوير (ما يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل Gateway داخل العملية
  - إنشاء/تعديل جلسة `agent:dev:*` (تجاوز النموذج لكل تشغيل)
  - المرور على النماذج التي لها مفاتيح والتحقق من:
    - استجابة "ذات معنى" (بدون أدوات)
    - عمل استدعاء أداة حقيقي (مجس قراءة)
    - مجسات أدوات إضافية اختيارية (مجس exec+read)
    - استمرار عمل مسارات انحدار OpenAI (استدعاء أداة فقط → متابعة)
- تفاصيل المجسات (حتى تتمكن من شرح الأعطال بسرعة):
  - مجس `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل `read` له وإعادة صدى nonce.
  - مجس `exec+read`: يطلب الاختبار من الوكيل الكتابة عبر `exec` لـ nonce في ملف مؤقت، ثم `read` له مرة أخرى.
  - مجس الصورة: يرفق الاختبار PNG مولدًا (قطة + رمز عشوائي) ويتوقع من النموذج إرجاع `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية تحديد النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم مستعار لقائمة السماح الحديثة
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم مسوحات Gateway لـ modern/all حدًا منسقًا عالي الإشارة افتراضيًا؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لمسح حديث شامل أو رقمًا موجبًا لحد أصغر.
- كيفية تحديد الموفّرين (تجنب "كل شيء عبر OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- مجسات الأدوات + الصور مفعّلة دائمًا في هذا الاختبار الحي:
  - مجس `read` + مجس `exec+read` (ضغط الأدوات)
  - يعمل مجس الصورة عندما يعلن النموذج دعم إدخال الصور
  - التدفق (على مستوى عالٍ):
    - يولّد الاختبار PNG صغيرًا يحتوي على "CAT" + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسله عبر `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمّن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: يحتوي الرد على `cat` + الرمز (تحمل OCR: الأخطاء الطفيفة مسموحة)

<Tip>
لمعرفة ما يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## حي: فحص دخان خلفية CLI (Claude أو Codex أو Gemini أو CLIs محلية أخرى)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من مسار Gateway + الوكيل باستخدام خلفية CLI محلية، دون لمس التكوين الافتراضي لديك.
- تعيش افتراضيات فحص الدخان الخاصة بالخلفية مع تعريف `cli-backend.ts` الخاص بـ Plugin المالك.
- التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- الافتراضيات:
  - الموفّر/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/الوسائط/الصورة من بيانات Plugin الخلفية لـ CLI المالك.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في المطالبة). تعطّل وصفات Docker هذا افتراضيًا ما لم يُطلب صراحة.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من حقن المطالبة.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عند ضبط `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دورة ثانية والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` للاشتراك في مجس استمرارية الجلسة نفسها Claude Sonnet -> Opus عندما يدعم النموذج المحدد هدف تبديل. تعطّل وصفات Docker هذا افتراضيًا لموثوقية التجميع.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` للاشتراك في مجس MCP/حلقة الأدوات. تعطّل وصفات Docker هذا افتراضيًا ما لم يُطلب صراحة.

مثال:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

فحص دخان رخيص لتكوين Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

هذا لا يطلب من Gemini توليد استجابة. يكتب إعدادات النظام نفسها التي يعطيها
OpenClaw لـ Gemini، ثم يشغل `gemini --debug mcp list` لإثبات أن خادمًا محفوظًا
بقيمة `transport: "streamable-http"` يتم تطبيعه إلى شكل HTTP MCP الخاص بـ Gemini
ويمكنه الاتصال بخادم MCP محلي من نوع streamable-HTTP.

وصفة Docker:

```bash
pnpm test:docker:live-cli-backend
```

وصفات Docker لموفّر واحد:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

ملاحظات:

- يوجد مشغل Docker في `scripts/test-live-cli-backend-docker.sh`.
- يشغل فحص دخان خلفية CLI الحي داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير جذري.
- يحل بيانات فحص دخان CLI الوصفية من Plugin المالك، ثم يثبت حزمة CLI المطابقة على Linux (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزنة مؤقتًا في `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` OAuth محمولًا لاشتراك Claude Code من خلال `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. يثبت أولًا `claude -p` المباشر في Docker، ثم يشغل دورتين لخلفية CLI في Gateway دون الاحتفاظ بمتغيرات env لمفتاح Anthropic API. يعطّل مسار الاشتراك هذا مجسات Claude MCP/الأداة والصورة افتراضيًا لأن Claude يوجّه حاليًا استخدام تطبيقات الطرف الثالث عبر فوترة استخدام إضافية بدلًا من حدود خطة الاشتراك العادية.
- يشغّل فحص دخان خلفية CLI الحي الآن التدفق نفسه من طرف إلى طرف لـ Claude وCodex وGemini: دورة نصية، ودورة تصنيف صورة، ثم استدعاء أداة `cron` في MCP يتم التحقق منه عبر CLI في Gateway.
- يرقّع فحص دخان Claude الافتراضي أيضًا الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة لا تزال تتذكر ملاحظة سابقة.

## حي: قابلية الوصول إلى وكيل APNs HTTP/2

- الاختبار: `src/infra/push-apns-http2.live.test.ts`
- الهدف: إنشاء نفق عبر وكيل HTTP CONNECT محلي إلى نقطة نهاية APNs التجريبية الخاصة بـ Apple، وإرسال طلب تحقق APNs عبر HTTP/2، والتحقق من أن استجابة Apple الحقيقية `403 InvalidProviderToken` تعود عبر مسار الوكيل.
- التفعيل:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- مهلة اختيارية:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## حي: فحص دخان ربط ACP (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط محادثة ACP الحقيقي باستخدام وكيل ACP حي:
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
  - القناة الاصطناعية: سياق محادثة بأسلوب رسالة مباشرة في Slack
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
  - يستخدم هذا المسار سطح `chat.send` في Gateway مع حقول مسار منشأ اصطناعية للمشرفين فقط، حتى تتمكن الاختبارات من إرفاق سياق قناة الرسائل من دون التظاهر بالتسليم خارجيًا.
  - عندما لا يكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` معيّنًا، يستخدم الاختبار سجل الوكلاء المدمج في Plugin `acpx` المضمّن لوكيل حزمة اختبار ACP المحدد.
  - إنشاء MCP لـ Cron الجلسة المرتبطة هو بذل أقصى جهد افتراضيًا لأن حزم اختبار ACP الخارجية يمكن أن تلغي استدعاءات MCP بعد نجاح إثبات الربط/الصورة؛ عيّن `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` لجعل فحص Cron اللاحق للربط صارمًا.

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
- افتراضيًا، يشغّل اختبار الدخان لربط ACP على وكلاء CLI الحيين الإجماليين بالتسلسل: `claude`، ثم `codex`، ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` لتضييق المصفوفة.
- يقرأ `~/.profile`، ويجهّز مادة مصادقة CLI المطابقة داخل الحاوية، ثم يثبّت CLI الحي المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو Factory Droid عبر `https://app.factory.ai/cli` أو `@google/gemini-cli` أو `opencode-ai`) إذا كان مفقودًا. خلفية ACP نفسها هي حزمة `acpx/runtime` المضمّنة من Plugin `acpx` الرسمي.
- يجهّز متغير Docker الخاص بـ Droid الدليل `~/.factory` للإعدادات، ويمرر `FACTORY_API_KEY`، ويتطلب مفتاح API هذا لأن مصادقة Factory المحلية عبر OAuth/حافظة المفاتيح غير قابلة للنقل إلى الحاوية. يستخدم إدخال سجل ACPX المدمج `droid exec --output-format acp`.
- متغير Docker الخاص بـ OpenCode هو مسار تراجع صارم لوكيل واحد. يكتب نموذجًا افتراضيًا مؤقتًا في `OPENCODE_CONFIG_CONTENT` من `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (افتراضيًا `opencode/kimi-k2.6`) بعد قراءة `~/.profile`، ويتطلب `pnpm test:docker:live-acp-bind:opencode` نص مساعد مرتبطًا بدلًا من قبول التخطي العام بعد الربط.
- استدعاءات CLI المباشرة لـ `acpx` هي مسار يدوي/التفافي فقط لمقارنة السلوك خارج Gateway. اختبار دخان ربط ACP في Docker يمرّن خلفية وقت تشغيل `acpx` المضمّنة في OpenClaw.

## حي: اختبار دخان حزمة اختبار خادم تطبيق Codex

- الهدف: التحقق من حزمة اختبار Codex المملوكة للـ Plugin عبر طريقة Gateway العادية
  `agent`:
  - تحميل Plugin `codex` المضمّن
  - تحديد `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول دور وكيل في Gateway إلى `openai/gpt-5.5` مع فرض حزمة اختبار Codex
  - إرسال دور ثانٍ إلى جلسة OpenClaw نفسها والتحقق من أن خيط خادم التطبيق
    يمكنه الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار أمر Gateway نفسه
  - اختياريًا تشغيل فحصين للصدفة بتصعيد راجعهما Guardian: أمر benign
    ينبغي قبوله ورفع سر مزيف ينبغي رفضه كي يطلب الوكيل توضيحًا
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `openai/gpt-5.5`
- فحص الصورة الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- فحص MCP/الأداة الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- فحص Guardian الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- يستخدم اختبار الدخان `agentRuntime.id: "codex"` حتى لا تستطيع حزمة اختبار Codex معطّلة
  النجاح عبر الرجوع بصمت إلى PI.
- المصادقة: مصادقة خادم تطبيق Codex من تسجيل دخول اشتراك Codex المحلي. يمكن لاختبارات دخان Docker
  أيضًا توفير `OPENAI_API_KEY` لفحوصات غير Codex عند الانطباق،
  بالإضافة إلى نسخ اختيارية من `~/.codex/auth.json` و`~/.codex/config.toml`.

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
- يقرأ `~/.profile` المثبّت، ويمرر `OPENAI_API_KEY`، وينسخ ملفات مصادقة Codex CLI
  عند وجودها، ويثبّت `@openai/codex` في بادئة npm مثبتة قابلة للكتابة،
  ويجهّز شجرة المصدر، ثم يشغّل اختبار Codex-harness الحي فقط.
- يفعّل Docker فحوصات الصورة وMCP/الأداة وGuardian افتراضيًا. عيّن
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` عندما تحتاج إلى تشغيل تصحيح
  أضيق.
- يستخدم Docker إعداد وقت تشغيل Codex الصريح نفسه، لذا لا يمكن للأسماء المستعارة القديمة أو الرجوع إلى PI
  إخفاء تراجع في حزمة اختبار Codex.

### الوصفات الحية الموصى بها

قوائم السماح الضيقة والصريحة هي الأسرع والأقل هشاشة:

- نموذج واحد، مباشر (من دون Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، اختبار دخان عبر Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة مزودين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تركيز Google (مفتاح Gemini API + Antigravity):
  - Gemini (مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- اختبار دخان التفكير التكيفي في Google:
  - إذا كانت المفاتيح المحلية موجودة في ملف تعريف الصدفة: `source ~/.profile`
  - Gemini 3 افتراضي ديناميكي: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - ميزانية ديناميكية لـ Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

ملاحظات:

- يستخدم `google/...` واجهة Gemini API (مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity OAuth (نقطة نهاية وكيل بأسلوب Cloud Code Assist).
- يستخدم `google-gemini-cli/...` Gemini CLI المحلي على جهازك (مصادقة منفصلة وخصوصيات في الأدوات).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP (مفتاح API / مصادقة الملف الشخصي)؛ وهذا ما يعنيه معظم المستخدمين بعبارة "Gemini".
  - CLI: يستدعي OpenClaw ملفًا تنفيذيًا محليًا باسم `gemini` عبر الصدفة؛ لديه مصادقته الخاصة ويمكن أن يتصرف بشكل مختلف (دعم البث/الأدوات/اختلاف الإصدارات).

## حي: مصفوفة النماذج (ما نغطيه)

لا توجد "قائمة نماذج CI" ثابتة (الحي اختياري)، لكن هذه هي النماذج **الموصى بها** لتغطيتها بانتظام على جهاز تطوير لديه مفاتيح.

### مجموعة دخان حديثة (استدعاء أدوات + صورة)

هذا هو تشغيل "النماذج الشائعة" الذي نتوقع أن يبقى عاملًا:

- OpenAI (غير Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview` (تجنب نماذج Gemini 2.x الأقدم)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و`google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` و`deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

شغّل اختبار دخان Gateway مع الأدوات + الصورة:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### خط الأساس: استدعاء الأدوات (Read + Exec اختياري)

اختر واحدًا على الأقل لكل عائلة مزودين:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (مفيدة):

- xAI: `xai/grok-4.3` (أو أحدث المتاح)
- Mistral: `mistral/`… (اختر نموذجًا قادرًا على "الأدوات" ومفعّلًا لديك)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### الرؤية: إرسال صورة (مرفق → رسالة متعددة الوسائط)

ضمّن نموذجًا واحدًا على الأقل قادرًا على الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (متغيرات Claude/Gemini/OpenAI القادرة على الرؤية، إلخ) لتمرين فحص الصورة.

### المجمّعات / البوابات البديلة

إذا كانت لديك مفاتيح مفعّلة، ندعم أيضًا الاختبار عبر:

- OpenRouter: `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين قادرين على الأدوات+الصور)
- OpenCode: `opencode/...` لـ Zen و`opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزودون إضافيون يمكنك تضمينهم في المصفوفة الحية (إذا كانت لديك بيانات اعتماد/إعدادات):

- مدمج: `openai`، `openai-codex`، `anthropic`، `google`، `google-vertex`، `google-antigravity`، `google-gemini-cli`، `zai`، `openrouter`، `opencode`، `opencode-go`، `xai`، `groq`، `cerebras`، `mistral`، `github-copilot`
- عبر `models.providers` (نقاط نهاية مخصصة): `minimax` (سحابة/API)، بالإضافة إلى أي وسيط متوافق مع OpenAI/Anthropic (LM Studio، vLLM، LiteLLM، إلخ)

<Tip>
لا ترمّز "كل النماذج" صراحة في المستندات. القائمة الرسمية هي ما تعيده `discoverModels(...)` على جهازك بالإضافة إلى أي مفاتيح متاحة.
</Tip>

## بيانات الاعتماد (لا تلتزم بها أبدًا)

تكتشف الاختبارات الحية بيانات الاعتماد بالطريقة نفسها التي يفعلها CLI. الآثار العملية:

- إذا كان CLI يعمل، فينبغي أن تجد الاختبارات الحية المفاتيح نفسها.
- إذا قال اختبار حي "لا توجد بيانات اعتماد"، فصحّح المشكلة بالطريقة نفسها التي تصحح بها `openclaw models list` / اختيار النموذج.

- ملفات تعريف المصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (هذا ما تعنيه "مفاتيح ملف التعريف" في الاختبارات الحية)
- الإعدادات: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- مجلد الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى المنزل الحي المرحلي عند وجوده، لكنه ليس مخزن مفاتيح ملف التعريف الرئيسي)
- تنسخ التشغيلات المحلية الحية الإعدادات النشطة، وملفات `auth-profiles.json` لكل وكيل، و`credentials/` القديمة، ومجلدات مصادقة CLI الخارجية المدعومة إلى منزل اختبار مؤقت افتراضيًا؛ وتتخطى المنازل الحية المرحلية `workspace/` و`sandboxes/`، وتُزال تجاوزات مسار `agents.*.workspace` / `agentDir` حتى تبقى المجسات بعيدة عن مساحة عمل مضيفك الحقيقي.

إذا أردت الاعتماد على مفاتيح البيئة (مثلًا المصدّرة في `~/.profile`)، شغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغلات Docker أدناه (يمكنها تركيب `~/.profile` داخل الحاوية).

## Deepgram الحي (تفريغ الصوت)

- الاختبار: `extensions/deepgram/audio.live.test.ts`
- التفعيل: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## خطة ترميز BytePlus الحية

- الاختبار: `extensions/byteplus/live.test.ts`
- التفعيل: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- تجاوز النموذج الاختياري: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## وسائط سير عمل ComfyUI الحية

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يمرّن مسارات الصور والفيديو و`music_generate` المضمّنة في comfy
  - يتخطى كل قدرة ما لم يكن `plugins.entries.comfy.config.<capability>` مهيأ
  - مفيد بعد تغيير إرسال سير عمل comfy أو الاستقصاء أو التنزيلات أو تسجيل Plugin

## توليد الصور الحي

- الاختبار: `test/image-generation.runtime.live.test.ts`
- الأمر: `pnpm test:live test/image-generation.runtime.live.test.ts`
- أداة الاختبار: `pnpm test:live:media image`
- النطاق:
  - يسرد كل Plugin مزود مسجل لتوليد الصور
  - يحمّل متغيرات بيئة المزود المفقودة من صدفة تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزودين الذين لا يملكون مصادقة/ملف تعريف/نموذجًا قابلًا للاستخدام
  - يشغّل كل مزود مهيأ عبر وقت تشغيل توليد الصور المشترك:
    - `<provider>:generate`
    - `<provider>:edit` عندما يعلن المزود دعم التحرير
- المزودون المضمّنون الحاليون المشمولون:
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

لمسار CLI المشحون، أضف اختبار دخان `infer` بعد نجاح اختبار المزود/وقت التشغيل الحي:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

يغطي هذا تحليل وسائط CLI، وحل إعدادات/وكيل افتراضي، وتفعيل Plugin
المضمّن، ووقت تشغيل توليد الصور المشترك، وطلب المزود الحي. من المتوقع
أن تكون اعتماديات Plugin موجودة قبل تحميل وقت التشغيل.

## توليد الموسيقى الحي

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- أداة الاختبار: `pnpm test:live:media music`
- النطاق:
  - يمرّن مسار مزود توليد الموسيقى المضمّن المشترك
  - يغطي حاليًا Google وMiniMax
  - يحمّل متغيرات بيئة المزود من صدفة تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزودين الذين لا يملكون مصادقة/ملف تعريف/نموذجًا قابلًا للاستخدام
  - يشغّل كلا وضعي وقت التشغيل المعلنين عند توفرهما:
    - `generate` مع إدخال يحتوي على الموجه فقط
    - `edit` عندما يعلن المزود `capabilities.edit.enabled`
  - تغطية المسار المشترك الحالية:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ملف Comfy حي منفصل، وليس هذا المسح المشترك
- تضييق اختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن ملفات التعريف وتجاهل التجاوزات المعتمدة على البيئة فقط

## توليد الفيديو الحي

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- أداة الاختبار: `pnpm test:live:media video`
- النطاق:
  - يمرّن مسار مزود توليد الفيديو المضمّن المشترك
  - يُعيّن افتراضيًا مسار دخان آمنًا للإصدار: مزودون غير FAL، وطلب نص إلى فيديو واحد لكل مزود، وموجه سرطان بحر مدته ثانية واحدة، وحد عملية لكل مزود من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` افتراضيًا)
  - يتخطى FAL افتراضيًا لأن زمن انتظار قائمة الانتظار من جهة المزود قد يهيمن على وقت الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحةً
  - يحمّل متغيرات بيئة المزود من صدفة تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزودين الذين لا يملكون مصادقة/ملف تعريف/نموذجًا قابلًا للاستخدام
  - يشغّل `generate` فقط افتراضيًا
  - عيّن `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن المزود `capabilities.imageToVideo.enabled` ويقبل المزود/النموذج المحدد إدخال صورة محلية مدعومًا بالمخزن المؤقت في المسح المشترك
    - `videoToVideo` عندما يعلن المزود `capabilities.videoToVideo.enabled` ويقبل المزود/النموذج المحدد إدخال فيديو محلي مدعومًا بالمخزن المؤقت في المسح المشترك
  - مزودو `imageToVideo` المعلنون لكن المتخطّون حاليًا في المسح المشترك:
    - `vydra` لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب عنوان URL لصورة بعيدة
  - تغطية Vydra الخاصة بالمزود:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل ذلك الملف `veo3` نص إلى فيديو بالإضافة إلى مسار `kling` يستخدم تثبيت عنوان URL لصورة بعيدة افتراضيًا
  - تغطية `videoToVideo` الحية الحالية:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - مزودو `videoToVideo` المعلنون لكن المتخطّون حاليًا في المسح المشترك:
    - `alibaba`, `qwen`, `xai` لأن هذه المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة بنمط `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا مدعومًا بالمخزن المؤقت، وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات وصول خاصة بالمؤسسة لتلوين/إعادة مزج الفيديو
- تضييق اختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزود في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل حد كل عملية مزود لتشغيل دخان صارم
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن ملفات التعريف وتجاهل التجاوزات المعتمدة على البيئة فقط

## أداة اختبار الوسائط الحية

- الأمر: `pnpm test:live:media`
- الغرض:
  - تشغّل مجموعات الصور والموسيقى والفيديو الحية المشتركة عبر نقطة دخول أصلية للمستودع واحدة
  - تحمّل تلقائيًا متغيرات بيئة المزود المفقودة من `~/.profile`
  - تضيّق تلقائيًا كل مجموعة إلى المزودين الذين لديهم حاليًا مصادقة قابلة للاستخدام افتراضيًا
  - تعيد استخدام `scripts/test-live.mjs`، لذا يبقى سلوك Heartbeat ووضع الهدوء متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ذات صلة

- [الاختبار](/ar/help/testing) - مجموعات اختبارات الوحدة والتكامل وQA وDocker
