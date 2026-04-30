---
read_when:
    - تشغيل مصفوفة النماذج المباشرة / الواجهة الخلفية لـ CLI / ACP / اختبارات الدخان لموفر الوسائط
    - تصحيح أخطاء حل بيانات اعتماد الاختبارات المباشرة
    - إضافة اختبار مباشر جديد خاص بمزوّد
sidebarTitle: Live tests
summary: 'اختبارات مباشرة (تتصل بالشبكة): مصفوفة النماذج، الخلفيات البرمجية لـ CLI، ACP، مزوّدو الوسائط، بيانات الاعتماد'
title: 'الاختبار: مجموعات الاختبارات الحية'
x-i18n:
    generated_at: "2026-04-30T08:05:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01684475a08296e08e70c339c6d1a689fad8640bf747e8c72b6854045a70451e
    source_path: help/testing-live.md
    workflow: 16
---

للبدء السريع، ومشغّلات ضمان الجودة، ومجموعات اختبارات الوحدة/التكامل، ومسارات Docker، راجع
[الاختبار](/ar/help/testing). تغطي هذه الصفحة مجموعات الاختبارات **المباشرة** (التي تلامس الشبكة):
مصفوفة النماذج، وخلفيات CLI، وACP، واختبارات مزوّدي الوسائط المباشرة، إضافة إلى
التعامل مع بيانات الاعتماد.

## مباشر: أوامر تحقق سريع للملف الشخصي المحلي

حمّل `~/.profile` قبل الفحوصات المباشرة المخصصة حتى تطابق مفاتيح المزوّدين ومسارات الأدوات المحلية
بيئة الصدفة لديك:

```bash
source ~/.profile
```

تحقق سريع آمن للوسائط:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

تحقق سريع آمن من جاهزية المكالمات الصوتية:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` تشغيل جاف ما لم يكن `--yes` موجودًا أيضًا. استخدم `--yes` فقط
عندما تريد عمدًا إجراء مكالمة تنبيه حقيقية. بالنسبة إلى Twilio وTelnyx وPlivo،
يتطلب فحص الجاهزية الناجح عنوان URL عامًا للـ webhook؛ ويتم رفض بدائل
local loopback/الخاصة المحلية حسب التصميم.

## مباشر: مسح قدرات عقدة Android

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر معلن عنه حاليًا** من عقدة Android متصلة، والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد مسبق/يدوي مشروط (لا تثبّت المجموعة التطبيق ولا تشغّله ولا تقرنه).
  - تحقق `node.invoke` أمرًا بأمر عبر Gateway لعقدة Android المحددة.
- الإعداد المسبق المطلوب:
  - تطبيق Android متصل ومقترن بالفعل بالـ Gateway.
  - إبقاء التطبيق في المقدمة.
  - منح الأذونات/موافقة الالتقاط للقدرات التي تتوقع نجاحها.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## مباشر: تحقق سريع للنماذج (مفاتيح الملف الشخصي)

تنقسم الاختبارات المباشرة إلى طبقتين حتى نتمكن من عزل حالات الفشل:

- "النموذج المباشر" يخبرنا أن المزوّد/النموذج يمكنه الرد أصلًا باستخدام المفتاح المعطى.
- "تحقق Gateway السريع" يخبرنا أن مسار gateway+agent الكامل يعمل لذلك النموذج (الجلسات، السجل، الأدوات، سياسة sandbox، إلخ).

### الطبقة 1: إكمال النموذج المباشر (دون Gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (وانحدارات موجهة عند الحاجة)
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` عند استدعاء Vitest مباشرة)
- عيّن `OPENCLAW_LIVE_MODELS=modern` (أو `all`، وهو اسم بديل للحديثة) لتشغيل هذه المجموعة فعليًا؛ وإلا فسيتم تخطيها لإبقاء `pnpm test:live` مركزًا على تحقق Gateway السريع
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` اسم بديل لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تستخدم عمليات المسح الحديثة/all حدًا منتقى عالي الإشارة افتراضيًا؛ عيّن `OPENCLAW_LIVE_MAX_MODELS=0` لإجراء مسح حديث شامل، أو رقمًا موجبًا لحد أصغر.
  - تستخدم عمليات المسح الشاملة `OPENCLAW_LIVE_TEST_TIMEOUT_MS` لمهلة اختبار النموذج المباشر بالكامل. الافتراضي: 60 دقيقة.
  - تعمل مجسات النموذج المباشر بتوازٍ مقداره 20 افتراضيًا؛ عيّن `OPENCLAW_LIVE_MODEL_CONCURRENCY` للتجاوز.
- كيفية اختيار المزوّدين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- مصدر المفاتيح:
  - افتراضيًا: مخزن الملف الشخصي وبدائل البيئة
  - عيّن `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن الملف الشخصي** فقط
- سبب وجود هذا:
  - يفصل بين "واجهة API الخاصة بالمزوّد معطلة / المفتاح غير صالح" و"مسار وكيل gateway معطل"
  - يحتوي على انحدارات صغيرة ومعزولة (مثال: إعادة تشغيل الاستدلال في OpenAI Responses/Codex Responses وتدفقات استدعاء الأدوات)

### الطبقة 2: تحقق سريع من Gateway + وكيل التطوير (ما يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل gateway داخل العملية
  - إنشاء/ترقيع جلسة `agent:dev:*` (تجاوز النموذج لكل تشغيل)
  - التكرار على النماذج ذات المفاتيح والتحقق من:
    - استجابة "ذات معنى" (دون أدوات)
    - نجاح استدعاء أداة حقيقي (مجس قراءة)
    - مجسات أدوات إضافية اختيارية (مجس تنفيذ+قراءة)
    - استمرار عمل مسارات انحدار OpenAI (استدعاء أداة فقط ← متابعة)
- تفاصيل المجسات (حتى تتمكن من شرح حالات الفشل بسرعة):
  - مجس `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل `read` له وترديد nonce.
  - مجس `exec+read`: يطلب الاختبار من الوكيل كتابة nonce عبر `exec` في ملف مؤقت، ثم `read` له مرة أخرى.
  - مجس الصورة: يرفق الاختبار ملف PNG مولدًا (cat + رمز عشوائي) ويتوقع من النموذج إرجاع `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` عند استدعاء Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` اسم بديل لقائمة السماح الحديثة
  - أو عيّن `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم عمليات مسح Gateway الحديثة/all حدًا منتقى عالي الإشارة افتراضيًا؛ عيّن `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لإجراء مسح حديث شامل، أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار المزوّدين (لتجنب "كل شيء عبر OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- مجسات الأداة + الصورة مفعّلة دائمًا في هذا الاختبار المباشر:
  - مجس `read` + مجس `exec+read` (ضغط على الأدوات)
  - يعمل مجس الصورة عندما يعلن النموذج دعم إدخال الصور
  - التدفق (على مستوى عالٍ):
    - يولّد الاختبار ملف PNG صغيرًا يحتوي على "CAT" + رمز عشوائي (`src/gateway/live-image-probe.ts`)
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

## مباشر: تحقق سريع لخلفية CLI (Claude أو Codex أو Gemini أو غيرها من واجهات CLI المحلية)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من مسار Gateway + agent باستخدام خلفية CLI محلية، دون المساس بإعداداتك الافتراضية.
- توجد افتراضيات التحقق السريع الخاصة بكل خلفية مع تعريف `cli-backend.ts` الخاص بالـ Plugin المالكة.
- التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` عند استدعاء Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- الافتراضيات:
  - المزوّد/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/الوسائط/الصورة من بيانات تعريف Plugin خلفية CLI المالكة.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في المطالبة). توقف وصفات Docker هذا افتراضيًا ما لم يُطلب صراحة.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من حقن المطالبة.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عند تعيين `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دور ثانٍ والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` للاشتراك في مجس استمرارية الجلسة نفسها من Claude Sonnet إلى Opus عندما يدعم النموذج المحدد هدف تبديل. توقف وصفات Docker هذا افتراضيًا لموثوقية التجميع.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` للاشتراك في مجس MCP/أداة loopback. توقف وصفات Docker هذا افتراضيًا ما لم يُطلب صراحة.

مثال:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

تحقق سريع رخيص من إعداد Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

لا يطلب هذا من Gemini توليد استجابة. يكتب إعدادات النظام نفسها
التي يعطيها OpenClaw إلى Gemini، ثم يشغّل `gemini --debug mcp list` لإثبات أن
خادم `transport: "streamable-http"` المحفوظ يتم تطبيعه إلى شكل HTTP MCP الخاص بـ Gemini
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
- يشغّل التحقق السريع المباشر لخلفية CLI داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير الجذر.
- يحل بيانات تعريف تحقق CLI السريع من Plugin المالكة، ثم يثبّت حزمة CLI المطابقة لنظام Linux (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزنة مؤقتًا عند `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` OAuth محمولًا لاشتراك Claude Code من خلال إما `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. يثبت أولًا تشغيل `claude -p` المباشر في Docker، ثم يشغّل دورين لخلفية Gateway CLI دون الحفاظ على متغيرات بيئة مفاتيح Anthropic API. يعطل مسار الاشتراك هذا مجسات Claude MCP/الأداة والصورة افتراضيًا لأن Claude يوجّه حاليًا استخدام التطبيقات الخارجية عبر فوترة استخدام إضافية بدل حدود خطة الاشتراك العادية.
- يشغّل التحقق السريع المباشر لخلفية CLI الآن التدفق نفسه من طرف إلى طرف لـ Claude وCodex وGemini: دور نصي، ثم دور تصنيف صورة، ثم استدعاء أداة MCP `cron` يتم التحقق منه عبر Gateway CLI.
- يرقّع تحقق Claude الافتراضي أيضًا الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة ما زالت تتذكر ملاحظة سابقة.

## مباشر: تحقق سريع من ربط ACP (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط محادثة ACP الحقيقي مع وكيل ACP حي:
  - أرسل `/acp spawn <agent> --bind here`
  - اربط محادثة قناة رسائل اصطناعية في مكانها
  - أرسل متابعة عادية في المحادثة نفسها
  - تحقق من وصول المتابعة إلى نص جلسة ACP المرتبطة
- التفعيل:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- الإعدادات الافتراضية:
  - وكلاء ACP في Docker: `claude,codex,gemini`
  - وكيل ACP للتشغيل المباشر `pnpm test:live ...`: `claude`
  - القناة الاصطناعية: سياق محادثة بنمط الرسائل المباشرة في Slack
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
  - يستخدم هذا المسار سطح `chat.send` في Gateway مع حقول مسار المنشأ الاصطناعية المخصصة للمشرفين فقط، بحيث تستطيع الاختبارات إرفاق سياق قناة الرسائل من دون التظاهر بالتسليم خارجيًا.
  - عندما لا يكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` مضبوطًا، يستخدم الاختبار سجل الوكلاء المدمج في Plugin `acpx` المضمن لوكيل حزمة اختبار ACP المحدد.
  - إنشاء MCP الخاص بـ cron للجلسة المرتبطة يتم بأفضل جهد افتراضيًا لأن حزم اختبار ACP الخارجية يمكنها إلغاء استدعاءات MCP بعد اجتياز إثبات الربط/الصورة؛ اضبط `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` لجعل فحص cron بعد الربط صارمًا.

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
- افتراضيًا، يشغّل اختبار smoke لربط ACP على وكلاء CLI الحيين المجمعين بالتسلسل: `claude`، ثم `codex`، ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` لتضييق المصفوفة.
- يحمّل `~/.profile`، ويرتب مواد مصادقة CLI المطابقة داخل الحاوية، ثم يثبت CLI الحي المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو Factory Droid عبر `https://app.factory.ai/cli` أو `@google/gemini-cli` أو `opencode-ai`) إذا كان مفقودًا. خلفية ACP نفسها هي حزمة `acpx/runtime` المدمجة والمرفقة من Plugin `acpx`.
- نسخة Docker الخاصة بـ Droid ترتب `~/.factory` للإعدادات، وتمرر `FACTORY_API_KEY`، وتتطلب مفتاح API هذا لأن مصادقة OAuth/حلقة المفاتيح المحلية الخاصة بـ Factory غير قابلة للنقل إلى الحاوية. تستخدم إدخال السجل المدمج في ACPX وهو `droid exec --output-format acp`.
- نسخة Docker الخاصة بـ OpenCode هي مسار انحدار صارم لوكيل واحد. تكتب نموذجًا افتراضيًا مؤقتًا في `OPENCODE_CONFIG_CONTENT` من `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (الافتراضي `opencode/kimi-k2.6`) بعد تحميل `~/.profile`، ويتطلب `pnpm test:docker:live-acp-bind:opencode` نص مساعد مرتبطًا بدلًا من قبول التخطي العام بعد الربط.
- استدعاءات CLI المباشرة لـ `acpx` هي مسار يدوي/حل بديل فقط لمقارنة السلوك خارج Gateway. اختبار smoke الخاص بربط ACP في Docker يمارس خلفية تشغيل `acpx` المدمجة في OpenClaw.

## مباشر: اختبار smoke لحزمة اختبار خادم تطبيق Codex

- الهدف: التحقق من حزمة اختبار Codex المملوكة للـ Plugin عبر طريقة Gateway العادية
  `agent`:
  - تحميل Plugin `codex` المرفق
  - تحديد `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول دورة لوكيل Gateway إلى `openai/gpt-5.5` مع فرض حزمة اختبار Codex
  - إرسال دورة ثانية إلى جلسة OpenClaw نفسها والتحقق من أن خيط خادم التطبيق
    يستطيع الاستئناف
  - تشغيل `/codex status` و `/codex models` عبر مسار أوامر Gateway نفسه
  - اختياريًا تشغيل فحصين مصعدين للصدفة يراجعهما Guardian: أمر حميد
    ينبغي الموافقة عليه، ورفع سر مزيف ينبغي رفضه بحيث يرد الوكيل بسؤال
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `openai/gpt-5.5`
- فحص الصورة الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- فحص MCP/الأداة الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- فحص Guardian الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- يضبط اختبار smoke القيمة `OPENCLAW_AGENT_HARNESS_FALLBACK=none` حتى لا تتمكن حزمة اختبار Codex
  المعطلة من النجاح بالرجوع بصمت إلى PI.
- المصادقة: مصادقة خادم تطبيق Codex من تسجيل الدخول المحلي لاشتراك Codex. يمكن لاختبارات smoke في Docker
  أيضًا توفير `OPENAI_API_KEY` لفحوص غير Codex عند الاقتضاء،
  إضافة إلى نسخ اختيارية من `~/.codex/auth.json` و `~/.codex/config.toml`.

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
- يحمّل `~/.profile` المركب، ويمرر `OPENAI_API_KEY`، وينسخ ملفات مصادقة Codex CLI
  عند وجودها، ويثبت `@openai/codex` في بادئة npm مركبة قابلة للكتابة،
  ويرتب شجرة المصدر، ثم يشغّل اختبار Codex-harness الحي فقط.
- يفعّل Docker فحوص الصورة وMCP/الأداة وGuardian افتراضيًا. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` عندما تحتاج إلى تشغيل تصحيح أضيق.
- يصدّر Docker أيضًا `OPENCLAW_AGENT_HARNESS_FALLBACK=none`، مطابقًا لإعدادات
  الاختبار الحي حتى لا تتمكن الأسماء المستعارة القديمة أو الرجوع إلى PI من إخفاء
  انحدار في حزمة اختبار Codex.

### الوصفات الحية الموصى بها

قوائم السماح الضيقة والصريحة هي الأسرع والأقل عرضة للتقلب:

- نموذج واحد، مباشر (من دون Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، اختبار smoke عبر Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة مزودين:
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
- يستخدم `google-gemini-cli/...` واجهة Gemini CLI المحلية على جهازك (مصادقة منفصلة وخصوصيات أدوات).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP (مفتاح API / مصادقة ملف تعريف)؛ وهذا ما يعنيه معظم المستخدمين بعبارة “Gemini”.
  - CLI: ينفذ OpenClaw ملفًا ثنائيًا محليًا باسم `gemini` عبر الصدفة؛ له مصادقته الخاصة ويمكن أن يتصرف بشكل مختلف (دعم البث/الأدوات/انحراف الإصدارات).

## مباشر: مصفوفة النماذج (ما نغطيه)

لا توجد “قائمة نماذج CI” ثابتة (الاختبار الحي اختياري)، لكن هذه هي النماذج **الموصى بها** لتغطيتها بانتظام على جهاز تطوير يحتوي على مفاتيح.

### مجموعة smoke الحديثة (استدعاء الأدوات + الصورة)

هذا هو تشغيل “النماذج الشائعة” الذي نتوقع أن يبقى عاملًا:

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

### الأساس: استدعاء الأدوات (Read + Exec اختياري)

اختر واحدًا على الأقل لكل عائلة مزودين:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (مفيدة):

- xAI: `xai/grok-4` (أو أحدث إصدار متاح)
- Mistral: `mistral/`… (اختر نموذجًا واحدًا قادرًا على “الأدوات” ومفعلًا لديك)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### الرؤية: إرسال صورة (مرفق → رسالة متعددة الوسائط)

ضمّن نموذجًا واحدًا على الأقل قادرًا على الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (متغيرات Claude/Gemini/OpenAI القادرة على الرؤية، إلخ) لممارسة فحص الصورة.

### المجمعات / البوابات البديلة

إذا كانت لديك مفاتيح مفعلة، ندعم أيضًا الاختبار عبر:

- OpenRouter: `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين قادرين على الأدوات+الصور)
- OpenCode: `opencode/...` لـ Zen و `opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزودون إضافيون يمكنك ضمهم إلى المصفوفة الحية (إذا كانت لديك بيانات اعتماد/إعدادات):

- مدمج: `openai`، `openai-codex`، `anthropic`، `google`، `google-vertex`، `google-antigravity`، `google-gemini-cli`، `zai`، `openrouter`، `opencode`، `opencode-go`، `xai`، `groq`، `cerebras`، `mistral`، `github-copilot`
- عبر `models.providers` (نقاط نهاية مخصصة): `minimax` (سحابة/API)، إضافة إلى أي وكيل متوافق مع OpenAI/Anthropic (LM Studio، vLLM، LiteLLM، إلخ)

<Tip>
لا ترمّز "all models" بشكل ثابت في المستندات. القائمة الموثوقة هي ما يعيده `discoverModels(...)` على جهازك إضافة إلى المفاتيح المتاحة.
</Tip>

## بيانات الاعتماد (لا تلتزم بها أبدًا)

تكتشف الاختبارات الحية بيانات الاعتماد بالطريقة نفسها التي يفعلها CLI. الآثار العملية:

- إذا كانت CLI تعمل، فينبغي أن تعثر الاختبارات الحية على المفاتيح نفسها.
- إذا قال اختبار حي "no creds"، فصححه بالطريقة نفسها التي تصحح بها `openclaw models list` / اختيار النموذج.

- ملفات تعريف المصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (هذا ما تعنيه "profile keys" في الاختبارات الحية)
- الإعدادات: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- مجلد الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى المنزل الحي المرحلي عند وجوده، لكنه ليس مخزن مفاتيح ملف التعريف الرئيسي)
- تنسخ التشغيلات المحلية الحية الإعداد النشط، وملفات `auth-profiles.json` لكل وكيل، و`credentials/` القديمة، ومجلدات مصادقة CLI الخارجية المدعومة إلى منزل اختبار مؤقت افتراضيًا؛ تتخطى المنازل الحية المرحلية `workspace/` و`sandboxes/`، وتُزال تجاوزات مسار `agents.*.workspace` / `agentDir` حتى تبقى المجسات بعيدة عن مساحة عمل المضيف الحقيقية لديك.

إذا أردت الاعتماد على مفاتيح البيئة (مثلًا المصدّرة في `~/.profile`)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغلات Docker أدناه (يمكنها تركيب `~/.profile` داخل الحاوية).

## Deepgram حي (نسخ صوتي)

- الاختبار: `extensions/deepgram/audio.live.test.ts`
- التفعيل: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## خطة ترميز BytePlus حية

- الاختبار: `extensions/byteplus/live.test.ts`
- التفعيل: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- تجاوز النموذج الاختياري: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## وسائط سير عمل ComfyUI الحية

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يمرّن مسارات الصور والفيديو و`music_generate` المضمّنة في comfy
  - يتخطى كل قدرة ما لم تكن `plugins.entries.comfy.config.<capability>` مهيأة
  - مفيد بعد تغيير إرسال سير عمل comfy، أو الاستقصاء، أو التنزيلات، أو تسجيل Plugin

## توليد الصور الحي

- الاختبار: `test/image-generation.runtime.live.test.ts`
- الأمر: `pnpm test:live test/image-generation.runtime.live.test.ts`
- منصة الاختبار: `pnpm test:live:media image`
- النطاق:
  - يسرد كل Plugin مزود توليد صور مسجل
  - يحمّل متغيرات بيئة المزود الناقصة من صدفة تسجيل الدخول لديك (`~/.profile`) قبل الفحص
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
- التضييق الاختياري:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- سلوك المصادقة الاختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن ملف التعريف وتجاهل التجاوزات المعتمدة على البيئة فقط

بالنسبة إلى مسار CLI المشحون، أضف فحص `infer` سريعًا بعد نجاح اختبار المزود/وقت التشغيل الحي:

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
Plugin المضمّن، وإصلاح اعتماد وقت التشغيل المضمّن عند الطلب، ووقت تشغيل
توليد الصور المشترك، وطلب المزود الحي.

## توليد الموسيقى الحي

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- منصة الاختبار: `pnpm test:live:media music`
- النطاق:
  - يمرّن مسار مزود توليد الموسيقى المضمّن المشترك
  - يغطي حاليًا Google وMiniMax
  - يحمّل متغيرات بيئة المزود من صدفة تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزودين الذين لا يملكون مصادقة/ملف تعريف/نموذجًا قابلًا للاستخدام
  - يشغّل نمطي وقت التشغيل المعلنين عندما يكونان متاحين:
    - `generate` مع إدخال موجّه فقط
    - `edit` عندما يعلن المزود `capabilities.edit.enabled`
  - تغطية المسار المشترك الحالية:
    - `google`: `generate`، `edit`
    - `minimax`: `generate`
    - `comfy`: ملف Comfy حي منفصل، وليس هذا المسح المشترك
- التضييق الاختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- سلوك المصادقة الاختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن ملف التعريف وتجاهل التجاوزات المعتمدة على البيئة فقط

## توليد الفيديو الحي

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- منصة الاختبار: `pnpm test:live:media video`
- النطاق:
  - يمرّن مسار مزود توليد الفيديو المضمّن المشترك
  - يعتمد افتراضيًا مسار الفحص السريع الآمن للإصدار: مزودون غير FAL، وطلب تحويل نص إلى فيديو واحد لكل مزود، وموجّه جراد بحر مدته ثانية واحدة، وحدّ عملية لكل مزود من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` افتراضيًا)
  - يتخطى FAL افتراضيًا لأن زمن انتظار طابور المزود قد يهيمن على وقت الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحة
  - يحمّل متغيرات بيئة المزود من صدفة تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضيًا، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزودين الذين لا يملكون مصادقة/ملف تعريف/نموذجًا قابلًا للاستخدام
  - يشغّل `generate` فقط افتراضيًا
  - اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أنماط التحويل المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن المزود `capabilities.imageToVideo.enabled` ويقبل المزود/النموذج المحدد إدخال صورة محلية مدعومًا بالمخزن المؤقت في المسح المشترك
    - `videoToVideo` عندما يعلن المزود `capabilities.videoToVideo.enabled` ويقبل المزود/النموذج المحدد إدخال فيديو محلي مدعومًا بالمخزن المؤقت في المسح المشترك
  - مزودو `imageToVideo` المعلنون والمتخطون حاليًا في المسح المشترك:
    - `vydra` لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب URL صورة بعيدًا
  - تغطية Vydra الخاصة بالمزود:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل ذلك الملف `veo3` لتحويل النص إلى فيديو بالإضافة إلى مسار `kling` يستخدم أداة تثبيت URL صورة بعيدة افتراضيًا
  - تغطية `videoToVideo` الحية الحالية:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - مزودو `videoToVideo` المعلنون والمتخطون حاليًا في المسح المشترك:
    - `alibaba` و`qwen` و`xai` لأن تلك المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة بصيغة `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا مدعومًا بالمخزن المؤقت، وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات وصول خاصة بالمؤسسة لطلاء/إعادة مزج الفيديو
- التضييق الاختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزود في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل حد كل عملية مزود لفحص سريع هجومي
- سلوك المصادقة الاختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن ملف التعريف وتجاهل التجاوزات المعتمدة على البيئة فقط

## منصة الاختبار الحية للوسائط

- الأمر: `pnpm test:live:media`
- الغرض:
  - تشغّل مجموعات الصور والموسيقى والفيديو الحية المشتركة عبر نقطة دخول أصلية للمستودع
  - تحمّل تلقائيًا متغيرات بيئة المزود الناقصة من `~/.profile`
  - تضيّق تلقائيًا كل مجموعة إلى المزودين الذين لديهم حاليًا مصادقة قابلة للاستخدام افتراضيًا
  - تعيد استخدام `scripts/test-live.mjs`، لذلك يبقى سلوك Heartbeat ووضع الهدوء متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ذات صلة

- [الاختبار](/ar/help/testing) — مجموعات اختبارات الوحدات، والتكامل، وضمان الجودة، وDocker
