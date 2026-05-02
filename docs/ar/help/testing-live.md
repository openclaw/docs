---
read_when:
    - تشغيل اختبارات smoke لمصفوفة النماذج الحية / الواجهة الخلفية لـ CLI / ACP / موفّر الوسائط
    - استكشاف أخطاء حل بيانات اعتماد الاختبار المباشر وإصلاحها
    - إضافة اختبار مباشر جديد خاص بموفر
sidebarTitle: Live tests
summary: 'اختبارات مباشرة (تتصل بالشبكة): مصفوفة النماذج، خلفيات CLI، ACP، موفرو الوسائط، بيانات الاعتماد'
title: 'الاختبار: مجموعات الاختبار الحية'
x-i18n:
    generated_at: "2026-05-02T20:47:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2268f20ce5c0bbee8bf610938851fe529f5e21fa31fe08a70400df94e9241cc3
    source_path: help/testing-live.md
    workflow: 16
---

للبدء السريع، ومشغّلي QA، وحِزم اختبارات الوحدة/التكامل، وتدفقات Docker، راجع
[الاختبار](/ar/help/testing). تغطي هذه الصفحة حِزم الاختبار **المباشرة** (التي تتعامل مع الشبكة):
مصفوفة النماذج، وخلفيات CLI، وACP، واختبارات موفّر الوسائط المباشرة، بالإضافة إلى
التعامل مع بيانات الاعتماد.

## مباشر: أوامر فحص profile المحلي السريعة

قم بتحميل `~/.profile` قبل الفحوصات المباشرة المؤقتة كي تطابق مفاتيح الموفّرين ومسارات الأدوات المحلية
الصدفة لديك:

```bash
source ~/.profile
```

فحص وسائط آمن:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

فحص آمن لجاهزية المكالمات الصوتية:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` هو تشغيل تجريبي ما لم يكن `--yes` موجودًا أيضًا. استخدم `--yes` فقط
عندما تريد عمدًا إجراء مكالمة إشعار حقيقية. بالنسبة إلى Twilio وTelnyx و
Plivo، يتطلب فحص الجاهزية الناجح عنوان URL عامًا لـ Webhook؛ ويتم رفض بدائل
local loopback/الخاصة المحلية حسب التصميم.

## مباشر: مسح قدرات Node Android

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- السكربت: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر مُعلَن عنه حاليًا** بواسطة Node Android متصل والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد مسبق/يدوي (لا تثبّت الحزمة التطبيق ولا تشغّله ولا تقرنه).
  - تحقق `node.invoke` في Gateway أمرًا بأمر لـ Node Android المحدد.
- الإعداد المسبق المطلوب:
  - تطبيق Android متصل ومقترن بالفعل بـ Gateway.
  - إبقاء التطبيق في المقدمة.
  - منح الأذونات/موافقة الالتقاط للقدرات التي تتوقع نجاحها.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## مباشر: فحص النماذج السريع (مفاتيح profile)

تُقسَّم الاختبارات المباشرة إلى طبقتين كي نتمكن من عزل الإخفاقات:

- “النموذج المباشر” يخبرنا أن الموفّر/النموذج يستطيع الإجابة أصلًا باستخدام المفتاح المعطى.
- “فحص Gateway السريع” يخبرنا أن مسار Gateway+agent الكامل يعمل لذلك النموذج (الجلسات، السجل، الأدوات، سياسة sandbox، إلخ).

### الطبقة 1: إكمال النموذج المباشر (بدون Gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لاختيار النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (والارتدادات المستهدفة عند الحاجة)
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- عيّن `OPENCLAW_LIVE_MODELS=modern` (أو `all`، وهو اسم مستعار لـ modern) لتشغيل هذه الحزمة فعليًا؛ وإلا فسيتم تخطيها لإبقاء `pnpm test:live` مركّزًا على فحص Gateway السريع
- كيفية اختيار النماذج:
  - `OPENCLAW_LIVE_MODELS=modern` لتشغيل قائمة السماح الحديثة (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` هو اسم مستعار لقائمة السماح الحديثة
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تستخدم عمليات مسح modern/all افتراضيًا حدًا منسقًا عالي الإشارة؛ عيّن `OPENCLAW_LIVE_MAX_MODELS=0` لإجراء مسح حديث شامل أو رقمًا موجبًا لحد أصغر.
  - تستخدم عمليات المسح الشاملة `OPENCLAW_LIVE_TEST_TIMEOUT_MS` كمهلة لاختبار النموذج المباشر بالكامل. الافتراضي: 60 دقيقة.
  - تعمل مجسات النموذج المباشر افتراضيًا بتوازٍ مقداره 20؛ عيّن `OPENCLAW_LIVE_MODEL_CONCURRENCY` للتجاوز.
- كيفية اختيار الموفّرين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- من أين تأتي المفاتيح:
  - افتراضيًا: مخزن profile وبدائل env
  - عيّن `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض استخدام **مخزن profile** فقط
- سبب وجود هذا:
  - يفصل بين “واجهة API للموفّر معطلة / المفتاح غير صالح” و“مسار agent في Gateway معطل”
  - يحتوي على ارتدادات صغيرة ومعزولة (مثال: إعادة تشغيل الاستدلال في OpenAI Responses/Codex Responses + تدفقات استدعاء الأدوات)

### الطبقة 2: Gateway + فحص agent التطويري السريع (ما يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل Gateway داخل العملية
  - إنشاء/تصحيح جلسة `agent:dev:*` (تجاوز النموذج لكل تشغيل)
  - تكرار النماذج ذات المفاتيح والتحقق من:
    - استجابة “ذات معنى” (بدون أدوات)
    - عمل استدعاء أداة حقيقي (مجس قراءة)
    - مجسات أدوات إضافية اختيارية (مجس exec+read)
    - استمرار عمل مسارات ارتداد OpenAI (استدعاء أداة فقط → متابعة)
- تفاصيل المجسات (كي تتمكن من شرح الإخفاقات بسرعة):
  - مجس `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من agent أن `read`ه وأن يعيد nonce.
  - مجس `exec+read`: يطلب الاختبار من agent أن يكتب nonce عبر `exec` في ملف مؤقت، ثم `read`ه مرة أخرى.
  - مجس الصورة: يرفق الاختبار ملف PNG مولدًا (cat + رمز عشوائي) ويتوقع من النموذج إرجاع `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`src/gateway/live-image-probe.ts`.
- كيفية التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
- كيفية اختيار النماذج:
  - الافتراضي: قائمة السماح الحديثة (Opus/Sonnet 4.6+، GPT-5.2 + Codex، Gemini 3، DeepSeek V4، GLM 4.7، MiniMax M2.7، Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` هو اسم مستعار لقائمة السماح الحديثة
  - أو عيّن `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) للتضييق
  - تستخدم عمليات مسح modern/all في Gateway افتراضيًا حدًا منسقًا عالي الإشارة؛ عيّن `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لإجراء مسح حديث شامل أو رقمًا موجبًا لحد أصغر.
- كيفية اختيار الموفّرين (لتجنب “كل شيء من OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- تكون مجسات الأدوات + الصور مفعّلة دائمًا في هذا الاختبار المباشر:
  - مجس `read` + مجس `exec+read` (ضغط الأدوات)
  - يعمل مجس الصورة عندما يعلن النموذج دعم إدخال الصور
  - التدفق (على مستوى عالٍ):
    - ينشئ الاختبار ملف PNG صغيرًا يحتوي على “CAT” + رمز عشوائي (`src/gateway/live-image-probe.ts`)
    - يرسله عبر `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر agent المضمّن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التأكيد: يحتوي الرد على `cat` + الرمز (تسامح OCR: يُسمح بالأخطاء الطفيفة)

<Tip>
لمعرفة ما يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## مباشر: فحص خلفية CLI السريع (Claude أو Codex أو Gemini أو واجهات CLI محلية أخرى)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من مسار Gateway + agent باستخدام خلفية CLI محلية، دون المساس بتكوينك الافتراضي.
- توجد افتراضيات الفحص السريع الخاصة بكل خلفية مع تعريف `cli-backend.ts` الخاص بالـ Plugin المالكة.
- التفعيل:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرة)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- الافتراضيات:
  - الموفّر/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/الوسيطات/الصور من بيانات Plugin الوصفية لخلفية CLI المالكة.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في الموجه). تعطل وصفات Docker هذا افتراضيًا ما لم يُطلب صراحةً.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسيطات CLI بدلًا من حقنها في الموجه.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسيطات الصور عند ضبط `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دورة ثانية والتحقق من تدفق الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` للاشتراك في مجس استمرارية الجلسة نفسها من Claude Sonnet إلى Opus عندما يدعم النموذج المحدد هدف تبديل. تعطل وصفات Docker هذا افتراضيًا لزيادة موثوقية التجميع.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` للاشتراك في مجس MCP/الأداة عبر loopback. تعطل وصفات Docker هذا افتراضيًا ما لم يُطلب صراحةً.

مثال:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

فحص سريع رخيص لتكوين Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

لا يطلب هذا من Gemini توليد استجابة. إنه يكتب إعدادات النظام نفسها
التي يعطيها OpenClaw إلى Gemini، ثم يشغّل `gemini --debug mcp list` لإثبات أن خادمًا محفوظًا
بقيمة `transport: "streamable-http"` تتم تسويته إلى شكل HTTP MCP الخاص بـ Gemini
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

- يوجد مشغّل Docker في `scripts/test-live-cli-backend-docker.sh`.
- يشغّل فحص خلفية CLI المباشر السريع داخل صورة Docker الخاصة بالمستودع كمستخدم `node` غير root.
- يحل بيانات فحص CLI الوصفية من Plugin المالكة، ثم يثبت حزمة CLI المطابقة على Linux (`@anthropic-ai/claude-code` أو `@openai/codex` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزنة مؤقتًا عند `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` OAuth محمولًا لاشتراك Claude Code من خلال إما `~/.claude/.credentials.json` مع `claudeAiOauth.subscriptionType` أو `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. يثبت أولًا `claude -p` المباشر في Docker، ثم يشغّل دورتين لخلفية CLI في Gateway دون الاحتفاظ بمتغيرات env الخاصة بمفتاح Anthropic API. يعطل مسار الاشتراك هذا مجسات Claude MCP/الأداة والصورة افتراضيًا لأن Claude يوجّه حاليًا استخدام تطبيقات الطرف الثالث عبر فوترة استخدام إضافية بدلًا من حدود خطة الاشتراك العادية.
- يمارس فحص خلفية CLI المباشر السريع الآن التدفق الكامل نفسه من البداية إلى النهاية لـ Claude وCodex وGemini: دورة نصية، ثم دورة تصنيف صورة، ثم استدعاء أداة `cron` في MCP يتم التحقق منه عبر CLI في Gateway.
- يقوم فحص Claude الافتراضي السريع أيضًا بتصحيح الجلسة من Sonnet إلى Opus ويتحقق من أن الجلسة المستأنفة لا تزال تتذكر ملاحظة سابقة.

## مباشر: فحص ربط ACP السريع (`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط محادثة ACP الحقيقي مع وكيل ACP حي:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة قناة رسائل اصطناعية في موضعها
  - إرسال متابعة عادية في تلك المحادثة نفسها
  - التحقق من وصول المتابعة إلى نص جلسة ACP المربوطة
- التفعيل:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- الافتراضيات:
  - وكلاء ACP في Docker: `claude,codex,gemini`
  - وكيل ACP للتشغيل المباشر `pnpm test:live ...`: `claude`
  - القناة الاصطناعية: سياق محادثة بنمط رسائل Slack المباشرة
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
  - يستخدم هذا المسار سطح `chat.send` في Gateway مع حقول مسار منشأ اصطناعية مخصصة للمسؤول فقط، بحيث تستطيع الاختبارات إرفاق سياق قناة رسائل دون التظاهر بالتسليم خارجيًا.
  - عندما لا تكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` مضبوطة، يستخدم الاختبار سجل الوكلاء المدمج في Plugin `acpx` المضمن لوكيل أداة اختبار ACP المحدد.
  - إنشاء MCP عبر cron للجلسة المربوطة يبذل أفضل جهد افتراضيًا لأن أدوات اختبار ACP الخارجية يمكن أن تلغي استدعاءات MCP بعد اجتياز إثبات الربط/الصورة؛ اضبط `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` لجعل فحص cron بعد الربط صارمًا.

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
- افتراضيًا، يشغّل فحص ACP bind smoke على وكلاء CLI الحية المجمعة بالتسلسل: `claude`، ثم `codex`، ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` لتضييق المصفوفة.
- يحمّل `~/.profile`، ويجهّز مواد مصادقة CLI المطابقة داخل الحاوية، ثم يثبّت CLI الحية المطلوبة (`@anthropic-ai/claude-code` أو `@openai/codex` أو Factory Droid عبر `https://app.factory.ai/cli` أو `@google/gemini-cli` أو `opencode-ai`) إذا كانت مفقودة. خلفية ACP نفسها هي حزمة `acpx/runtime` المضمنة من Plugin `acpx` الرسمي.
- يجهّز متغير Docker الخاص بـ Droid المسار `~/.factory` للإعدادات، ويمرر `FACTORY_API_KEY`، ويتطلب مفتاح API هذا لأن مصادقة Factory OAuth/سلسلة المفاتيح المحلية غير قابلة للنقل إلى الحاوية. يستخدم إدخال السجل المدمج في ACPX وهو `droid exec --output-format acp`.
- متغير Docker الخاص بـ OpenCode هو مسار انحدار صارم لوكيل واحد. يكتب نموذجًا افتراضيًا مؤقتًا في `OPENCODE_CONFIG_CONTENT` من `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (الافتراضي `opencode/kimi-k2.6`) بعد تحميل `~/.profile`، ويتطلب `pnpm test:docker:live-acp-bind:opencode` نص مساعد مربوطًا بدلًا من قبول التخطي العام بعد الربط.
- استدعاءات CLI المباشرة لـ `acpx` هي مسار يدوي/التفاف فقط لمقارنة السلوك خارج Gateway. يفحص ACP bind smoke في Docker خلفية وقت تشغيل `acpx` المضمنة في OpenClaw.

## مباشر: فحص smoke لأداة اختبار خادم تطبيق Codex

- الهدف: التحقق من أداة اختبار Codex المملوكة للـ Plugin عبر طريقة Gateway العادية
  `agent`:
  - تحميل Plugin `codex` المضمن
  - تحديد `OPENCLAW_AGENT_RUNTIME=codex`
  - إرسال أول دورة وكيل عبر Gateway إلى `openai/gpt-5.5` مع فرض أداة اختبار Codex
  - إرسال دورة ثانية إلى جلسة OpenClaw نفسها والتحقق من قدرة خيط app-server
    على الاستئناف
  - تشغيل `/codex status` و`/codex models` عبر مسار أمر Gateway نفسه
  - اختياريًا تشغيل فحصين لأوامر shell ذات تصعيد راجعها Guardian: أمر حميد
    يجب قبوله، ورفع سر زائف يجب رفضه بحيث يسأل الوكيل مجددًا
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الافتراضي: `openai/gpt-5.5`
- فحص صورة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- فحص MCP/أداة اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- فحص Guardian اختياري: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- يضبط smoke قيمة `OPENCLAW_AGENT_HARNESS_FALLBACK=none` بحيث لا تستطيع أداة اختبار Codex
  المعطلة النجاح عبر الرجوع بصمت إلى PI.
- المصادقة: مصادقة خادم تطبيق Codex من تسجيل دخول اشتراك Codex المحلي. يمكن لفحوص Docker
  أيضًا توفير `OPENAI_API_KEY` لفحوص غير Codex عند الاقتضاء،
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

- يوجد مشغل Docker في `scripts/test-live-codex-harness-docker.sh`.
- يحمّل `~/.profile` المثبت، ويمرر `OPENAI_API_KEY`، وينسخ ملفات مصادقة Codex CLI
  عند وجودها، ويثبّت `@openai/codex` في بادئة npm مثبتة قابلة للكتابة،
  ويجهّز شجرة المصدر، ثم يشغّل اختبار Codex-harness الحي فقط.
- يفعّل Docker فحوص الصورة وMCP/الأداة وGuardian افتراضيًا. اضبط
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` عندما تحتاج إلى تشغيل تصحيح أضيق.
- يصدّر Docker أيضًا `OPENCLAW_AGENT_HARNESS_FALLBACK=none`، بما يطابق إعداد الاختبار الحي
  بحيث لا تستطيع الأسماء المستعارة القديمة أو الرجوع إلى PI إخفاء
  انحدار في أداة اختبار Codex.

### الوصفات الحية الموصى بها

قوائم السماح الضيقة والصريحة هي الأسرع والأقل تقلبًا:

- نموذج واحد، مباشر (بلا Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- نموذج واحد، فحص smoke عبر Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة موفرين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- تركيز Google (مفتاح Gemini API + Antigravity):
  - Gemini (مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- فحص smoke للتفكير التكيفي في Google:
  - إذا كانت المفاتيح المحلية موجودة في ملف تعريف shell: `source ~/.profile`
  - الافتراضي الديناميكي لـ Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - ميزانية Gemini 2.5 الديناميكية: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

ملاحظات:

- يستخدم `google/...` واجهة Gemini API (مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity OAuth (نقطة نهاية وكيل بنمط Cloud Code Assist).
- يستخدم `google-gemini-cli/...` Gemini CLI المحلي على جهازك (مصادقة منفصلة وخصوصيات أدوات).
- Gemini API مقابل Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP (مفتاح API / مصادقة ملف تعريفي)؛ هذا ما يعنيه معظم المستخدمين عند قولهم “Gemini”.
  - CLI: يشغّل OpenClaw ملف `gemini` ثنائيًا محليًا عبر shell؛ لديه مصادقته الخاصة وقد يتصرف بصورة مختلفة (دعم البث/الأدوات/اختلاف الإصدارات).

## مباشر: مصفوفة النماذج (ما نغطيه)

لا توجد "قائمة نماذج CI" ثابتة (التشغيل الحي اختياري)، لكن هذه هي النماذج **الموصى بها** لتغطيتها بانتظام على جهاز تطوير يحتوي على مفاتيح.

### مجموعة smoke حديثة (استدعاء الأدوات + الصورة)

هذا هو تشغيل “النماذج الشائعة” الذي نتوقع أن يظل عاملًا:

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

### خط الأساس: استدعاء الأدوات (Read + Exec اختياري)

اختر واحدًا على الأقل لكل عائلة موفرين:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (أو `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (أو `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

تغطية إضافية اختيارية (من الجيد وجودها):

- xAI: `xai/grok-4.3` (أو أحدث متاح)
- Mistral: `mistral/`… (اختر نموذجًا واحدًا قادرًا على “الأدوات” ومفعّلًا لديك)
- Cerebras: `cerebras/`… (إذا كان لديك وصول)
- LM Studio: `lmstudio/`… (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### الرؤية: إرسال صورة (مرفق ← رسالة متعددة الوسائط)

ضمّن نموذجًا واحدًا على الأقل قادرًا على الصور في `OPENCLAW_LIVE_GATEWAY_MODELS` (متغيرات Claude/Gemini/OpenAI القادرة على الرؤية، إلخ) لتشغيل فحص الصورة.

### المجمّعات / بوابات بديلة

إذا كانت لديك مفاتيح مفعّلة، ندعم أيضًا الاختبار عبر:

- OpenRouter: `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على مرشحين قادرين على الأدوات+الصورة)
- OpenCode: `opencode/...` لـ Zen و`opencode-go/...` لـ Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

موفرون إضافيون يمكنك تضمينهم في المصفوفة الحية (إذا كانت لديك بيانات اعتماد/إعدادات):

- مدمج: `openai`، `openai-codex`، `anthropic`، `google`، `google-vertex`، `google-antigravity`، `google-gemini-cli`، `zai`، `openrouter`، `opencode`، `opencode-go`، `xai`، `groq`، `cerebras`، `mistral`، `github-copilot`
- عبر `models.providers` (نقاط نهاية مخصصة): `minimax` (cloud/API)، إضافة إلى أي وسيط متوافق مع OpenAI/Anthropic (LM Studio، vLLM، LiteLLM، إلخ)

<Tip>
لا ترمّز "كل النماذج" بشكل ثابت في الوثائق. القائمة الموثوقة هي كل ما تعيده `discoverModels(...)` على جهازك إضافة إلى المفاتيح المتاحة.
</Tip>

## بيانات الاعتماد (لا تودعها أبدًا)

تكتشف الاختبارات الحية بيانات الاعتماد بالطريقة نفسها التي يفعل بها CLI. الآثار العملية:

- إذا كان CLI يعمل، فينبغي للاختبارات الحية أن تعثر على المفاتيح نفسها.
- إذا قال اختبار حي “no creds”، فصحّح المشكلة بالطريقة نفسها التي تصحّح بها `openclaw models list` / اختيار النموذج.

- ملفات تعريف المصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (هذا هو المقصود بـ “profile keys” في الاختبارات الحية)
- التكوين: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة القديم: `~/.openclaw/credentials/` (يُنسخ إلى المنزل الحي المرحلي عند وجوده، لكنه ليس مخزن مفاتيح ملف التعريف الرئيسي)
- تنسخ التشغيلات المحلية الحية افتراضياً التكوين النشط، وملفات `auth-profiles.json` لكل وكيل، و`credentials/` القديمة، وأدلة مصادقة CLI الخارجية المدعومة إلى منزل اختبار مؤقت؛ تتخطى المنازل الحية المرحلية `workspace/` و`sandboxes/`، وتُزال تجاوزات مسارات `agents.*.workspace` / `agentDir` حتى تبقى المجسات بعيدة عن مساحة عمل مضيفك الحقيقية.

إذا أردت الاعتماد على مفاتيح البيئة (مثلاً المصدّرة في `~/.profile` لديك)، فشغّل الاختبارات المحلية بعد `source ~/.profile`، أو استخدم مشغلات Docker أدناه (يمكنها تركيب `~/.profile` داخل الحاوية).

## Deepgram الحي (تفريغ الصوت)

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
  - يمرّن مسارات الصور والفيديو و`music_generate` المضمّنة في comfy
  - يتخطى كل قدرة ما لم يكن `plugins.entries.comfy.config.<capability>` مكوّناً
  - مفيد بعد تغيير إرسال سير عمل comfy، أو الاستقصاء، أو التنزيلات، أو تسجيل Plugin

## توليد الصور الحي

- الاختبار: `test/image-generation.runtime.live.test.ts`
- الأمر: `pnpm test:live test/image-generation.runtime.live.test.ts`
- الحاضنة: `pnpm test:live:media image`
- النطاق:
  - يحصي كل Plugin مزود لتوليد الصور مسجّل
  - يحمّل متغيرات بيئة المزود الناقصة من صدفة تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضياً، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزودين الذين لا يملكون مصادقة/ملف تعريف/نموذجاً قابلاً للاستخدام
  - يشغّل كل مزود مكوّن عبر وقت تشغيل توليد الصور المشترك:
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

لمسار CLI المشحون، أضف فحص `infer` سريعاً بعد نجاح اختبار المزود/وقت التشغيل الحي:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

يغطي هذا تحليل وسائط CLI، وحلّ التكوين/الوكيل الافتراضي، وتنشيط
Plugin المضمّن، ووقت تشغيل توليد الصور المشترك، وطلب المزود الحي.
من المتوقع أن تكون تبعيات Plugin موجودة قبل تحميل وقت التشغيل.

## توليد الموسيقى الحي

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- الحاضنة: `pnpm test:live:media music`
- النطاق:
  - يمرّن مسار مزود توليد الموسيقى المضمّن المشترك
  - يشمل حالياً Google وMiniMax
  - يحمّل متغيرات بيئة المزود من صدفة تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضياً، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزودين الذين لا يملكون مصادقة/ملف تعريف/نموذجاً قابلاً للاستخدام
  - يشغّل نمطي وقت التشغيل المعلنين كليهما عند توفرهما:
    - `generate` بإدخال قائم على الموجّه فقط
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
- الحاضنة: `pnpm test:live:media video`
- النطاق:
  - يمرّن مسار مزود توليد الفيديو المضمّن المشترك
  - يتجه افتراضياً إلى مسار الفحص السريع الآمن للإصدار: مزودون غير FAL، وطلب تحويل نص إلى فيديو واحد لكل مزود، وموجّه جراد بحر مدته ثانية واحدة، وحد أقصى للعملية لكل مزود من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` افتراضياً)
  - يتخطى FAL افتراضياً لأن زمن انتظار الطابور من جهة المزود قد يهيمن على وقت الإصدار؛ مرّر `--video-providers fal` أو `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` لتشغيله صراحةً
  - يحمّل متغيرات بيئة المزود من صدفة تسجيل الدخول لديك (`~/.profile`) قبل الفحص
  - يستخدم مفاتيح API الحية/البيئية قبل ملفات تعريف المصادقة المخزنة افتراضياً، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزودين الذين لا يملكون مصادقة/ملف تعريف/نموذجاً قابلاً للاستخدام
  - يشغّل `generate` فقط افتراضياً
  - اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضاً عند توفرها:
    - `imageToVideo` عندما يعلن المزود `capabilities.imageToVideo.enabled` ويقبل المزود/النموذج المحدد إدخال صورة محلية مدعوماً بمخزن مؤقت في المسح المشترك
    - `videoToVideo` عندما يعلن المزود `capabilities.videoToVideo.enabled` ويقبل المزود/النموذج المحدد إدخال فيديو محلياً مدعوماً بمخزن مؤقت في المسح المشترك
  - مزودو `imageToVideo` المعلنون لكن المتخطّون حالياً في المسح المشترك:
    - `vydra` لأن `veo3` المضمّن نصّي فقط، و`kling` المضمّن يتطلب عنوان URL لصورة بعيدة
  - تغطية Vydra الخاصة بالمزود:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل ذلك الملف `veo3` لتحويل النص إلى فيديو بالإضافة إلى مسار `kling` يستخدم تثبيت عنوان URL لصورة بعيدة افتراضياً
  - تغطية `videoToVideo` الحية الحالية:
    - `runway` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`
  - مزودو `videoToVideo` المعلنون لكن المتخطّون حالياً في المسح المشترك:
    - `alibaba`, `qwen`, `xai` لأن تلك المسارات تتطلب حالياً عناوين URL مرجعية بعيدة بصيغة `http(s)` / MP4
    - `google` لأن مسار Gemini/Veo المشترك الحالي يستخدم إدخالاً محلياً مدعوماً بمخزن مؤقت، وهذا المسار غير مقبول في المسح المشترك
    - `openai` لأن المسار المشترك الحالي يفتقر إلى ضمانات وصول خاصة بالمؤسسة لطلاء/إعادة مزج الفيديو
- تضييق اختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل مزود في المسح الافتراضي، بما في ذلك FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل حد عملية كل مزود في فحص سريع صارم
- سلوك مصادقة اختياري:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض مصادقة مخزن ملفات التعريف وتجاهل التجاوزات المعتمدة على البيئة فقط

## حاضنة الوسائط الحية

- الأمر: `pnpm test:live:media`
- الغرض:
  - تشغّل مجموعات الصور والموسيقى والفيديو الحية المشتركة عبر نقطة دخول أصلية للمستودع واحدة
  - تحمّل تلقائياً متغيرات بيئة المزود الناقصة من `~/.profile`
  - تضيّق تلقائياً كل مجموعة إلى المزودين الذين لديهم حالياً مصادقة قابلة للاستخدام افتراضياً
  - تعيد استخدام `scripts/test-live.mjs`، لذلك يبقى سلوك Heartbeat ووضع الهدوء متسقاً
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ذو صلة

- [الاختبار](/ar/help/testing) — مجموعات اختبارات الوحدة والتكامل وQA وDocker
