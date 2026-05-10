---
read_when:
    - تشغيل اختبارات smoke الحية لمصفوفة النماذج / الواجهة الخلفية لـ CLI / ACP / موفّر الوسائط
    - تصحيح أخطاء حلّ بيانات اعتماد الاختبار المباشر
    - إضافة اختبار مباشر جديد خاص بموفّر
sidebarTitle: Live tests
summary: 'الاختبارات الحية (التي تستخدم الشبكة): مصفوفة النماذج، الخلفيات الخاصة بـ CLI، ACP، مزودو الوسائط، بيانات الاعتماد'
title: 'الاختبار: مجموعات الاختبارات الحية'
x-i18n:
    generated_at: "2026-05-10T19:44:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb020672cd71d03b2cfc78b135c7c39862823c421c0f2f31bae69a42f9c3437f
    source_path: help/testing-live.md
    workflow: 16
---

للبدء السريع، ومشغّلي ضمان الجودة، ومجموعات اختبارات الوحدة/التكامل، وتدفقات Docker، راجع
[الاختبار](/ar/help/testing). تغطي هذه الصفحة مجموعات الاختبار **المباشرة** (التي تلامس الشبكة):
مصفوفة النماذج، وخلفيات CLI، وACP، واختبارات مزوّدي الوسائط المباشرة، إضافة إلى
التعامل مع بيانات الاعتماد.

## مباشر: أوامر smoke للملف الشخصي المحلي

نفّذ مصدر `~/.profile` قبل الفحوصات المباشرة المخصصة حتى تتطابق مفاتيح المزوّدين ومسارات الأدوات
المحلية مع الصدفة لديك:

```bash
source ~/.profile
```

فحص smoke آمن للوسائط:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

فحص smoke آمن لجاهزية المكالمات الصوتية:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` تشغيل تجريبي جاف ما لم يكن `--yes` موجودًا أيضًا. استخدم `--yes` فقط
عندما تريد عمدًا إجراء مكالمة تنبيه حقيقية. بالنسبة إلى Twilio وTelnyx وPlivo،
يتطلب فحص الجاهزية الناجح عنوان Webhook عامًا؛ ويتم رفض بدائل
loopback المحلية فقط/الخاصة عن قصد.

## مباشر: فحص قدرات عقدة Android

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر مُعلَن عنه حاليًا** بواسطة عقدة Android متصلة والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد مسبق/يدوي (لا تقوم المجموعة بتثبيت/تشغيل/إقران التطبيق).
  - تحقق `node.invoke` عبر Gateway أمرًا بأمر لعقدة Android المحددة.
- الإعداد المسبق المطلوب:
  - تطبيق Android متصل ومقترن بالفعل بالـ Gateway.
  - إبقاء التطبيق في المقدمة.
  - منح الأذونات/موافقة الالتقاط للقدرات التي تتوقع نجاحها.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## مباشر: smoke للنماذج (مفاتيح الملف الشخصي)

تنقسم الاختبارات المباشرة إلى طبقتين حتى نتمكن من عزل الإخفاقات:

- "النموذج المباشر" يخبرنا بأن المزوّد/النموذج يمكنه الإجابة أصلًا بالمفتاح المعطى.
- "Gateway smoke" يخبرنا بأن مسار Gateway+agent الكامل يعمل لذلك النموذج (الجلسات، والسجل، والأدوات، وسياسة sandbox، وما إلى ذلك).

### الطبقة 1: إكمال النموذج المباشر (بلا Gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (وانحدارات مستهدفة عند الحاجة)
- طريقة التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` عند استدعاء Vitest مباشرة)
- عيّن `OPENCLAW_LIVE_MODELS=modern` (أو `all`، وهو اسم مستعار للحديثة) لتشغيل هذه المجموعة فعليًا؛ وإلا فستتخطاها لإبقاء `pnpm test:live` مركّزًا على Gateway smoke
- طريقة اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.2 + Codex، وGemini 3، وDeepSeek V4، وGLM 4.7، وMiniMax M2.7، وGrok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` اسم مستعار لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تستخدم فحوصات modern/all حدًا منسقًا عالي الإشارة افتراضيًا؛ عيّن `OPENCLAW_LIVE_MAX_MODELS=0` لفحص حديث شامل أو رقمًا موجبًا لحد أصغر.
  - تستخدم الفحوصات الشاملة `OPENCLAW_LIVE_TEST_TIMEOUT_MS` لمهلة اختبار النموذج المباشر بالكامل. الافتراضي: 60 دقيقة.
  - تعمل مجسات النموذج المباشر بتوازٍ مقداره 20 افتراضيًا؛ عيّن `OPENCLAW_LIVE_MODEL_CONCURRENCY` للتجاوز.
- طريقة اختيار المزوّدين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن الملف الشخصي وبدائل env
  - عيّن `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن الملف الشخصي** فقط
- سبب وجود هذا:
  - يفصل "API المزوّد معطل / المفتاح غير صالح" عن "مسار وكيل Gateway معطل"
  - يحتوي على انحدارات صغيرة ومعزولة (مثال: إعادة تشغيل reasoning في OpenAI Responses/Codex Responses + تدفقات استدعاء الأدوات)

### الطبقة 2: Gateway + smoke لوكيل التطوير (ما يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل Gateway داخل العملية
  - إنشاء/ترقيع جلسة `agent:dev:*` (تجاوز النموذج لكل تشغيل)
  - تكرار النماذج ذات المفاتيح والتحقق من:
    - استجابة "ذات معنى" (بلا أدوات)
    - عمل استدعاء أداة حقيقي (مجس قراءة)
    - مجسات أدوات إضافية اختيارية (مجس exec+read)
    - استمرار عمل مسارات انحدار OpenAI (أداة فقط → متابعة)
- تفاصيل المجسات (حتى تتمكن من شرح الإخفاقات بسرعة):
  - مجس `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل `read` له وإرجاع nonce.
  - مجس `exec+read`: يطلب الاختبار من الوكيل أن يكتب nonce باستخدام `exec` في ملف مؤقت، ثم يقرأه باستخدام `read`.
  - مجس الصورة: يرفق الاختبار PNG مُنشأ (cat + رمز عشوائي) ويتوقع من النموذج إرجاع `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- طريقة التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` عند استدعاء Vitest مباشرة)
- طريقة اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.2 + Codex، وGemini 3، وDeepSeek V4، وGLM 4.7، وMiniMax M2.7، وGrok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` اسم مستعار لقائمة السماح الحديثة
  - أو عيّن `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم فحوصات Gateway من modern/all حدًا منسقًا عالي الإشارة افتراضيًا؛ عيّن `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لفحص حديث شامل أو رقمًا موجبًا لحد أصغر.
- طريقة اختيار المزوّدين (لتجنب "كل شيء في OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- مجسات الأدوات + الصور مفعلة دائمًا في هذا الاختبار المباشر:
  - مجس `read` + مجس `exec+read` (ضغط أدوات)
  - يعمل مجس الصورة عندما يعلن النموذج دعم إدخال الصور
  - التدفق (بمستوى عالٍ):
    - ينشئ الاختبار PNG صغيرًا مع "CAT" + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسله عبر `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمّن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: يحتوي الرد على `cat` + الرمز (سماحية OCR: يُسمح بأخطاء طفيفة)

<Tip>
لمعرفة ما يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## مباشر: smoke لخلفية CLI (Claude أو Codex أو Gemini أو CLIs محلية أخرى)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من مسار Gateway + agent باستخدام خلفية CLI محلية، من دون لمس إعداداتك الافتراضية.
- تعيش افتراضيات smoke الخاصة بكل خلفية مع تعريف `cli-backend.ts` الخاص بالـ Plugin المالكة.
- التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` عند استدعاء Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- الافتراضيات:
  - المزوّد/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/الوسائط/الصورة من بيانات Plugin الوصفية المالكة لخلفية CLI.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في الطلب). تعطل وصفات Docker هذا افتراضيًا ما لم يُطلب صراحة.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من حقن الطلب.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عند تعيين `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دور ثانٍ والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` للاشتراك في مجس استمرارية الجلسة نفسها من Claude Sonnet -> Opus عندما يدعم النموذج المحدد هدف تبديل. تعطل وصفات Docker هذا افتراضيًا من أجل موثوقية التجميع.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` للاشتراك في مجس loopback لـ MCP/الأدوات. تعطل وصفات Docker هذا افتراضيًا ما لم يُطلب صراحة.

مثال:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

فحص smoke رخيص لإعداد Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

هذا لا يطلب من Gemini إنشاء استجابة. يكتب إعدادات النظام نفسها التي
يعطيها OpenClaw إلى Gemini، ثم يشغّل `gemini --debug mcp list` لإثبات أن
خادمًا محفوظًا بقيمة `transport: "streamable-http"` يُطبع إلى شكل HTTP MCP الخاص بـ Gemini
ويمكنه الاتصال بخادم MCP محلي من نوع streamable-HTTP.

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

- يوجد مشغّل Docker في `scripts/test-live-cli-backend-docker.sh`.
- يشغّل smoke خلفية CLI المباشر داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير جذر.
- يحل بيانات smoke الوصفية لـ CLI من Plugin المالكة، ثم يثبت حزمة CLI المطابقة لـ Linux (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزنة مؤقتًا عند `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` OAuth محمولًا لاشتراك Claude Code عبر إما `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. يثبت أولًا تشغيل `claude -p` المباشر في Docker، ثم يشغّل دورين لخلفية Gateway CLI من دون الحفاظ على متغيرات env الخاصة بمفاتيح Anthropic API. يعطل مسار الاشتراك هذا مجسات Claude MCP/الأدوات والصور افتراضيًا لأن Claude يوجه حاليًا استخدام تطبيقات الطرف الثالث عبر فوترة استخدام إضافية بدلًا من حدود خطة الاشتراك العادية.
- يمارس smoke خلفية CLI المباشر الآن التدفق الكامل نفسه لـ Claude وCodex وGemini: دور نصي، ثم دور تصنيف صورة، ثم استدعاء أداة `cron` في MCP مُتحقق منه عبر Gateway CLI.
- يقوم smoke الافتراضي لـ Claude أيضًا بترقيع الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة لا تزال تتذكر ملاحظة سابقة.

## مباشر: قابلية وصول وكيل APNs HTTP/2

- الاختبار: `src/infra/push-apns-http2.live.test.ts`
- الهدف: النفاذ عبر وكيل HTTP CONNECT محلي إلى نقطة نهاية APNs sandbox الخاصة بـ Apple، وإرسال طلب تحقق APNs HTTP/2، والتحقق من أن استجابة Apple الحقيقية `403 InvalidProviderToken` تعود عبر مسار الوكيل.
- التفعيل:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- مهلة اختيارية:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## مباشر: smoke لربط ACP (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط محادثة ACP الحقيقي مع وكيل ACP مباشر:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة قناة رسائل اصطناعية في مكانها
  - إرسال متابعة عادية على المحادثة نفسها
  - التحقق من وصول المتابعة إلى سجل جلسة ACP المرتبطة
- التفعيل:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- الافتراضيات:
  - وكلاء ACP في Docker: `claude,codex,gemini`
  - وكيل ACP للتشغيل المباشر `pnpm test:live ...`: `claude`
  - القناة الاصطناعية: سياق محادثة على نمط رسالة مباشرة في Slack
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
  - يستخدم هذا المسار سطح `chat.send` الخاص بالـ gateway مع حقول مسار منشأ اصطناعية مخصصة للمسؤول فقط كي تتمكن الاختبارات من إرفاق سياق قناة الرسائل من دون الادعاء بالتسليم خارجيًا.
  - عندما لا تكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` مضبوطة، يستخدم الاختبار سجل الوكلاء المدمج في Plugin `acpx` المضمن لوكيل حزمة ACP المحدد.
  - إنشاء MCP الخاص بـ Cron للجلسة المرتبطة يبذل أفضل جهد افتراضيًا لأن حزم ACP الخارجية يمكن أن تلغي استدعاءات MCP بعد نجاح إثبات الربط/الصورة؛ اضبط `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` لجعل فحص Cron بعد الربط صارمًا.

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
- افتراضيًا، يشغّل اختبار smoke لربط ACP مقابل وكلاء CLI المباشرين المجمّعين بالتتابع: `claude`، ثم `codex`، ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` لتضييق المصفوفة.
- يحمّل `~/.profile`، ويرحّل مادة مصادقة CLI المطابقة إلى الحاوية، ثم يثبّت CLI المباشر المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو Factory Droid عبر `https://app.factory.ai/cli` أو `@google/gemini-cli` أو `opencode-ai`) إذا كان مفقودًا. خلفية ACP نفسها هي حزمة `acpx/runtime` المدمجة من Plugin `acpx` الرسمي.
- متغير Docker الخاص بـ Droid يرحّل `~/.factory` للإعدادات، ويمرر `FACTORY_API_KEY`، ويتطلب مفتاح API هذا لأن مصادقة Factory المحلية عبر OAuth/مخزن المفاتيح غير قابلة للنقل إلى الحاوية. يستخدم إدخال سجل ACPX المدمج `droid exec --output-format acp`.
- متغير Docker الخاص بـ OpenCode هو مسار انحدار صارم لوكيل واحد. يكتب نموذجًا افتراضيًا مؤقتًا في `OPENCODE_CONFIG_CONTENT` من `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (الافتراضي `opencode/kimi-k2.6`) بعد تحميل `~/.profile`، ويتطلب `pnpm test:docker:live-acp-bind:opencode` سجل مساعد مرتبطًا بدل قبول التخطي العام لما بعد الربط.
- استدعاءات CLI المباشرة لـ `acpx` هي فقط مسار يدوي/حل بديل لمقارنة السلوك خارج Gateway. اختبار smoke الخاص بربط ACP في Docker يختبر خلفية تشغيل `acpx` المدمجة في OpenClaw.

## مباشر: اختبار smoke لحزمة Codex app-server

- الهدف: التحقق من حزمة Codex المملوكة للـ Plugin عبر Gateway العادي
  بطريقة `agent`:
  - تحميل Plugin `codex` المضمن
  - اختيار `openai/gpt-5.5`، والذي يوجّه أدوار وكيل OpenAI عبر Codex افتراضيًا
  - إرسال أول دور وكيل عبر Gateway إلى `openai/gpt-5.5` مع تحديد حزمة Codex
  - إرسال دور ثانٍ إلى جلسة OpenClaw نفسها والتحقق من أن سلسلة
    app-server يمكن استئنافها
  - تشغيل `/codex status` و `/codex models` عبر مسار أمر Gateway نفسه
  - اختياريًا تشغيل فحصين مصعدين للصدفة تمت مراجعتهما بواسطة Guardian: أمر حميد
    ينبغي الموافقة عليه ورفع سر مزيف ينبغي
    رفضه كي يطلب الوكيل الرجوع
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `openai/gpt-5.5`
- فحص الصورة الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- فحص MCP/الأدوات الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- فحص Guardian الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- يجبر اختبار smoke تكوين المزوّد/النموذج `agentRuntime.id: "codex"` بحيث لا يمكن لحزمة Codex
  المعطلة أن تنجح عبر الرجوع بصمت إلى PI.
- المصادقة: مصادقة Codex app-server من تسجيل دخول اشتراك Codex المحلي. يمكن لاختبارات smoke في Docker
  أيضًا توفير `OPENAI_API_KEY` للفحوصات غير الخاصة بـ Codex عند الانطباق،
  إضافة إلى النسخ الاختياري لـ `~/.codex/auth.json` و `~/.codex/config.toml`.

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
  عند وجودها، ويثبّت `@openai/codex` في بادئة npm مركّبة قابلة للكتابة،
  ويرحّل شجرة المصدر، ثم يشغّل اختبار Codex-harness المباشر فقط.
- يفعّل Docker فحوصات الصورة وMCP/الأدوات وGuardian افتراضيًا. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` عندما تحتاج إلى تشغيل تصحيح
  أضيق.
- يستخدم Docker تكوين تشغيل Codex الصريح نفسه، لذلك لا يمكن للأسماء المستعارة القديمة أو الرجوع إلى PI
  إخفاء انحدار في حزمة Codex.

### الوصفات المباشرة الموصى بها

قوائم السماح الضيقة والصريحة هي الأسرع والأقل تقلبًا:

- نموذج واحد، مباشر (بلا Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، اختبار smoke عبر Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة مزوّدين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تركيز Google (مفتاح Gemini API + Antigravity):
  - Gemini (مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- اختبار smoke للتفكير التكيفي في Google:
  - إذا كانت المفاتيح المحلية موجودة في ملف تعريف الصدفة: `source ~/.profile`
  - الافتراضي الديناميكي لـ Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - ميزانية Gemini 2.5 الديناميكية: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

ملاحظات:

- يستخدم `google/...` واجهة Gemini API (مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity OAuth (نقطة نهاية وكيل بنمط Cloud Code Assist).
- يستخدم `google-gemini-cli/...` Gemini CLI المحلي على جهازك (مصادقة منفصلة + غرائب في الأدوات).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة لدى Google عبر HTTP (مصادقة مفتاح API / الملف الشخصي)؛ وهذا ما يقصده معظم المستخدمين بـ "Gemini".
  - CLI: يشغّل OpenClaw ملف `gemini` ثنائيًا محليًا عبر الصدفة؛ لديه مصادقته الخاصة ويمكن أن يتصرف بشكل مختلف (دعم البث/الأدوات/اختلاف الإصدارات).

## مباشر: مصفوفة النماذج (ما نغطيه)

لا توجد "قائمة نماذج CI" ثابتة (المباشر اختياري)، لكن هذه هي النماذج **الموصى بها** لتغطيتها بانتظام على جهاز تطوير يحتوي على مفاتيح.

### مجموعة smoke حديثة (استدعاء الأدوات + الصورة)

هذا هو تشغيل "النماذج الشائعة" الذي نتوقع أن يستمر في العمل:

- OpenAI (غير Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و `google/gemini-3-flash-preview` (تجنب نماذج Gemini 2.x الأقدم)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` و `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

شغّل اختبار smoke عبر Gateway مع الأدوات + الصورة:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### خط الأساس: استدعاء الأدوات (Read + Exec اختياري)

اختر واحدًا على الأقل لكل عائلة مزوّدين:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (من الجيد توفرها):

- xAI: `xai/grok-4.3` (أو أحدث متاح)
- Mistral: `mistral/`… (اختر نموذجًا واحدًا قادرًا على "الأدوات" قمت بتفعيله)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### الرؤية: إرسال صورة (مرفق → رسالة متعددة الوسائط)

ضمّن نموذجًا واحدًا على الأقل قادرًا على الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (متغيرات Claude/Gemini/OpenAI القادرة على الرؤية، وما إلى ذلك) لاختبار فحص الصورة.

### المجمّعات / البوابات البديلة

إذا كانت لديك مفاتيح مفعّلة، ندعم أيضًا الاختبار عبر:

- OpenRouter: `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين قادرين على الأدوات+الصور)
- OpenCode: `opencode/...` لـ Zen و `opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزوّدون آخرون يمكنك تضمينهم في المصفوفة المباشرة (إذا كانت لديك بيانات اعتماد/تكوين):

- مدمج: `openai`، `openai-codex`، `anthropic`، `google`، `google-vertex`، `google-antigravity`، `google-gemini-cli`، `zai`، `openrouter`، `opencode`، `opencode-go`، `xai`، `groq`، `cerebras`، `mistral`، `github-copilot`
- عبر `models.providers` (نقاط نهاية مخصصة): `minimax` (سحابي/API)، بالإضافة إلى أي وكيل متوافق مع OpenAI/Anthropic (LM Studio، vLLM، LiteLLM، وما إلى ذلك)

<Tip>
لا ترمّز "كل النماذج" بشكل ثابت في الوثائق. القائمة المرجعية هي كل ما تُرجعه `discoverModels(...)` على جهازك بالإضافة إلى المفاتيح المتاحة.
</Tip>

## بيانات الاعتماد (لا تلتزم بها أبدًا)

تكتشف الاختبارات المباشرة بيانات الاعتماد بالطريقة نفسها التي يستخدمها CLI. الآثار العملية:

- إذا كان CLI يعمل، فينبغي أن تعثر الاختبارات الحية على المفاتيح نفسها.
- إذا قال اختبار حي "لا توجد بيانات اعتماد"، فصحّح المشكلة بالطريقة نفسها التي ستصحّح بها `openclaw models list` / اختيار النموذج.

- ملفات تعريف المصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (هذا ما تعنيه "مفاتيح ملف التعريف" في الاختبارات الحية)
- الإعدادات: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى المنزل الحي المرحلي عند وجوده، لكنه ليس مخزن مفاتيح ملف التعريف الرئيسي)
- تنسخ عمليات التشغيل المحلية الحية افتراضياً الإعدادات النشطة، وملفات `auth-profiles.json` لكل وكيل، و`credentials/` القديمة، وأدلة مصادقة CLI الخارجية المدعومة إلى منزل اختبار مؤقت؛ وتتخطى المنازل الحية المرحلية `workspace/` و`sandboxes/`، كما تُزال تجاوزات مسارات `agents.*.workspace` / `agentDir` بحيث تبقى المجسات بعيدة عن مساحة عمل مضيفك الحقيقية.

إذا أردت الاعتماد على مفاتيح البيئة (مثلاً المصدّرة في `~/.profile` لديك)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغّلات Docker أدناه (يمكنها تركيب `~/.profile` داخل الحاوية).

## Deepgram مباشر (نسخ صوتي)

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
  - يختبر مسارات comfy المضمّنة للصور والفيديو و`music_generate`
  - يتخطى كل قدرة ما لم تكن `plugins.entries.comfy.config.<capability>` مهيأة
  - مفيد بعد تغيير إرسال سير عمل comfy، أو الاستطلاع، أو التنزيلات، أو تسجيل Plugin

## توليد الصور الحي

- الاختبار: `test/image-generation.runtime.live.test.ts`
- الأمر: `pnpm test:live test/image-generation.runtime.live.test.ts`
- الحاضنة: `pnpm test:live:media image`
- النطاق:
  - يحصي كل Plugin مزود مسجل لتوليد الصور
  - يحمّل متغيرات بيئة المزود الناقصة من صدفة تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضياً، بحيث لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزودين الذين لا يملكون مصادقة/ملف تعريف/نموذجاً صالحاً للاستخدام
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

بالنسبة لمسار CLI المشحون، أضف اختبار دخان `infer` بعد نجاح الاختبار الحي للمزود/وقت التشغيل:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

يغطي هذا تحليل وسيطات CLI، وحل الإعدادات/الوكيل الافتراضي، وتفعيل
Plugin المضمّن، ووقت تشغيل توليد الصور المشترك، وطلب المزود الحي.
من المتوقع أن تكون تبعيات Plugin موجودة قبل تحميل وقت التشغيل.

## توليد الموسيقى الحي

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- الحاضنة: `pnpm test:live:media music`
- النطاق:
  - يختبر مسار مزود توليد الموسيقى المضمّن المشترك
  - يغطي حالياً Google وMiniMax
  - يحمّل متغيرات بيئة المزود من صدفة تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضياً، بحيث لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزودين الذين لا يملكون مصادقة/ملف تعريف/نموذجاً صالحاً للاستخدام
  - يشغّل نمطي وقت التشغيل المعلنين عند توفرهما:
    - `generate` مع إدخال يتضمن مطالبة فقط
    - `edit` عندما يعلن المزود `capabilities.edit.enabled`
  - تغطية المسار المشترك الحالية:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ملف Comfy حي منفصل، وليس ضمن هذا المسح المشترك
- تضييق اختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن ملفات التعريف وتجاهل التجاوزات المعتمدة على البيئة فقط

## توليد الفيديو الحي

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- الحاضنة: `pnpm test:live:media video`
- النطاق:
  - يختبر مسار مزود توليد الفيديو المضمّن المشترك
  - يستخدم افتراضياً مسار دخان آمناً للإصدار: مزودون غير FAL، وطلب واحد من نص إلى فيديو لكل مزود، ومطالبة جراد بحر لمدة ثانية واحدة، وحد عملية لكل مزود من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` افتراضياً)
  - يتخطى FAL افتراضياً لأن زمن انتظار الطابور لدى المزود قد يهيمن على وقت الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحة
  - يحمّل متغيرات بيئة المزود من صدفة تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضياً، بحيث لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزودين الذين لا يملكون مصادقة/ملف تعريف/نموذجاً صالحاً للاستخدام
  - يشغّل `generate` فقط افتراضياً
  - عيّن `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أنماط التحويل المعلنة أيضاً عند توفرها:
    - `imageToVideo` عندما يعلن المزود `capabilities.imageToVideo.enabled` ويقبل المزود/النموذج المحدد إدخال صورة محلية مدعوماً بمخزن مؤقت في المسح المشترك
    - `videoToVideo` عندما يعلن المزود `capabilities.videoToVideo.enabled` ويقبل المزود/النموذج المحدد إدخال فيديو محلياً مدعوماً بمخزن مؤقت في المسح المشترك
  - مزودو `imageToVideo` المعلنون حالياً لكن المتخطون في المسح المشترك:
    - `vydra` لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب URL صورة بعيداً
  - تغطية Vydra الخاصة بالمزود:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل ذلك الملف `veo3` من نص إلى فيديو بالإضافة إلى مسار `kling` يستخدم تجهيز URL صورة بعيداً افتراضياً
  - تغطية `videoToVideo` الحية الحالية:
    - `runway` فقط عندما يكون النموذج المحدد `runway/gen4_aleph`
  - مزودو `videoToVideo` المعلنون حالياً لكن المتخطون في المسح المشترك:
    - `alibaba`, `qwen`, `xai` لأن تلك المسارات تتطلب حالياً URLs مراجع `http(s)` / MP4 بعيدة
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالاً محلياً مدعوماً بمخزن مؤقت، وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات وصول خاصة بالمؤسسة لتلوين/إعادة مزج الفيديو
- تضييق اختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لإدراج كل مزود في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل حد كل عملية مزود من أجل تشغيل دخان صارم
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن ملفات التعريف وتجاهل التجاوزات المعتمدة على البيئة فقط

## حاضنة الوسائط الحية

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل مجموعات الاختبارات الحية المشتركة للصور والموسيقى والفيديو عبر نقطة دخول أصلية للمستودع واحدة
  - يحمّل تلقائياً متغيرات بيئة المزود الناقصة من `~/.profile`
  - يضيّق تلقائياً كل مجموعة إلى المزودين الذين لديهم حالياً مصادقة صالحة للاستخدام افتراضياً
  - يعيد استخدام `scripts/test-live.mjs`، بحيث يبقى سلوك Heartbeat والوضع الهادئ متسقاً
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ذو صلة

- [الاختبار](/ar/help/testing) - مجموعات اختبارات الوحدة، والتكامل، وQA، وDocker
