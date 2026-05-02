---
read_when:
    - تشغيل اختبارات الدخان لمصفوفة النماذج الحية / خلفية CLI / ACP / موفّر الوسائط
    - تصحيح أخطاء حل بيانات اعتماد الاختبارات الحية
    - إضافة اختبار مباشر جديد خاص بموفّر
sidebarTitle: Live tests
summary: 'الاختبارات المباشرة (المتعاملة مع الشبكة): مصفوفة النماذج، الخلفيات البرمجية لـ CLI، ACP، موفرو الوسائط، بيانات الاعتماد'
title: 'الاختبار: مجموعات الاختبار الحية'
x-i18n:
    generated_at: "2026-05-02T07:31:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce8bd75ee7837b48e6ba1d888d281ee053fc13bdcf0907baddeb78ebcbbef31c
    source_path: help/testing-live.md
    workflow: 16
---

للبدء السريع، ومشغّلي ضمان الجودة، ومجموعات اختبارات الوحدة/التكامل، وتدفقات Docker، راجع
[الاختبار](/ar/help/testing). تغطي هذه الصفحة مجموعات الاختبار **المباشرة** (التي تلامس الشبكة):
مصفوفة النماذج، وخلفيات CLI، وACP، واختبارات مزوّد الوسائط المباشرة، إضافة إلى
التعامل مع بيانات الاعتماد.

## مباشر: أوامر smoke للملف الشخصي المحلي

حمّل `~/.profile` قبل الفحوصات المباشرة المخصصة حتى تطابق مفاتيح المزوّد ومسارات الأدوات
المحلية الصدفة لديك:

```bash
source ~/.profile
```

اختبار smoke آمن للوسائط:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

اختبار smoke آمن لجاهزية المكالمات الصوتية:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` هو تشغيل تجريبي ما لم يكن `--yes` موجودًا أيضًا. استخدم `--yes` فقط
عندما تريد عمدًا إجراء مكالمة إشعار حقيقية. بالنسبة إلى Twilio وTelnyx و
Plivo، يتطلب فحص الجاهزية الناجح عنوان URL عامًا لـ Webhook؛ يتم رفض بدائل
local loopback/الخاصة فقط حسب التصميم.

## مباشر: مسح قدرات عقدة Android

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر معلن عنه حاليًا** بواسطة عقدة Android متصلة والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد مسبق/يدوي (لا تثبّت المجموعة التطبيق أو تشغّله أو تقرنه).
  - تحقق Gateway `node.invoke` أمرًا بأمر لعقدة Android المحددة.
- الإعداد المسبق المطلوب:
  - تطبيق Android متصل ومقترن بالفعل بالـ Gateway.
  - إبقاء التطبيق في المقدمة.
  - منح الأذونات/موافقة الالتقاط للقدرات التي تتوقع نجاحها.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## مباشر: smoke للنماذج (مفاتيح الملف الشخصي)

تنقسم الاختبارات المباشرة إلى طبقتين حتى نتمكن من عزل الأعطال:

- "النموذج المباشر" يخبرنا أن المزوّد/النموذج يمكنه الإجابة أصلًا بالمفتاح المعطى.
- "Gateway smoke" يخبرنا أن خط أنابيب Gateway+agent الكامل يعمل لذلك النموذج (الجلسات، والسجل، والأدوات، وسياسة sandbox، وغير ذلك).

### الطبقة 1: إكمال النموذج المباشر (بدون Gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (وانحدارات موجهة عند الحاجة)
- طريقة التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- اضبط `OPENCLAW_LIVE_MODELS=modern` (أو `all`، اسم مستعار لـ modern) لتشغيل هذه المجموعة فعليًا؛ وإلا فستتخطى للحفاظ على تركيز `pnpm test:live` على Gateway smoke
- طريقة اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.2 + Codex، وGemini 3، وDeepSeek V4، وGLM 4.7، وMiniMax M2.7، وGrok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم مستعار لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تعتمد مسوحات modern/all افتراضيًا سقفًا منتقى عالي الإشارة؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لإجراء مسح حديث شامل أو رقمًا موجبًا لسقف أصغر.
  - تستخدم المسوحات الشاملة `OPENCLAW_LIVE_TEST_TIMEOUT_MS` لمهلة اختبار النموذج المباشر بالكامل. الافتراضي: 60 دقيقة.
  - تعمل مجسات النموذج المباشر بتوازٍ قدره 20 مسارًا افتراضيًا؛ اضبط `OPENCLAW_LIVE_MODEL_CONCURRENCY` للتجاوز.
- طريقة اختيار المزوّدين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- مصدر المفاتيح:
  - افتراضيًا: مخزن الملف الشخصي وبدائل env
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن الملف الشخصي** فقط
- سبب وجود هذا:
  - يفصل بين "واجهة API للمزوّد معطلة / المفتاح غير صالح" و"خط أنابيب وكيل Gateway معطل"
  - يحتوي على انحدارات صغيرة ومعزولة (مثال: إعادة تشغيل الاستدلال في OpenAI Responses/Codex Responses + تدفقات استدعاء الأدوات)

### الطبقة 2: Gateway + smoke لوكيل التطوير (ما يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل Gateway داخل العملية
  - إنشاء/تصحيح جلسة `agent:dev:*` (تجاوز النموذج لكل تشغيل)
  - تكرار النماذج ذات المفاتيح والتحقق من:
    - استجابة "ذات معنى" (بدون أدوات)
    - عمل استدعاء أداة حقيقي (مجس قراءة)
    - مجسات أدوات إضافية اختيارية (مجس تنفيذ+قراءة)
    - استمرار عمل مسارات انحدار OpenAI (استدعاء أداة فقط → متابعة)
- تفاصيل المجسات (حتى تتمكن من شرح الأعطال بسرعة):
  - مجس `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل `read` له وترديد nonce مرة أخرى.
  - مجس `exec+read`: يطلب الاختبار من الوكيل استخدام `exec` لكتابة nonce في ملف مؤقت، ثم `read` له مرة أخرى.
  - مجس الصورة: يرفق الاختبار PNG مولّدًا (cat + رمز عشوائي) ويتوقع من النموذج إرجاع `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- طريقة التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- طريقة اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.2 + Codex، وGemini 3، وDeepSeek V4، وGLM 4.7، وMiniMax M2.7، وGrok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم مستعار لقائمة السماح الحديثة
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تعتمد مسوحات Gateway الحديثة/الكل افتراضيًا سقفًا منتقى عالي الإشارة؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لإجراء مسح حديث شامل أو رقمًا موجبًا لسقف أصغر.
- طريقة اختيار المزوّدين (لتجنب "كل شيء عبر OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- مجسات الأدوات + الصور مفعّلة دائمًا في هذا الاختبار المباشر:
  - مجس `read` + مجس `exec+read` (ضغط الأدوات)
  - يعمل مجس الصورة عندما يعلن النموذج دعم إدخال الصور
  - التدفق (مستوى عالٍ):
    - يولّد الاختبار PNG صغيرًا يحتوي على "CAT" + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسله عبر `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التأكيد: يحتوي الرد على `cat` + الرمز (تسامح OCR: يُسمح بالأخطاء الطفيفة)

<Tip>
لرؤية ما يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## مباشر: smoke لخلفية CLI (Claude أو Codex أو Gemini أو CLIs محلية أخرى)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من خط أنابيب Gateway + agent باستخدام خلفية CLI محلية، بدون لمس إعداداتك الافتراضية.
- توجد افتراضيات smoke الخاصة بالخلفية مع تعريف `cli-backend.ts` في Plugin المالك.
- التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- الافتراضيات:
  - المزوّد/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - تأتي سلوكيات الأمر/الوسائط/الصورة من بيانات Plugin الوصفية لخلفية CLI المالكة.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في الموجه). تعطل وصفات Docker هذا افتراضيًا ما لم يُطلب صراحة.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من حقنها في الموجه.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عند ضبط `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دورة ثانية والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` للاشتراك في مجس استمرارية الجلسة نفسها Claude Sonnet -> Opus عندما يدعم النموذج المحدد هدف تبديل. تعطل وصفات Docker هذا افتراضيًا لتحسين موثوقية التجميع.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` للاشتراك في مجس MCP/الأدوات عبر local loopback. تعطل وصفات Docker هذا افتراضيًا ما لم يُطلب صراحة.

مثال:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

اختبار smoke رخيص لإعداد Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

لا يطلب هذا من Gemini توليد استجابة. يكتب إعدادات النظام نفسها التي
يعطيها OpenClaw إلى Gemini، ثم يشغّل `gemini --debug mcp list` لإثبات أن خادم
`transport: "streamable-http"` المحفوظ يُطبّع إلى شكل HTTP MCP الخاص بـ Gemini
ويمكنه الاتصال بخادم MCP محلي streamable-HTTP.

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
- يشغّل smoke لخلفية CLI المباشرة داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير الجذر.
- يحل بيانات smoke الوصفية لـ CLI من Plugin المالك، ثم يثبّت حزمة CLI المطابقة لنظام Linux (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزنة مؤقتًا عند `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` اشتراك Claude Code OAuth قابلًا للنقل عبر إما `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. يثبت أولًا `claude -p` المباشر في Docker، ثم يشغّل دورتين لخلفية Gateway CLI بدون الاحتفاظ بمتغيرات env لمفتاح Anthropic API. يعطل مسار الاشتراك هذا مجسات Claude MCP/الأدوات والصور افتراضيًا لأن Claude يوجّه حاليًا استخدام تطبيقات الجهات الخارجية عبر فوترة استخدام إضافية بدلًا من حدود خطة الاشتراك العادية.
- يمارس smoke المباشر لخلفية CLI الآن التدفق نفسه من البداية إلى النهاية لـ Claude وCodex وGemini: دورة نصية، ثم دورة تصنيف صورة، ثم استدعاء أداة MCP `cron` المتحقق منه عبر Gateway CLI.
- كما يصحّح smoke الافتراضي لـ Claude الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة ما زالت تتذكر ملاحظة سابقة.

## مباشر: smoke لربط ACP (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط محادثة ACP الحقيقي مع وكيل ACP مباشر:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة قناة رسائل اصطناعية في موضعها
  - إرسال متابعة عادية في المحادثة نفسها
  - التحقق من وصول المتابعة إلى نص جلسة ACP المرتبطة
- التفعيل:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- الإعدادات الافتراضية:
  - وكلاء ACP في Docker: `claude,codex,gemini`
  - وكيل ACP للأمر المباشر `pnpm test:live ...`: `claude`
  - القناة الاصطناعية: سياق محادثة بأسلوب رسائل Slack المباشرة
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
  - يستخدم هذا المسار سطح `chat.send` في Gateway مع حقول مسار منشأ اصطناعية للمسؤولين فقط، حتى تتمكن الاختبارات من إرفاق سياق قناة الرسائل من دون الادعاء بالتسليم خارجيًا.
  - عندما لا يكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` مضبوطًا، يستخدم الاختبار سجل الوكلاء المدمج في Plugin `acpx` المضمن لوكيل حزمة ACP المختار.
  - إنشاء MCP الخاص بـ Cron للجلسة المرتبطة هو أفضل جهد افتراضيًا لأن حزم ACP الخارجية قد تلغي استدعاءات MCP بعد اجتياز إثبات الربط/الصورة؛ اضبط `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` لجعل فحص Cron بعد الربط صارمًا.

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

- يوجد مشغل Docker في `scripts/test-live-acp-bind-docker.sh`.
- افتراضيًا، يشغل فحص ACP bind smoke ضد وكلاء CLI المباشرين التجميعيين بالتسلسل: `claude`، ثم `codex`، ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` لتضييق المصفوفة.
- يحمّل `~/.profile`، ويجهز مواد مصادقة CLI المطابقة داخل الحاوية، ثم يثبت CLI المباشر المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو Factory Droid عبر `https://app.factory.ai/cli` أو `@google/gemini-cli` أو `opencode-ai`) إذا كان مفقودًا. خلفية ACP نفسها هي حزمة `acpx/runtime` المضمنة المجمعة من Plugin `acpx`.
- يجهز متغير Docker الخاص بـ Droid الدليل `~/.factory` للإعدادات، ويمرر `FACTORY_API_KEY`، ويتطلب مفتاح API ذلك لأن مصادقة OAuth/keyring المحلية الخاصة بـ Factory غير قابلة للنقل إلى الحاوية. يستخدم إدخال السجل المدمج في ACPX وهو `droid exec --output-format acp`.
- متغير Docker الخاص بـ OpenCode هو مسار تراجع صارم لوكيل واحد. يكتب نموذجًا افتراضيًا مؤقتًا في `OPENCODE_CONFIG_CONTENT` من `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (الافتراضي `opencode/kimi-k2.6`) بعد تحميل `~/.profile`، ويتطلب `pnpm test:docker:live-acp-bind:opencode` نص مساعد مرتبطًا بدلًا من قبول التخطي العام بعد الربط.
- استدعاءات CLI المباشرة لـ `acpx` هي فقط مسار يدوي/حل بديل لمقارنة السلوك خارج Gateway. فحص Docker ACP bind smoke يختبر خلفية تشغيل `acpx` المضمنة في OpenClaw.

## مباشر: فحص smoke لحزمة خادم تطبيق Codex

- الهدف: التحقق من حزمة Codex المملوكة للـ Plugin عبر طريقة Gateway العادية
  `agent`:
  - تحميل Plugin `codex` المضمن
  - اختيار `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول دورة وكيل Gateway إلى `openai/gpt-5.5` مع فرض حزمة Codex
  - إرسال دورة ثانية إلى جلسة OpenClaw نفسها والتحقق من أن خيط خادم التطبيق
    يمكنه الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار أمر Gateway نفسه
  - اختياريًا، تشغيل فحصين صدفيين بصلاحيات مرفوعة تمت مراجعتهما من Guardian: أمر حميد
    ينبغي أن تتم الموافقة عليه، ورفع سر مزيف ينبغي
    رفضه بحيث يسأل الوكيل مرة أخرى
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `openai/gpt-5.5`
- فحص الصورة الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- فحص MCP/الأدوات الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- فحص Guardian الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- يضبط فحص smoke القيمة `OPENCLAW_AGENT_HARNESS_FALLBACK=none` حتى لا تتمكن حزمة Codex
  المعطلة من النجاح عبر الرجوع بصمت إلى PI.
- المصادقة: مصادقة خادم تطبيق Codex من تسجيل الدخول المحلي لاشتراك Codex. يمكن لفحوصات Docker smoke
  أيضًا توفير `OPENAI_API_KEY` لفحوصات غير Codex عند الاقتضاء،
  بالإضافة إلى النسخ الاختياري لـ `~/.codex/auth.json` و`~/.codex/config.toml`.

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

- يوجد مشغل Docker في `scripts/test-live-codex-harness-docker.sh`.
- يحمّل `~/.profile` المثبت، ويمرر `OPENAI_API_KEY`، وينسخ ملفات مصادقة Codex CLI
  عند وجودها، ويثبت `@openai/codex` في بادئة npm مثبتة قابلة للكتابة،
  ويجهز شجرة المصدر، ثم يشغل فقط الاختبار المباشر لحزمة Codex.
- يفعّل Docker فحوصات الصورة وMCP/الأداة وGuardian افتراضيًا. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` عندما تحتاج إلى تشغيل تصحيح
  أضيق.
- يصدّر Docker أيضًا `OPENCLAW_AGENT_HARNESS_FALLBACK=none`، مطابقًا لتكوين الاختبار
  المباشر بحيث لا تستطيع الأسماء المستعارة القديمة أو الرجوع إلى PI إخفاء تراجع
  في حزمة Codex.

### الوصفات المباشرة الموصى بها

قوائم السماح الضيقة والصريحة هي الأسرع والأقل عرضة للتقطع:

- نموذج واحد، مباشر (بلا Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، فحص smoke عبر Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة مزودين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تركيز Google (مفتاح API لـ Gemini + Antigravity):
  - Gemini (مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- فحص smoke للتفكير التكيفي في Google:
  - إذا كانت المفاتيح المحلية موجودة في ملف تعريف الصدفة: `source ~/.profile`
  - الافتراضي الديناميكي لـ Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - ميزانية Gemini 2.5 الديناميكية: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

ملاحظات:

- يستخدم `google/...` واجهة Gemini API (مفتاح API).
- يستخدم `google-antigravity/...` جسر OAuth الخاص بـ Antigravity (نقطة نهاية وكيل بأسلوب Cloud Code Assist).
- يستخدم `google-gemini-cli/...` واجهة Gemini CLI المحلية على جهازك (مصادقة منفصلة + غرائب أدوات).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP (مفتاح API / مصادقة ملف تعريف)؛ وهذا ما يعنيه معظم المستخدمين عند قولهم “Gemini”.
  - CLI: يستدعي OpenClaw ملف `gemini` تنفيذيًا محليًا عبر الصدفة؛ لديه مصادقته الخاصة وقد يتصرف بشكل مختلف (دعم البث/الأدوات/اختلاف الإصدارات).

## مباشر: مصفوفة النماذج (ما نغطيه)

لا توجد “قائمة نماذج CI” ثابتة (المباشر اختياري)، لكن هذه هي النماذج **الموصى بها** لتغطيتها بانتظام على جهاز تطوير يحتوي على مفاتيح.

### مجموعة smoke حديثة (استدعاء الأدوات + الصورة)

هذه هي تشغيل “النماذج الشائعة” الذي نتوقع أن يستمر في العمل:

- OpenAI (غير Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview` (تجنب نماذج Gemini 2.x الأقدم)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` و`google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` و`deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

شغل فحص smoke عبر Gateway مع الأدوات + الصورة:
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
- Mistral: `mistral/`… (اختر نموذجًا واحدًا قادرًا على “الأدوات” لديك مفعلًا)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ استدعاء الأدوات يعتمد على وضع API)

### الرؤية: إرسال الصورة (مرفق → رسالة متعددة الوسائط)

ضمّن نموذجًا واحدًا على الأقل قادرًا على الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (إصدارات Claude/Gemini/OpenAI القادرة على الرؤية، إلخ) لاختبار فحص الصورة.

### المجمعات / البوابات البديلة

إذا كانت لديك مفاتيح مفعلة، ندعم أيضًا الاختبار عبر:

- OpenRouter: `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين قادرين على الأدوات+الصور)
- OpenCode: `opencode/...` لـ Zen و`opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزودون إضافيون يمكنك تضمينهم في المصفوفة المباشرة (إذا كانت لديك بيانات اعتماد/تكوين):

- مدمج: `openai`، `openai-codex`، `anthropic`، `google`، `google-vertex`، `google-antigravity`، `google-gemini-cli`، `zai`، `openrouter`، `opencode`، `opencode-go`، `xai`، `groq`، `cerebras`، `mistral`، `github-copilot`
- عبر `models.providers` (نقاط نهاية مخصصة): `minimax` (سحابي/API)، بالإضافة إلى أي وكيل متوافق مع OpenAI/Anthropic (LM Studio وvLLM وLiteLLM وما إلى ذلك)

<Tip>
لا تثبت "كل النماذج" يدويًا في الوثائق. القائمة المرجعية هي ما يرجعه `discoverModels(...)` على جهازك بالإضافة إلى المفاتيح المتاحة.
</Tip>

## بيانات الاعتماد (لا تلتزم بها أبدًا)

تكتشف الاختبارات المباشرة بيانات الاعتماد بالطريقة نفسها التي تفعلها CLI. الآثار العملية:

- إذا كانت CLI تعمل، فينبغي أن تعثر الاختبارات المباشرة على المفاتيح نفسها.
- إذا قال اختبار مباشر “لا توجد بيانات اعتماد”، فصحّح المشكلة بالطريقة نفسها التي تصحّح بها `openclaw models list` / اختيار النموذج.

- ملفات تعريف المصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (هذا هو المقصود بـ “مفاتيح الملف التعريفي” في الاختبارات المباشرة)
- الإعدادات: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى الصفحة الرئيسية المرحلية للاختبار المباشر عند وجوده، لكنه ليس مخزن مفاتيح الملف التعريفي الرئيسي)
- تشغلات الاختبارات المحلية المباشرة تنسخ افتراضيًا الإعدادات النشطة، وملفات `auth-profiles.json` لكل وكيل، و`credentials/` القديمة، وأدلة مصادقة CLI الخارجية المدعومة إلى صفحة رئيسية مؤقتة للاختبار؛ وتتخطى الصفحات الرئيسية المرحلية المباشرة `workspace/` و`sandboxes/`، وتُزال تجاوزات مسارات `agents.*.workspace` / `agentDir` حتى تبقى المجسات بعيدًا عن مساحة عمل المضيف الحقيقية لديك.

إذا أردت الاعتماد على مفاتيح البيئة (مثلًا المُصدّرة في `~/.profile` لديك)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغّلات Docker أدناه (يمكنها تركيب `~/.profile` داخل الحاوية).

## اختبار Deepgram المباشر (نسخ الصوت)

- الاختبار: `extensions/deepgram/audio.live.test.ts`
- التفعيل: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## اختبار خطة ترميز BytePlus المباشر

- الاختبار: `extensions/byteplus/live.test.ts`
- التفعيل: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- تجاوز النموذج اختياريًا: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## اختبار وسائط سير عمل ComfyUI المباشر

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يختبر مسارات الصور والفيديو و`music_generate` المضمّنة في comfy
  - يتخطى كل إمكانية ما لم تكن `plugins.entries.comfy.config.<capability>` مهيأة
  - مفيد بعد تغيير إرسال سير عمل comfy أو الاستقصاء أو التنزيلات أو تسجيل Plugin

## توليد الصور المباشر

- الاختبار: `test/image-generation.runtime.live.test.ts`
- الأمر: `pnpm test:live test/image-generation.runtime.live.test.ts`
- الحاضنة: `pnpm test:live:media image`
- النطاق:
  - يسرد كل Plugin مزوّد مسجّل لتوليد الصور
  - يحمّل متغيرات بيئة المزوّد الناقصة من صدفة تسجيل الدخول لديك (`~/.profile`) قبل المجس
  - يستخدم مفاتيح API المباشرة/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملفًا تعريفيًا/نموذجًا قابلًا للاستخدام
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات التعريفية وتجاهل التجاوزات المعتمدة على البيئة فقط

لمسار CLI المشحون، أضف اختبار smoke لـ `infer` بعد نجاح اختبار المزوّد/وقت التشغيل المباشر:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

يغطي هذا تحليل وسائط CLI، وحل الإعدادات/الوكيل الافتراضي، وتفعيل Plugin
المضمّن، ووقت تشغيل توليد الصور المشترك، وطلب المزوّد المباشر.
من المتوقع أن تكون تبعيات Plugin موجودة قبل تحميل وقت التشغيل.

## توليد الموسيقى المباشر

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- الحاضنة: `pnpm test:live:media music`
- النطاق:
  - يختبر مسار مزوّد توليد الموسيقى المضمّن المشترك
  - يغطي حاليًا Google وMiniMax
  - يحمّل متغيرات بيئة المزوّد من صدفة تسجيل الدخول لديك (`~/.profile`) قبل المجس
  - يستخدم مفاتيح API المباشرة/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملفًا تعريفيًا/نموذجًا قابلًا للاستخدام
  - يشغّل وضعي وقت التشغيل المعلنين عند توفرهما:
    - `generate` مع إدخال يعتمد على الموجّه فقط
    - `edit` عندما يعلن المزوّد `capabilities.edit.enabled`
  - تغطية المسار المشترك الحالية:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: ملف Comfy مباشر منفصل، وليس هذا المسح المشترك
- تضييق اختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات التعريفية وتجاهل التجاوزات المعتمدة على البيئة فقط

## توليد الفيديو المباشر

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- الحاضنة: `pnpm test:live:media video`
- النطاق:
  - يختبر مسار مزوّد توليد الفيديو المضمّن المشترك
  - يستخدم افتراضيًا مسار smoke الآمن للإصدار: مزوّدين غير FAL، وطلب نص إلى فيديو واحد لكل مزوّد، وموجّه سرطان بحر مدته ثانية واحدة، وحدًا أقصى لكل عملية مزوّد من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` افتراضيًا)
  - يتخطى FAL افتراضيًا لأن زمن انتظار قائمة الانتظار من جهة المزوّد يمكن أن يهيمن على وقت الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحةً
  - يحمّل متغيرات بيئة المزوّد من صدفة تسجيل الدخول لديك (`~/.profile`) قبل المجس
  - يستخدم مفاتيح API المباشرة/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملفًا تعريفيًا/نموذجًا قابلًا للاستخدام
  - يشغّل `generate` فقط افتراضيًا
  - عيّن `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن المزوّد `capabilities.imageToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال صورة محلية مدعومة بمخزن مؤقت في المسح المشترك
    - `videoToVideo` عندما يعلن المزوّد `capabilities.videoToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال فيديو محلي مدعوم بمخزن مؤقت في المسح المشترك
  - مزوّدو `imageToVideo` الحاليون المعلنون لكن المتخطَّون في المسح المشترك:
    - `vydra` لأن `veo3` المضمّن نصي فقط، و`kling` المضمّن يتطلب عنوان URL لصورة بعيدة
  - تغطية Vydra الخاصة بالمزوّد:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل ذلك الملف مسار `veo3` من نص إلى فيديو بالإضافة إلى مسار `kling` يستخدم مثبت عنوان URL لصورة بعيدة افتراضيًا
  - تغطية `videoToVideo` المباشرة الحالية:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - مزوّدو `videoToVideo` الحاليون المعلنون لكن المتخطَّون في المسح المشترك:
    - `alibaba`, `qwen`, `xai` لأن تلك المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة من نوع `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا مدعومًا بمخزن مؤقت، وذلك المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات وصول خاصة بالمؤسسة إلى inpaint/remix للفيديو
- تضييق اختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزوّد في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل الحد الأقصى لكل عملية مزوّد من أجل تشغيل smoke أكثر صرامة
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن الملفات التعريفية وتجاهل التجاوزات المعتمدة على البيئة فقط

## حاضنة الوسائط المباشرة

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل مجموعات الاختبار المباشرة المشتركة للصور والموسيقى والفيديو عبر نقطة دخول أصلية في المستودع
  - يحمّل تلقائيًا متغيرات بيئة المزوّد الناقصة من `~/.profile`
  - يضيّق تلقائيًا كل مجموعة افتراضيًا إلى المزوّدين الذين لديهم حاليًا مصادقة قابلة للاستخدام
  - يعيد استخدام `scripts/test-live.mjs`، لذلك يبقى سلوك Heartbeat والوضع الهادئ متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ذو صلة

- [الاختبار](/ar/help/testing) — مجموعات اختبارات الوحدة والتكامل وQA وDocker
