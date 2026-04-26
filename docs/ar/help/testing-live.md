---
read_when:
    - تشغيل اختبارات smoke المباشرة لمصفوفة النماذج / الواجهات الخلفية لـ CLI / ACP / موفري الوسائط
    - تصحيح حل بيانات الاعتماد في الاختبارات المباشرة
    - إضافة اختبار مباشر خاص بمزوّد جديد
sidebarTitle: Live tests
summary: 'الاختبارات المباشرة (التي تلامس الشبكة): مصفوفة النماذج، وواجهات CLI الخلفية، وACP، وموفرو الوسائط، وبيانات الاعتماد'
title: 'الاختبار: الأجنحة المباشرة'
x-i18n:
    generated_at: "2026-04-26T11:32:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 669d68dc80d0bf86942635c792f64f1edc7a23684c880cb66799401dee3d127f
    source_path: help/testing-live.md
    workflow: 15
---

بالنسبة إلى البدء السريع، ومشغلي QA، وأجنحة unit/integration، وتدفقات Docker، راجع
[الاختبار](/ar/help/testing). تغطي هذه الصفحة أجنحة الاختبار **المباشرة** (التي تلامس الشبكة):
مصفوفة النماذج، والواجهات الخلفية لـ CLI، وACP، واختبارات موفري الوسائط المباشرة، بالإضافة
إلى التعامل مع بيانات الاعتماد.

## مباشر: أوامر smoke للملف الشخصي المحلي

نفّذ `source ~/.profile` قبل الفحوصات المباشرة المخصصة بحيث تتطابق مفاتيح المزوّد
ومسارات الأدوات المحلية مع الصدفة لديك:

```bash
source ~/.profile
```

اختبار smoke آمن للوسائط:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

اختبار smoke آمن للاستعداد للمكالمات الصوتية:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

يكون `voicecall smoke` تشغيلًا تجريبيًا جافًا ما لم يكن `--yes` موجودًا أيضًا. استخدم `--yes` فقط
عندما تريد عمدًا إجراء مكالمة إشعار حقيقية. بالنسبة إلى Twilio، وTelnyx، وPlivo،
يتطلب فحص الجاهزية الناجح عنوان Webhook عامًا؛ إذ تُرفض خيارات local loopback/الخاصة فقط عمدًا.

## مباشر: مسح إمكانات عقدة Android

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- البرنامج النصي: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر معلن عنه حاليًا** بواسطة عقدة Android متصلة والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد يدوي/مشروط مسبقًا (لا يقوم الجناح بتثبيت التطبيق أو تشغيله أو اقترانه).
  - تحقق `node.invoke` لكل أمر عبر gateway لعقدة Android المحددة.
- الإعداد المسبق المطلوب:
  - أن يكون تطبيق Android متصلًا بالفعل بـ gateway ومقترنًا به.
  - إبقاء التطبيق في الواجهة الأمامية.
  - منح الأذونات/الموافقة على الالتقاط للإمكانات التي تتوقع نجاحها.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## مباشر: smoke للنموذج (مفاتيح الملفات الشخصية)

تنقسم الاختبارات المباشرة إلى طبقتين حتى نتمكن من عزل الإخفاقات:

- "النموذج المباشر" يخبرنا ما إذا كان المزوّد/النموذج قادرًا على الرد أصلًا بالمفتاح المحدد.
- "Gateway smoke" يخبرنا ما إذا كان خط أنابيب gateway+agent الكامل يعمل لهذا النموذج (الجلسات، والسجل، والأدوات، وسياسة sandbox، وما إلى ذلك).

### الطبقة 1: إكمال مباشر للنموذج (من دون gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لتحديد النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (وانحدارات موجهة عند الحاجة)
- كيفية التفعيل:
  - `pnpm test:live` ‏(أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- اضبط `OPENCLAW_LIVE_MODELS=modern` ‏(أو `all`، وهو اسم بديل لـ modern) لتشغيل هذا الجناح فعليًا؛ وإلا فإنه يتخطى التشغيل للإبقاء على تركيز `pnpm test:live` على gateway smoke
- كيفية تحديد النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.2 + Codex، وGemini 3، وDeepSeek V4، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` ‏(قائمة سماح مفصولة بفواصل)
  - تستخدم عمليات المسح modern/all افتراضيًا حدًا عالي الإشارة ومنسقًا؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لمسح حديث شامل أو رقمًا موجبًا لحد أصغر.
  - تستخدم عمليات المسح الشاملة `OPENCLAW_LIVE_TEST_TIMEOUT_MS` كمهلة لاختبار النموذج المباشر كله. الافتراضي: 60 دقيقة.
  - تعمل مجسات النماذج المباشرة بتوازٍ مقداره 20 مسارًا افتراضيًا؛ اضبط `OPENCLAW_LIVE_MODEL_CONCURRENCY` للتجاوز.
- كيفية تحديد المزوّدين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` ‏(قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن الملفات الشخصية مع الرجوع إلى env
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض **مخزن الملفات الشخصية** فقط
- سبب وجود هذا:
  - يفصل بين "API الخاص بالمزوّد معطّل / المفتاح غير صالح" و"خط أنابيب وكيل gateway معطّل"
  - يحتوي على انحدارات صغيرة ومعزولة (مثال: تدفقات replay + tool-call في OpenAI Responses/Codex Responses reasoning)

### الطبقة 2: Gateway + smoke لوكيل dev (ما الذي يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل gateway داخل العملية
  - إنشاء/ترقيع جلسة `agent:dev:*` ‏(تجاوز النموذج لكل تشغيل)
  - تكرار النماذج التي لديها مفاتيح والتحقق من:
    - استجابة "ذات معنى" (من دون أدوات)
    - أن يعمل استدعاء أداة حقيقي (مجس read)
    - مجسات أدوات إضافية اختيارية (مجس exec+read)
    - استمرار عمل مسارات انحدار OpenAI ‏(tool-call-only → follow-up)
- تفاصيل المجسات (حتى تتمكن من شرح الإخفاقات بسرعة):
  - مجس `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل `read` له وإعادة nonce.
  - مجس `exec+read`: يطلب الاختبار من الوكيل أن يكتب nonce إلى ملف مؤقت عبر `exec`، ثم يقرأه مرة أخرى.
  - مجس الصورة: يرفق الاختبار ملف PNG مولدًا (قط + رمز عشوائي) ويتوقع أن يعيد النموذج `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- كيفية التفعيل:
  - `pnpm test:live` ‏(أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية تحديد النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، وGPT-5.2 + Codex، وGemini 3، وDeepSeek V4، وGLM 4.7، وMiniMax M2.7، وGrok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم بديل لقائمة السماح الحديثة
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` ‏(أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم عمليات المسح الحديثة/الشاملة في gateway افتراضيًا حدًا عالي الإشارة ومنسقًا؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لمسح حديث شامل أو رقمًا موجبًا لحد أصغر.
- كيفية تحديد المزوّدين (لتجنب "كل شيء عبر OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` ‏(قائمة سماح مفصولة بفواصل)
- تكون مجسات الأدوات + الصور مفعّلة دائمًا في هذا الاختبار المباشر:
  - مجس `read` + مجس `exec+read` ‏(إجهاد الأدوات)
  - يعمل مجس الصورة عندما يعلن النموذج دعم إدخال الصور
  - التدفق (على مستوى عالٍ):
    - يولد الاختبار PNG صغيرًا يحتوي على “CAT” + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسله عبر `agent` ضمن `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` ‏(`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: يحتوي الرد على `cat` + الرمز (مع سماح بسيط بأخطاء OCR)

نصيحة: لمعرفة ما الذي يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

## مباشر: smoke للواجهة الخلفية CLI ‏(Claude، أو Codex، أو Gemini، أو غيرها من CLIs المحلية)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من خط أنابيب Gateway + agent باستخدام واجهة خلفية CLI محلية، من دون لمس التكوين الافتراضي لديك.
- تعيش إعدادات smoke الافتراضية الخاصة بكل واجهة خلفية مع تعريف `cli-backend.ts` الخاص بالامتداد المالك.
- التفعيل:
  - `pnpm test:live` ‏(أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- القيم الافتراضية:
  - المزوّد/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/الوسائط/الصورة من بيانات التعريف الخاصة بـ Plugin الواجهة الخلفية CLI المالكة.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (يتم حقن المسارات داخل المطالبة). تعطل وصفات Docker هذا افتراضيًا ما لم يُطلب صراحةً.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من الحقن في المطالبة.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` ‏(أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عند تعيين `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دور ثانٍ والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` للاشتراك في مجس استمرارية الجلسة نفسها Claude Sonnet -> Opus عندما يدعم النموذج المحدد هدف تبديل. تعطل وصفات Docker هذا افتراضيًا لزيادة الاعتمادية الكلية.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` للاشتراك في مجس MCP/loopback للأداة. تعطل وصفات Docker هذا افتراضيًا ما لم يُطلب صراحةً.

مثال:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

اختبار smoke رخيص لتكوين Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

لا يطلب هذا من Gemini توليد رد. بل يكتب إعدادات النظام نفسها
التي يعطيها OpenClaw إلى Gemini، ثم يشغّل `gemini --debug mcp list` لإثبات أن
خادمًا محفوظًا من نوع `transport: "streamable-http"` قد طُبّع إلى شكل HTTP MCP الخاص بـ Gemini
ويمكنه الاتصال بخادم MCP محلي عبر streamable-HTTP.

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
- يشغّل smoke الواجهة الخلفية CLI المباشر داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير الجذر.
- يحل بيانات تعريف smoke الخاصة بـ CLI من الامتداد المالك، ثم يثبت حزمة CLI المطابقة لنظام Linux (`@anthropic-ai/claude-code`، أو `@openai/codex`، أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزنة مؤقتًا عند `OPENCLAW_DOCKER_CLI_TOOLS_DIR` ‏(الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` اشتراك Claude Code OAuth محمولًا عبر أي من `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. ويثبت أولًا `claude -p` المباشر داخل Docker، ثم يشغّل دورين من واجهة Gateway CLI الخلفية من دون الاحتفاظ بمتغيرات env الخاصة بمفتاح Anthropic API. يعطّل هذا المسار الخاص بالاشتراك مجسات Claude MCP/tool والصور افتراضيًا لأن Claude يوجّه حاليًا استخدام تطبيقات الجهات الخارجية عبر فوترة الاستخدام الإضافي بدلًا من حدود خطة الاشتراك العادية.
- يمارس smoke الواجهة الخلفية CLI المباشرة الآن التدفق الكامل نفسه من طرف إلى طرف لكل من Claude وCodex وGemini: دور نصي، ثم دور تصنيف صورة، ثم استدعاء أداة MCP ‏`cron` تم التحقق منه عبر gateway CLI.
- يقوم smoke الافتراضي لـ Claude أيضًا بترقيع الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة لا تزال تتذكر ملاحظة سابقة.

## مباشر: smoke لربط ACP ‏(`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط المحادثة الحقيقي في ACP مع وكيل ACP مباشر:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة قناة رسائل اصطناعية في مكانها
  - إرسال متابعة عادية على تلك المحادثة نفسها
  - التحقق من وصول المتابعة إلى transcript الخاص بجلسة ACP المرتبطة
- التفعيل:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- القيم الافتراضية:
  - وكلاء ACP في Docker: ‏`claude,codex,gemini`
  - وكيل ACP لتشغيل `pnpm test:live ...` مباشرة: ‏`claude`
  - قناة اصطناعية: سياق محادثة بنمط رسالة خاصة في Slack
  - الواجهة الخلفية لـ ACP: ‏`acpx`
- التجاوزات:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- ملاحظات:
  - يستخدم هذا المسار سطح `chat.send` في gateway مع حقول synthetic originating-route المخصصة للمشرف فقط، بحيث يمكن للاختبارات إرفاق سياق قناة الرسائل من دون التظاهر بالتسليم الخارجي.
  - عندما تكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` غير مضبوطة، يستخدم الاختبار سجل الوكلاء المضمن في Plugin `acpx` المضمن للوكيل المحدد في حزمة ACP.

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

- يوجد مشغّل Docker في `scripts/test-live-acp-bind-docker.sh`.
- افتراضيًا، يشغّل smoke ربط ACP على وكلاء CLI المباشرين المجمّعين بالتتابع: `claude`، ثم `codex`، ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`، أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`، أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`، أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`، أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` لتضييق المصفوفة.
- يقوم بتحميل `~/.profile`، وتجهيز مواد مصادقة CLI المطابقة داخل الحاوية، ثم يثبت CLI المباشر المطلوب (`@anthropic-ai/claude-code`، أو `@openai/codex`، أو Factory Droid عبر `https://app.factory.ai/cli`، أو `@google/gemini-cli`، أو `opencode-ai`) إذا لم يكن موجودًا. أما الواجهة الخلفية ACP نفسها فهي الحزمة المضمنة `acpx/runtime` من Plugin ‏`acpx`.
- يقوم متغير Droid في Docker بتجهيز `~/.factory` للإعدادات، وتمرير `FACTORY_API_KEY`، ويتطلب مفتاح API هذا لأن مصادقة Factory المحلية عبر OAuth/keyring غير قابلة للنقل إلى الحاوية. وهو يستخدم إدخال السجل المضمن في ACPX ‏`droid exec --output-format acp`.
- يُعد متغير OpenCode في Docker مسار انحدار صارمًا لوكيل واحد فقط. فهو يكتب نموذجًا افتراضيًا مؤقتًا في `OPENCODE_CONFIG_CONTENT` من `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` ‏(الافتراضي `opencode/kimi-k2.6`) بعد تحميل `~/.profile`، ويتطلب `pnpm test:docker:live-acp-bind:opencode` وجود transcript لمساعد مرتبط بدلًا من قبول التخطي العام بعد الربط.
- تمثل استدعاءات `acpx` المباشرة عبر CLI مجرد مسار يدوي/حل بديل لمقارنة السلوك خارج Gateway. أما smoke ربط ACP في Docker فيختبر الواجهة الخلفية المضمنة `acpx` في OpenClaw.

## مباشر: smoke لحزمة Codex app-server

- الهدف: التحقق من الحزمة الخاصة بـ Codex التي يملكها Plugin عبر أسلوب
  `agent` العادي في gateway:
  - تحميل Plugin ‏`codex` المضمن
  - تحديد `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول دور وكيل عبر gateway إلى `openai/gpt-5.2` مع فرض حزمة Codex
  - إرسال دور ثانٍ إلى جلسة OpenClaw نفسها والتحقق من أن thread
    الخاص بـ app-server يمكنه الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار أوامر gateway نفسه
  - اختياريًا، تشغيل مجسين اثنين لـ shell المرتفع خاضعين لمراجعة Guardian: أمر
    بسيط يجب أن تتم الموافقة عليه، ورفع secret مزيف يجب أن يتم رفضه
    لكي يسأل الوكيل مجددًا
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `openai/gpt-5.2`
- مجس صورة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- مجس MCP/tool اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- مجس Guardian اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- يضبط smoke القيمة `OPENCLAW_AGENT_HARNESS_FALLBACK=none` بحيث لا يمكن
  لحزمة Codex المعطلة أن تنجح عبر الرجوع الصامت إلى PI.
- المصادقة: مصادقة Codex app-server من تسجيل الدخول المحلي لاشتراك Codex.
  ويمكن لاختبارات Docker smoke أيضًا تمرير `OPENAI_API_KEY` للمجسات غير الخاصة بـ Codex عند الاقتضاء،
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

- يوجد مشغّل Docker في `scripts/test-live-codex-harness-docker.sh`.
- يقوم بتحميل `~/.profile` المربوط، ويمرر `OPENAI_API_KEY`، وينسخ ملفات مصادقة Codex CLI
  عند وجودها، ويثبت `@openai/codex` داخل بادئة npm مربوطة وقابلة للكتابة،
  ويجهز شجرة المصدر، ثم يشغّل فقط الاختبار المباشر لحزمة Codex.
- يفعّل Docker مجسات الصورة وMCP/tool وGuardian افتراضيًا. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` عندما تحتاج إلى تشغيل
  أضيق لأغراض التصحيح.
- يصدّر Docker أيضًا `OPENCLAW_AGENT_HARNESS_FALLBACK=none`، بما يطابق تكوين الاختبار المباشر
  حتى لا تتمكن الأسماء البديلة القديمة أو الرجوع الاحتياطي إلى PI من إخفاء
  انحدار في حزمة Codex.

### الوصفات المباشرة الموصى بها

تكون قوائم السماح الضيقة والصريحة الأسرع والأقل عرضة للتعطل:

- نموذج واحد، مباشر (من دون gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، smoke عبر gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة مزوّدين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- التركيز على Google ‏(مفتاح Gemini API + Antigravity):
  - Gemini ‏(مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity ‏(OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- smoke للتفكير التكيفي في Google:
  - إذا كانت المفاتيح المحلية موجودة في ملف shell profile: ‏`source ~/.profile`
  - القيمة الافتراضية الديناميكية لـ Gemini 3: ‏`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - ميزانية Gemini 2.5 الديناميكية: ‏`pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

ملاحظات:

- يستخدم `google/...` واجهة Gemini API ‏(مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity OAuth ‏(نقطة نهاية وكيل على نمط Cloud Code Assist).
- يستخدم `google-gemini-cli/...` أداة Gemini CLI المحلية على جهازك (مع مصادقة منفصلة وخصائص مختلفة للأدوات).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP ‏(مصادقة بمفتاح API / ملف تعريف)؛ وهذا ما يقصده معظم المستخدمين عندما يقولون “Gemini”.
  - CLI: يقوم OpenClaw باستدعاء ملف `gemini` التنفيذي المحلي؛ وله مصادقة خاصة به ويمكن أن يتصرف بشكل مختلف (البث/دعم الأدوات/اختلاف الإصدار).

## مباشر: مصفوفة النماذج (ما الذي نغطيه)

لا توجد "قائمة نماذج CI" ثابتة (فالاختبار المباشر اختياري)، لكن هذه هي النماذج **الموصى بها** للتغطية المنتظمة على جهاز تطوير يحتوي على مفاتيح.

### مجموعة smoke الحديثة (استدعاء الأدوات + الصور)

هذا هو تشغيل "النماذج الشائعة" الذي نتوقع أن يظل يعمل:

- OpenAI ‏(غير Codex): ‏`openai/gpt-5.2`
- OpenAI Codex OAuth: ‏`openai-codex/gpt-5.2`
- Anthropic: ‏`anthropic/claude-opus-4-6` ‏(أو `anthropic/claude-sonnet-4-6`)
- Google ‏(Gemini API): ‏`google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview` ‏(تجنب نماذج Gemini 2.x الأقدم)
- Google ‏(Antigravity): ‏`google-antigravity/claude-opus-4-6-thinking` و`google-antigravity/gemini-3-flash`
- DeepSeek: ‏`deepseek/deepseek-v4-flash` و`deepseek/deepseek-v4-pro`
- Z.AI ‏(GLM): ‏`zai/glm-4.7`
- MiniMax: ‏`minimax/MiniMax-M2.7`

شغّل smoke عبر gateway مع الأدوات + الصور:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### الأساس: استدعاء الأدوات (Read + Exec اختياري)

اختر واحدًا على الأقل من كل عائلة مزوّد:

- OpenAI: ‏`openai/gpt-5.2`
- Anthropic: ‏`anthropic/claude-opus-4-6` ‏(أو `anthropic/claude-sonnet-4-6`)
- Google: ‏`google/gemini-3-flash-preview` ‏(أو `google/gemini-3.1-pro-preview`)
- DeepSeek: ‏`deepseek/deepseek-v4-flash`
- Z.AI ‏(GLM): ‏`zai/glm-4.7`
- MiniMax: ‏`minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (من الجيد توفرها):

- xAI: ‏`xai/grok-4` ‏(أو أحدث إصدار متاح)
- Mistral: ‏`mistral/`… ‏(اختر نموذجًا واحدًا يدعم “tools” ومفعّلًا لديك)
- Cerebras: ‏`cerebras/`… ‏(إذا كان لديك وصول)
- LM Studio: ‏`lmstudio/`… ‏(محلي؛ استدعاء الأدوات يعتمد على وضع API)

### الرؤية: إرسال صورة (مرفق → رسالة متعددة الوسائط)

ضمّن نموذجًا واحدًا على الأقل قادرًا على التعامل مع الصور ضمن `OPENCLAW_LIVE_GATEWAY_MODELS` ‏(Claude/Gemini/إصدارات OpenAI القادرة على الرؤية، إلخ.) لتشغيل مجس الصورة.

### المجمعات / البوابات البديلة

إذا كانت لديك مفاتيح مفعلة، فنحن ندعم أيضًا الاختبار عبر:

- OpenRouter: ‏`openrouter/...` ‏(مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين يدعمون الأدوات + الصور)
- OpenCode: ‏`opencode/...` لـ Zen و`opencode-go/...` لـ Go ‏(المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزيد من المزوّدين الذين يمكنك تضمينهم في المصفوفة المباشرة (إذا كانت لديك بيانات الاعتماد/التكوين):

- مدمجة: `openai`، و`openai-codex`، و`anthropic`، و`google`، و`google-vertex`، و`google-antigravity`، و`google-gemini-cli`، و`zai`، و`openrouter`، و`opencode`، و`opencode-go`، و`xai`، و`groq`، و`cerebras`، و`mistral`، و`github-copilot`
- عبر `models.providers` ‏(نقاط نهاية مخصصة): ‏`minimax` ‏(السحابة/API)، بالإضافة إلى أي proxy متوافق مع OpenAI/Anthropic ‏(LM Studio، وvLLM، وLiteLLM، وما إلى ذلك)

نصيحة: لا تحاول تضمين "جميع النماذج" بشكل ثابت في الوثائق. فالقائمة المرجعية هي ما تُرجعه `discoverModels(...)` على جهازك + أي مفاتيح متاحة.

## بيانات الاعتماد (لا تُجرِ commit لها أبدًا)

تكتشف الاختبارات المباشرة بيانات الاعتماد بالطريقة نفسها التي يفعلها CLI. والنتائج العملية:

- إذا كان CLI يعمل، فمن المفترض أن تعثر الاختبارات المباشرة على المفاتيح نفسها.
- إذا قال اختبار مباشر "لا توجد بيانات اعتماد"، فقم بالتصحيح بالطريقة نفسها التي ستصحح بها `openclaw models list` / اختيار النموذج.

- ملفات تعريف المصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ‏(وهذا هو المقصود بـ "profile keys" في الاختبارات المباشرة)
- التكوين: `~/.openclaw/openclaw.json` ‏(أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` ‏(يتم نسخه إلى مجلد home المرحلي للاختبارات المباشرة عند وجوده، لكنه ليس مخزن profile-key الرئيسي)
- تقوم التشغيلات المحلية المباشرة افتراضيًا بنسخ التكوين النشط، وملفات `auth-profiles.json` لكل وكيل، و`credentials/` القديمة، وأدلة مصادقة CLI الخارجية المدعومة إلى home اختباري مؤقت؛ بينما تتخطى مجلدات home المرحلية للاختبارات المباشرة `workspace/` و`sandboxes/`، كما تُزال تجاوزات المسارات `agents.*.workspace` و`agentDir` حتى تبقى المجسات بعيدة عن مساحة العمل الحقيقية على المضيف.

إذا كنت تريد الاعتماد على مفاتيح env ‏(مثلًا المصدّرة في `~/.profile` لديك)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغّلات Docker أدناه (إذ يمكنها ربط `~/.profile` داخل الحاوية).

## Deepgram مباشر (نسخ صوتي)

- الاختبار: `extensions/deepgram/audio.live.test.ts`
- التفعيل: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan مباشر

- الاختبار: `extensions/byteplus/live.test.ts`
- التفعيل: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- تجاوز اختياري للنموذج: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media مباشر

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يختبر مسارات الصور والفيديو و`music_generate` المضمنة في comfy
  - يتخطى كل قدرة ما لم يكن `plugins.entries.comfy.config.<capability>` مهيأً
  - مفيد بعد تغيير إرسال workflow في comfy، أو polling، أو التنزيلات، أو تسجيل Plugin

## إنشاء الصور مباشر

- الاختبار: `test/image-generation.runtime.live.test.ts`
- الأمر: `pnpm test:live test/image-generation.runtime.live.test.ts`
- الحزمة: `pnpm test:live:media image`
- النطاق:
  - يعدّد كل Plugin مزوّد لإنشاء الصور مسجل
  - يحمّل متغيرات env المفقودة الخاصة بالمزوّد من shell login لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API المباشرة/من env قبل ملفات تعريف المصادقة المخزنة افتراضيًا، حتى لا تخفي مفاتيح الاختبار القديمة الموجودة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملف تعريف/نموذجًا صالحًا
  - يشغّل كل مزوّد مهيأ عبر بيئة runtime المشتركة لإنشاء الصور:
    - `<provider>:generate`
    - `<provider>:edit` عندما يعلن المزوّد دعم التعديل
- المزوّدون المضمنون الحاليون المشمولون:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- تضييق اختياري:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض المصادقة عبر مخزن الملفات الشخصية وتجاهل التجاوزات المعتمدة على env فقط

بالنسبة إلى مسار CLI المُرسل، أضف smoke خاصًا بـ `infer` بعد نجاح اختبار
المزوّد/runtime المباشر:

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
Plugin المضمن، وإصلاح تبعيات runtime المضمنة عند الطلب، وبيئة runtime
المشتركة لإنشاء الصور، وطلب المزوّد المباشر.

## إنشاء الموسيقى مباشر

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- الحزمة: `pnpm test:live:media music`
- النطاق:
  - يختبر المسار المشترك المضمن لمزودي إنشاء الموسيقى
  - يغطي حاليًا Google وMiniMax
  - يحمّل متغيرات env الخاصة بالمزوّد من shell login لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API المباشرة/من env قبل ملفات تعريف المصادقة المخزنة افتراضيًا، حتى لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملف تعريف/نموذجًا صالحًا
  - يشغّل وضعي runtime المعلنين كليهما عند توفرهما:
    - `generate` مع إدخال يعتمد على المطالبة فقط
    - `edit` عندما يعلن المزوّد `capabilities.edit.enabled`
  - التغطية الحالية في المسار المشترك:
    - `google`: ‏`generate`، و`edit`
    - `minimax`: ‏`generate`
    - `comfy`: ملف Comfy مباشر منفصل، وليس هذا المسح المشترك
- تضييق اختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض المصادقة عبر مخزن الملفات الشخصية وتجاهل التجاوزات المعتمدة على env فقط

## إنشاء الفيديو مباشر

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- الحزمة: `pnpm test:live:media video`
- النطاق:
  - يختبر المسار المشترك المضمن لمزودي إنشاء الفيديو
  - يفترض افتراضيًا مسار smoke آمنًا للإصدار: مزودون غير FAL، وطلب text-to-video واحد لكل مزوّد، ومطالبة لوبستر لمدة ثانية واحدة، وحد تشغيل لكل مزوّد من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` ‏(`180000` افتراضيًا)
  - يتخطى FAL افتراضيًا لأن زمن انتظار قائمة المزود قد يهيمن على زمن الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحةً
  - يحمّل متغيرات env الخاصة بالمزوّد من shell login لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API المباشرة/من env قبل ملفات تعريف المصادقة المخزنة افتراضيًا، حتى لا تخفي مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد shell الحقيقية
  - يتخطى المزوّدين الذين لا يملكون مصادقة/ملف تعريف/نموذجًا صالحًا
  - يشغّل `generate` فقط افتراضيًا
  - اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن المزوّد `capabilities.imageToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال صور محليًا مدعومًا بالمخزن المؤقت في المسح المشترك
    - `videoToVideo` عندما يعلن المزوّد `capabilities.videoToVideo.enabled` ويقبل المزوّد/النموذج المحدد إدخال فيديو محليًا مدعومًا بالمخزن المؤقت في المسح المشترك
  - مزودو `imageToVideo` المعلنون لكن المتخطَّون حاليًا في المسح المشترك:
    - `vydra` لأن `veo3` المضمن نصي فقط و`kling` المضمن يتطلب عنوان URL بعيدًا لصورة
  - التغطية الخاصة بمزوّد Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل هذا الملف `veo3` في text-to-video بالإضافة إلى مسار `kling` يستخدم عنوان URL بعيدًا لصورة fixture افتراضيًا
  - التغطية الحالية لـ `videoToVideo` المباشر:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - مزودو `videoToVideo` المعلنون لكن المتخطَّون حاليًا في المسح المشترك:
    - `alibaba`، و`qwen`، و`xai` لأن هذه المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة من نوع `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالًا محليًا مدعومًا بالمخزن المؤقت وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات وصول خاصة بالمؤسسة لعمليات inpaint/remix الخاصة بالفيديو
- تضييق اختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزوّد في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل حد العملية لكل مزوّد من أجل تشغيل smoke سريع وقاسٍ
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض المصادقة عبر مخزن الملفات الشخصية وتجاهل التجاوزات المعتمدة على env فقط

## حزمة الوسائط المباشرة

- الأمر: `pnpm test:live:media`
- الغرض:
  - يشغّل أجنحة الصور والموسيقى والفيديو المباشرة المشتركة عبر نقطة دخول أصلية واحدة للمستودع
  - يحمّل تلقائيًا متغيرات env الخاصة بالمزوّد والمفقودة من `~/.profile`
  - يضيّق كل جناح تلقائيًا إلى المزوّدين الذين يملكون حاليًا مصادقة صالحة افتراضيًا
  - يعيد استخدام `scripts/test-live.mjs`، بحيث يظل سلوك Heartbeat والوضع الهادئ متسقًا
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ذو صلة

- [الاختبار](/ar/help/testing) — أجنحة unit وintegration وQA وDocker
