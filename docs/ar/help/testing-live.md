---
read_when:
    - تشغيل اختبارات الدخان الحية لمصفوفة النماذج / الواجهة الخلفية لـ CLI / ACP / موفّر الوسائط
    - تصحيح أخطاء تحديد بيانات اعتماد الاختبار المباشر
    - إضافة اختبار مباشر جديد خاص بموفّر معيّن
sidebarTitle: Live tests
summary: 'الاختبارات المباشرة (التي تتصل بالشبكة): مصفوفة النماذج، والواجهات الخلفية لـ CLI، وACP، وموفرو الوسائط، وبيانات الاعتماد'
title: 'الاختبار: مجموعات الاختبارات المباشرة'
x-i18n:
    generated_at: "2026-07-12T06:05:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

للبدء السريع، ومشغّلات ضمان الجودة، وحزم اختبارات الوحدة/التكامل، ومسارات Docker، راجع
[الاختبار](/ar/help/testing). تتناول هذه الصفحة الاختبارات **المباشرة** (التي تتصل بالشبكة):
مصفوفة النماذج، وواجهات CLI الخلفية، وACP، وموفّري الوسائط، والتعامل مع بيانات الاعتماد.

## مباشر: أوامر التحقق السريع المحلية

صدّر مفتاح الموفّر المطلوب في بيئة العملية قبل إجراء عمليات التحقق المباشرة
المخصصة.

تحقق سريع آمن من الوسائط:

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

يُجري `voicecall smoke` تشغيلًا تجريبيًا ما لم يكن `--yes` موجودًا أيضًا؛ استخدم `--yes` فقط
عندما تنوي إجراء مكالمة فعلية. بالنسبة إلى Twilio وTelnyx وPlivo، يتطلب
فحص الجاهزية الناجح عنوان URL عامًا لـ webhook؛ وتُرفض عناوين URL الخاصة/المحلية
لواجهة local loopback لأن هؤلاء الموفّرين لا يستطيعون الوصول إليها.

## مباشر: فحص شامل لإمكانات Node على Android

- الاختبار: `src/gateway/android-node.capabilities.live.test.ts`
- البرنامج النصي: `pnpm android:test:integration`
- الهدف: استدعاء **كل أمر مُعلن حاليًا** بواسطة Node متصل على Android والتحقق من سلوك عقد الأمر.
- النطاق:
  - إعداد يدوي/مشروط مسبقًا (لا تثبّت الحزمة التطبيق ولا تشغّله ولا تقرنه).
  - التحقق أمرًا بأمر من `node.invoke` في Gateway لعنصر Node المحدد على Android.
- الإعداد المسبق المطلوب:
  - أن يكون تطبيق Android متصلًا ومقترنًا بالفعل بـ Gateway.
  - إبقاء التطبيق في الواجهة الأمامية.
  - منح الأذونات/الموافقة على الالتقاط للإمكانات التي تتوقع نجاحها.
- تجاوزات الهدف الاختيارية:
  - `OPENCLAW_ANDROID_NODE_ID` أو `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- تفاصيل إعداد Android الكاملة: [تطبيق Android](/ar/platforms/android)

## مباشر: تحقق سريع من النماذج (مفاتيح ملفات التعريف)

تنقسم اختبارات النماذج المباشرة إلى طبقتين لعزل حالات الفشل:

- يوضح "النموذج المباشر" ما إذا كان الموفّر/النموذج قادرًا أصلًا على الإجابة باستخدام المفتاح المعطى.
- يوضح "التحقق السريع من Gateway" ما إذا كان مسار Gateway والوكيل الكامل يعمل مع ذلك النموذج (الجلسات، والسجل، والأدوات، وسياسة وضع الحماية، وما إلى ذلك).

توجد قوائم النماذج المنسّقة أدناه في `src/agents/live-model-filter.ts` وتتغير
بمرور الوقت؛ تعامل مع المصفوفات الموجودة هناك بوصفها مصدر الحقيقة، وليس هذه
الصفحة.

يستخدم MiniMax M3 المرجع `minimax/MiniMax-M3` مرجعًا افتراضيًا للموفّر/النموذج.

### الطبقة 1: إكمال النموذج المباشر (من دون Gateway)

- الاختبار: `src/agents/models.profiles.live.test.ts`
- الهدف:
  - تعداد النماذج المكتشفة
  - استخدام `getApiKeyForModel` لتحديد النماذج التي لديك بيانات اعتماد لها
  - تشغيل إكمال صغير لكل نموذج (واختبارات انحدار مستهدفة عند الحاجة)
- كيفية التمكين:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرةً)
  - اضبط `OPENCLAW_LIVE_MODELS=modern` أو `small` أو `all` (اسم بديل لـ `modern`) لتشغيل هذه الحزمة فعليًا؛ وإلا فسيتم تخطيها، بحيث يظل `pnpm test:live` بمفرده مركّزًا على التحقق السريع من Gateway.
- كيفية تحديد النماذج:
  - يشغّل `OPENCLAW_LIVE_MODELS=modern` قائمة الأولوية المنسّقة عالية الدلالة (راجع [مباشر: مصفوفة النماذج](#live-model-matrix-what-we-cover))
  - يشغّل `OPENCLAW_LIVE_MODELS=small` قائمة أولوية النماذج الصغيرة المنسّقة
  - يمثّل `OPENCLAW_LIVE_MODELS=all` اسمًا بديلًا لـ `modern`
  - أو `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (قائمة سماح مفصولة بفواصل)
  - تستخدم عمليات تشغيل نماذج Ollama الصغيرة المحلية `http://127.0.0.1:11434` افتراضيًا؛ اضبط `OPENCLAW_LIVE_OLLAMA_BASE_URL` فقط لنقاط نهاية الشبكة المحلية أو المخصصة أو Ollama Cloud.
  - تستخدم عمليات الفحص الشاملة الحديثة/الكل والصغيرة طول قائمتها المنسّقة حدًا أقصى افتراضيًا؛ اضبط `OPENCLAW_LIVE_MAX_MODELS=0` لإجراء فحص شامل لملف التعريف المحدد أو رقمًا موجبًا لحد أقصى أصغر.
  - تستخدم عمليات الفحص الشاملة `OPENCLAW_LIVE_TEST_TIMEOUT_MS` لمهلة اختبار النموذج المباشر بالكامل. القيمة الافتراضية: 60 دقيقة.
  - تعمل اختبارات النموذج المباشر بتوازٍ قدره 20 افتراضيًا؛ اضبط `OPENCLAW_LIVE_MODEL_CONCURRENCY` لتجاوز ذلك.
- كيفية تحديد الموفّرين:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (قائمة سماح مفصولة بفواصل)
- مصدر المفاتيح:
  - افتراضيًا: مخزن ملفات التعريف والبدائل الاحتياطية من البيئة
  - اضبط `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض استخدام **مخزن ملفات التعريف** فقط
- سبب وجود هذا:
  - يفصل بين "واجهة API للموفّر معطلة / المفتاح غير صالح" و"مسار وكيل Gateway معطل"
  - يحتوي على اختبارات انحدار صغيرة ومعزولة (مثال: إعادة تشغيل الاستدلال في OpenAI Responses/Codex Responses ومسارات استدعاء الأدوات)

### الطبقة 2: تحقق سريع من Gateway + وكيل التطوير (ما يفعله "@openclaw" فعليًا)

- الاختبار: `src/gateway/gateway-models.profiles.live.test.ts`
- الهدف:
  - تشغيل Gateway داخل العملية
  - إنشاء/تصحيح جلسة `agent:dev:*` (تجاوز النموذج في كل تشغيل)
  - التكرار على النماذج ذات المفاتيح والتحقق مما يلي:
    - استجابة "ذات معنى" (من دون أدوات)
    - عمل استدعاء فعلي لأداة (اختبار قراءة)
    - اختبارات أدوات إضافية اختيارية (اختبار تنفيذ+قراءة)
    - استمرار عمل مسارات انحدار OpenAI (استدعاء أداة فقط -> متابعة)
- تفاصيل الاختبارات (لتتمكن من تفسير حالات الفشل بسرعة):
  - اختبار `read`: يكتب الاختبار ملف nonce في مساحة العمل ويطلب من الوكيل `read` قراءته وإعادة قيمة nonce.
  - اختبار `exec+read`: يطلب الاختبار من الوكيل استخدام `exec` لكتابة قيمة nonce في ملف مؤقت، ثم استخدام `read` لقراءتها.
  - اختبار الصورة: يُرفق الاختبار صورة PNG مُنشأة (قطة + رمز عشوائي) ويتوقع من النموذج إرجاع `cat <CODE>`.
  - مرجع التنفيذ: `src/gateway/gateway-models.profiles.live.test.ts` و`test/helpers/live-image-probe.ts`.
- كيفية التمكين:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرةً)
- كيفية تحديد النماذج:
  - الافتراضي: قائمة الأولوية المنسّقة عالية الدلالة (`modern`)
  - يشغّل `OPENCLAW_LIVE_GATEWAY_MODELS=small` قائمة النماذج الصغيرة المنسّقة عبر مسار Gateway والوكيل الكامل
  - يمثّل `OPENCLAW_LIVE_GATEWAY_MODELS=all` اسمًا بديلًا لـ `modern`
  - أو اضبط `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (أو قائمة مفصولة بفواصل) لتضييق النطاق
  - تستخدم عمليات فحص Gateway الحديثة/الكل والصغيرة طول قائمتها المنسّقة حدًا أقصى افتراضيًا؛ اضبط `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` لإجراء فحص شامل للتحديد أو رقمًا موجبًا لحد أقصى أصغر.
- كيفية تحديد الموفّرين (تجنب "كل شيء عبر OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (قائمة سماح مفصولة بفواصل)
- تكون اختبارات الأدوات والصور مفعّلة دائمًا في هذا الاختبار المباشر:
  - اختبار `read` + اختبار `exec+read` (إجهاد الأدوات)
  - يعمل اختبار الصورة عندما يعلن النموذج دعم إدخال الصور
  - المسار (على مستوى عالٍ):
    - ينشئ الاختبار صورة PNG صغيرة تحتوي على "CAT" + رمز عشوائي (`test/helpers/live-image-probe.ts`)
    - يرسلها عبر `agent` باستخدام `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - يحلل Gateway المرفقات إلى `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - يمرر الوكيل المضمّن رسالة مستخدم متعددة الوسائط إلى النموذج
    - التحقق: تحتوي الاستجابة على `cat` + الرمز (تسامح التعرّف الضوئي على الحروف: يُسمح بالأخطاء البسيطة)

<Tip>
لمعرفة ما يمكنك اختباره على جهازك (ومعرّفات `provider/model` الدقيقة)، شغّل:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## مباشر: تحقق سريع من واجهة CLI الخلفية (Claude أو Gemini أو واجهات CLI محلية أخرى)

- الاختبار: `src/gateway/gateway-cli-backend.live.test.ts`
- الهدف: التحقق من مسار Gateway والوكيل باستخدام واجهة CLI خلفية محلية، من دون المساس بإعداداتك الافتراضية.
- توجد الإعدادات الافتراضية للتحقق السريع الخاصة بكل واجهة خلفية ضمن تعريف `cli-backend.ts` الخاص بالـ Plugin المالكة.
- التمكين:
  - `pnpm test:live` (أو `OPENCLAW_LIVE_TEST=1` إذا كنت تستدعي Vitest مباشرةً)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- الإعدادات الافتراضية:
  - الموفّر/النموذج الافتراضي: `claude-cli/claude-sonnet-4-6`
  - يأتي سلوك الأمر/الوسائط/الصور من بيانات Plugin الوصفية للواجهة الخلفية المالكة.
- التجاوزات (اختيارية):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` لإرسال مرفق صورة حقيقي (تُحقن المسارات في الموجّه). معطل افتراضيًا في وصفات Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` لتمرير مسارات ملفات الصور كوسائط CLI بدلًا من حقنها في الموجّه.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (أو `"list"`) للتحكم في كيفية تمرير وسائط الصور عند ضبط `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` لإرسال دورة ثانية والتحقق من مسار الاستئناف.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` للاشتراك في اختبار استمرارية الجلسة نفسها عند التبديل من Claude Sonnet إلى Opus، عندما يدعم النموذج المحدد هدف تبديل. معطل افتراضيًا، بما في ذلك وصفات Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` للاشتراك في اختبار MCP/حلقة الأدوات عبر local loopback. معطل افتراضيًا في وصفات Docker.

مثال:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

تحقق سريع منخفض التكلفة من إعدادات Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

لا يطلب هذا من Gemini إنشاء استجابة. بل يكتب إعدادات النظام نفسها التي
يوفرها OpenClaw إلى Gemini، ثم يشغّل `gemini --debug mcp list` لإثبات أن خادمًا
محفوظًا بقيمة `transport: "streamable-http"` تُطبّع بنيته إلى صيغة HTTP MCP الخاصة بـ Gemini
ويمكنه الاتصال بخادم MCP محلي يستخدم HTTP القابل للبث.

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
- يشغّل التحقق السريع المباشر لواجهة CLI الخلفية داخل صورة Docker للمستودع بصفة المستخدم `node` غير الجذر.
- يحل بيانات التحقق السريع الوصفية لـ CLI من Plugin المالكة، ثم يثبّت حزمة CLI المطابقة لنظام Linux (`@anthropic-ai/claude-code` أو `@google/gemini-cli`) في بادئة قابلة للكتابة ومخزّنة مؤقتًا في `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (الافتراضي: `~/.cache/openclaw/docker-cli-tools`).
- لم تعد `codex-cli` واجهة CLI خلفية مضمّنة؛ استخدم `openai/*` مع وقت تشغيل خادم تطبيق Codex بدلًا منها (راجع [مباشر: تحقق سريع من عدة خادم تطبيق Codex](#live-codex-app-server-harness-smoke)).
- يتطلب `pnpm test:docker:live-cli-backend:claude-subscription` مصادقة OAuth محمولة لاشتراك Claude Code، إما عبر `~/.claude/.credentials.json` الذي يحتوي على `claudeAiOauth.subscriptionType` أو عبر `CLAUDE_CODE_OAUTH_TOKEN` من `claude setup-token`. يثبت أولًا عمل `claude -p` مباشرةً داخل Docker، ثم يشغّل دورتين لواجهة CLI الخلفية في Gateway من دون الاحتفاظ بمتغيرات البيئة الخاصة بمفاتيح Anthropic API. يعطّل مسار الاشتراك هذا اختبارات Claude الخاصة بـ MCP/الأدوات والصور افتراضيًا لأنه يستهلك حدود استخدام الاشتراك المسجّل، ويمكن لـ Anthropic تغيير سلوك الفوترة وحدود المعدل في Claude Agent SDK / `claude -p` من دون إصدار OpenClaw.
- يدعم Claude وGemini مجموعة الاختبارات نفسها (دورة نصية، وتصنيف صورة، واستدعاء أداة MCP `cron`، واستمرارية تبديل النموذج) عبر العلامات أعلاه، لكن لا يعمل أي منها افتراضيًا؛ اشترك في كل اختبار عبر علامته عند الحاجة.

## مباشر: إمكانية الوصول إلى وكيل APNs عبر HTTP/2

- الاختبار: `src/infra/push-apns-http2.live.test.ts`
- الهدف: إنشاء نفق عبر وكيل HTTP CONNECT محلي إلى نقطة نهاية APNs التجريبية من Apple، وإرسال طلب التحقق من APNs عبر HTTP/2، والتحقق من عودة استجابة Apple الفعلية `403 InvalidProviderToken` عبر مسار الوكيل.
- التمكين:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- المهلة الاختيارية:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## مباشر: تحقق سريع من ربط ACP ‏(`/acp spawn ... --bind here`)

- الاختبار: `src/gateway/gateway-acp-bind.live.test.ts`
- الهدف: التحقق من تدفق ربط محادثة ACP الحقيقي باستخدام وكيل ACP مباشر:
  - إرسال `/acp spawn <agent> --bind here`
  - ربط محادثة اصطناعية لقناة رسائل في موضعها
  - إرسال متابعة عادية في المحادثة نفسها
  - التحقق من وصول المتابعة إلى نص جلسة ACP المرتبطة
- التمكين:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- الإعدادات الافتراضية:
  - وكلاء ACP في Docker: `claude,codex,gemini`
  - وكيل ACP للتشغيل المباشر عبر `pnpm test:live ...`: `claude`
  - القناة الاصطناعية: سياق محادثة بنمط الرسائل المباشرة في Slack
  - الواجهة الخلفية لـ ACP: `acpx`
- التجاوزات:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (أو `on`/`true`/`yes`) لفرض تشغيل مسبار الصور؛ وأي قيمة أخرى تفرض إيقافه. يعمل افتراضيًا لكل وكيل باستثناء `opencode`.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- ملاحظات:
  - يستخدم هذا المسار واجهة `chat.send` الخاصة بـ Gateway مع حقول مسار منشأ اصطناعية مقتصرة على المسؤولين، كي تتمكن الاختبارات من إرفاق سياق قناة الرسائل دون التظاهر بالتسليم خارجيًا.
  - عندما لا يكون `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` معيّنًا، يستخدم الاختبار سجل الوكلاء المضمّن في Plugin ‏`acpx` لوكيل حزمة اختبار ACP المحدد.
  - يُنشأ Cron ‏MCP للجلسة المرتبطة بأفضل جهد افتراضيًا، لأن حزم اختبار ACP الخارجية قد تلغي استدعاءات MCP بعد اجتياز إثبات الربط/الصورة؛ عيّن `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` لجعل مسبار Cron اللاحق للربط صارمًا.

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
- افتراضيًا، يشغّل اختبار ربط ACP السريع على وكلاء CLI المباشرين المجمّعين بالتتابع: `claude`، ثم `codex`، ثم `gemini`.
- استخدم `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` أو `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` لتضييق المصفوفة.
- يجهّز مواد مصادقة CLI المطابقة داخل الحاوية، ثم يثبّت CLI المباشر المطلوب (`@anthropic-ai/claude-code` أو `@openai/codex` أو Factory Droid عبر `https://app.factory.ai/cli` أو `@google/gemini-cli` أو `opencode-ai`) إن لم يكن موجودًا. أما الواجهة الخلفية لـ ACP نفسها فهي حزمة `acpx/runtime` المضمّنة من Plugin ‏`acpx` الرسمي.
- يجهّز متغير Docker الخاص بـ Droid المسار `~/.factory` للإعدادات، ويمرر `FACTORY_API_KEY`، ويتطلب مفتاح API هذا لأن مصادقة Factory المحلية عبر OAuth/حلقة المفاتيح لا يمكن نقلها إلى الحاوية. وهو يستخدم إدخال السجل المضمّن في ACPX ‏`droid exec --output-format acp`.
- متغير Docker الخاص بـ OpenCode هو مسار انحدار صارم لوكيل واحد. يكتب نموذجًا افتراضيًا مؤقتًا في `OPENCODE_CONFIG_CONTENT` من `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (القيمة الافتراضية `opencode/kimi-k2.6`).
- استدعاءات CLI المباشرة لـ `acpx` ليست سوى مسار يدوي/التفافي لمقارنة السلوك خارج Gateway. يختبر اختبار ربط ACP السريع في Docker الواجهة الخلفية لوقت تشغيل `acpx` المضمّنة في OpenClaw.

## مباشر: اختبار سريع لحزمة Codex ‏app-server

- الهدف: التحقق من حزمة Codex المملوكة للـ Plugin عبر أسلوب Gateway المعتاد
  `agent`:
  - تحميل Plugin ‏`codex` المضمّن
  - تحديد نموذج OpenAI عبر `/model <ref> --runtime codex`
  - إرسال دورة وكيل أولى عبر Gateway بمستوى التفكير المطلوب
  - إرسال دورة ثانية إلى جلسة OpenClaw نفسها والتحقق من إمكانية استئناف
    سلسلة app-server
  - تشغيل `/codex status` و`/codex models` عبر مسار أوامر Gateway نفسه
  - اختياريًا، تشغيل مسباري shell مصعّدين راجعهما Guardian: أمر سليم
    يُفترض اعتماده، وتحميل سر زائف يُفترض رفضه كي يستوضح الوكيل من المستخدم
- الاختبار: `src/gateway/gateway-codex-harness.live.test.ts`
- التمكين: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- النموذج الأساسي لحزمة الاختبار: `openai/gpt-5.6-luna`
- القيمة الافتراضية لاختيار مفتاح OpenAI API جديد: `openai/gpt-5.6`
- التفكير الافتراضي: `low`
- تجاوز النموذج: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- تجاوز التفكير: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- تجاوز المصفوفة: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- وضع المصادقة: يستخدم `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (الافتراضي)
  بيانات تسجيل دخول Codex المنسوخة؛ ويستخدم `api-key` المتغير `OPENAI_API_KEY` عبر Codex ‏app-server.
- مسبار الصور الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- مسبار MCP/الأدوات الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- مسبار Guardian الاختياري: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- يفرض الاختبار السريع `agentRuntime.id: "codex"` لمزوّد الخدمة/النموذج، بحيث لا يمكن لحزمة Codex
  معطلة أن تنجح عبر الرجوع بصمت إلى OpenClaw.
- المصادقة: مصادقة Codex ‏app-server من تسجيل الدخول المحلي لاشتراك Codex، أو
  `OPENAI_API_KEY` عندما تكون قيمة `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key`. يمكن لـ Docker
  نسخ `~/.codex/auth.json` و`~/.codex/config.toml` لعمليات التشغيل المعتمدة على الاشتراك.

وصفة محلية:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

وصفة Docker:

```bash
pnpm test:docker:live-codex-harness
```

مصفوفة Codex الأصلية لـ GPT-5.6:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

القيمة الافتراضية لمفتاح OpenAI API جديد:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

يترك هذا الإثبات `OPENCLAW_LIVE_GATEWAY_MODELS` دون تعيين، ويحل النموذج عبر
واجهة اختيار الاستدلال للإعداد الأولي الجديد، ويتحقق من `openai/gpt-5.6`، ثم
يشغّل دورة Gateway حقيقية باستخدام ذلك النموذج المحلول.

مصفوفة OpenClaw المضمّنة لـ GPT-5.6:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

ملاحظات Docker:

- يوجد مشغّل Docker في `scripts/test-live-codex-harness-docker.sh`.
- يمرر `OPENAI_API_KEY`، وينسخ ملفات مصادقة Codex CLI عند وجودها، ويثبّت
  `@openai/codex` في بادئة npm محمولة قابلة للكتابة،
  ويجهّز شجرة المصدر، ثم يشغّل اختبار حزمة Codex المباشر فقط.
- يفعّل Docker مسبارات الصور وMCP/الأدوات وGuardian افتراضيًا. عيّن
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` أو
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` عند الحاجة إلى تشغيل تصحيح
  أضيق نطاقًا.
- يستخدم Docker إعداد وقت تشغيل Codex الصريح نفسه، لذا لا يمكن للأسماء المستعارة القديمة أو رجوع OpenClaw
  إخفاء انحدار في حزمة Codex.
- تعمل أهداف المصفوفة بالتتابع في حاوية واحدة. يضبط سكربت Docker مهلة
  الـ35 دقيقة الافتراضية وفق عدد الأهداف؛ ويجب أن تسمح أي مهلة خارجية للـshell أو CI
  بالإجمالي نفسه. يحافظ CI القياسي على كل هدف GPT-5.6 في شريحة منفصلة.

### الوصفات المباشرة الموصى بها

قوائم السماح الضيقة والصريحة هي الأسرع والأقل عرضة للأعطال المتقطعة:

- نموذج واحد، مباشر (دون Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- ملف تعريف مباشر للنماذج الصغيرة:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- ملف تعريف Gateway للنماذج الصغيرة:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- اختبار سريع لواجهة Ollama Cloud API:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- نموذج واحد، اختبار Gateway سريع:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- استدعاء الأدوات عبر عدة مزوّدين:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- اختبار مباشر سريع لـ Z.AI Coding Plan ‏GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- التركيز على Google ‏(مفتاح Gemini API + ‏Antigravity):
  - Gemini ‏(مفتاح API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity ‏(OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- اختبار سريع للتفكير التكيفي من Google ‏(`qa manual` من CLI الخاص لضمان الجودة - يتطلب `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` ونسخة مصدر؛ راجع [نظرة عامة على ضمان الجودة](/ar/concepts/qa-e2e-automation)):
  - الإعداد الافتراضي الديناميكي لـ Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - الميزانية الديناميكية لـ Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

ملاحظات:

- يستخدم `google/...` واجهة Gemini API ‏(مفتاح API).
- يستخدم `google-antigravity/...` جسر Antigravity ‏OAuth ‏(نقطة نهاية وكيل بنمط Cloud Code Assist).
- يستخدم `google-gemini-cli/...` واجهة Gemini CLI المحلية على جهازك (مصادقة منفصلة + خصائص أدوات مميزة).
- واجهة Gemini API مقارنةً بـ Gemini CLI:
  - API: يستدعي OpenClaw واجهة Gemini API المستضافة من Google عبر HTTP ‏(مفتاح API / مصادقة ملف التعريف)؛ وهذا ما يقصده معظم المستخدمين بـ "Gemini".
  - CLI: يستدعي OpenClaw ملف `gemini` التنفيذي المحلي عبر shell؛ وله مصادقته الخاصة وقد يتصرف بشكل مختلف (البث/دعم الأدوات/اختلاف الإصدارات).

## مباشر: مصفوفة النماذج (ما نغطيه)

التشغيل المباشر اختياري، لذا لا توجد «قائمة نماذج CI» ثابتة. يشغّل `OPENCLAW_LIVE_MODELS=modern` / ‏`OPENCLAW_LIVE_GATEWAY_MODELS=modern` (والاسم المستعار `all` الخاص بهما) قائمة الأولويات المنسّقة من `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` في `src/agents/live-model-filter.ts`، بترتيب الأولوية التالي:

| المزوّد/النموذج                                | ملاحظات    |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3.5-flash`                     | Gemini API |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k2.7-code`                     |            |
| `anthropic/claude-opus-4-6`                   |            |
| `deepseek/deepseek-v4-flash`                  |            |
| `deepseek/deepseek-v4-pro`                    |            |
| `minimax/MiniMax-M3`                          |            |
| `openai/gpt-5.5`                              |            |
| `openrouter/openai/gpt-5.2-chat`              |            |
| `openrouter/minimax/minimax-m2.7`             |            |
| `opencode-go/glm-5`                           |            |
| `openrouter/ai21/jamba-large-1.7`             |            |
| `xai/grok-4.5`                                |            |
| `xai/grok-4.20-0309-reasoning`                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

قائمة **النماذج الصغيرة** المنسّقة (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`)، والمأخوذة من `SMALL_LIVE_MODEL_PRIORITY`:

| المزوّد/النموذج              |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

ملاحظات حول القائمة الحديثة:

- يُستبعد المزوّدان `codex` و`codex-cli` من الفحص الحديث الافتراضي (إذ يغطيان سلوك الواجهة الخلفية لـCLI/ACP، والذي يُختبر بصورة منفصلة أعلاه). يمرّ `openai/gpt-5.5` نفسه افتراضيًا عبر عدّة اختبار خادم تطبيق Codex؛ راجع [اختبار مباشر: اختبار دخاني لعدّة خادم تطبيق Codex](#live-codex-app-server-harness-smoke).
- لا تشغّل `fireworks` و`google` و`openrouter` و`xai` في الفحص الحديث سوى معرّفات النماذج المنسّقة صراحةً (من دون توسيع تلقائي ليشمل «كل نموذج من هذا المزوّد»).
- أدرج نموذجًا واحدًا على الأقل يدعم الصور (مثل إصدارات الرؤية من عائلات Claude/Gemini/OpenAI وغيرها) في `OPENCLAW_LIVE_GATEWAY_MODELS` لتشغيل اختبار الصور الاستقصائي.

شغّل الاختبار الدخاني لـGateway باستخدام الأدوات والصور عبر مجموعة منتقاة يدويًا من مزوّدين مختلفين:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

تغطية إضافية اختيارية خارج القوائم المنسّقة (يُستحسن توفرها؛ اختر نموذجًا يدعم «الأدوات» وسبق أن فعّلته):

- Mistral:‏ `mistral/...`
- Cerebras:‏ `cerebras/...` (إذا كان لديك حق الوصول)
- LM Studio:‏ `lmstudio/...` (محلي؛ يعتمد استدعاء الأدوات على وضع API)

### المجمّعات / البوابات البديلة

إذا كانت المفاتيح مفعّلة لديك، فيمكنك أيضًا الاختبار عبر:

- OpenRouter:‏ `openrouter/...` (مئات النماذج؛ استخدم `openclaw models scan` للعثور على نماذج مرشحة تدعم الأدوات والصور)
- OpenCode:‏ `opencode/...` لخدمة Zen و`opencode-go/...` لخدمة Go (المصادقة عبر `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

مزوّدون إضافيون يمكنك تضمينهم في مصفوفة الاختبارات المباشرة (إذا كانت لديك بيانات الاعتماد/الإعدادات):

- المزوّدون المضمّنون: `anthropic` و`cerebras` و`github-copilot` و`google` و`google-antigravity` و`google-gemini-cli` و`google-vertex` و`groq` و`mistral` و`openai` و`openrouter` و`opencode` و`opencode-go` و`xai` و`zai`
- عبر `models.providers` (نقاط نهاية مخصّصة): `minimax` (السحابة/API)، بالإضافة إلى أي وكيل متوافق مع OpenAI/Anthropic ‏(LM Studio وvLLM وLiteLLM وغيرها)

<Tip>
لا تثبّت «كل النماذج» برمجيًا في الوثائق. القائمة المرجعية هي ما تُرجعه `discoverModels(...)` على جهازك، بالإضافة إلى المفاتيح المتاحة.
</Tip>

## بيانات الاعتماد (لا تُضمّنها في أي التزام برمجي)

تكتشف الاختبارات المباشرة بيانات الاعتماد بالطريقة نفسها التي تتبعها CLI. الآثار العملية لذلك:

- إذا كانت CLI تعمل، فينبغي أن تعثر الاختبارات المباشرة على المفاتيح نفسها.
- إذا أبلغ اختبار مباشر عن «عدم وجود بيانات اعتماد»، فشخّص المشكلة بالطريقة نفسها التي تتبعها لتشخيص `openclaw models list` / اختيار النموذج.

- ملفات تعريف المصادقة لكل وكيل: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (هذا هو المقصود بـ«مفاتيح ملف التعريف» في الاختبارات المباشرة)
- الإعدادات: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل OAuth القديم: `~/.openclaw/credentials/` (يُنسخ إلى المجلد الرئيسي المرحلي للاختبار المباشر عند وجوده، لكنه ليس مخزن مفاتيح ملف التعريف الرئيسي)
- تنسخ عمليات التشغيل المباشرة المحلية الإعدادات النشطة (بعد إزالة تجاوزات `agents.*.workspace` / `agentDir`) وملف `auth-profiles.json` لكل وكيل، وليس بقية دليل ذلك الوكيل، ولذلك لا تصل بيانات `workspace/` و`sandboxes/` مطلقًا إلى المجلد الرئيسي المرحلي، كما تنسخ دليل `credentials/` القديم وملفات/أدلة مصادقة CLI الخارجية المدعومة (`.claude.json` و`.claude/.credentials.json` و`.claude/settings*.json` و`.claude/backups` و`.codex/auth.json` و`.codex/config.toml` و`.gemini` و`.minimax`) إلى مجلد رئيسي مؤقت للاختبار.

إذا أردت الاعتماد على مفاتيح متغيرات البيئة، فصدّرها قبل الاختبارات المحلية أو استخدم
مشغّلات Docker أدناه مع `OPENCLAW_PROFILE_FILE` صريح.

## اختبار Deepgram المباشر (نسخ الصوت)

- الاختبار: `extensions/deepgram/audio.live.test.ts`
- التفعيل: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## الاختبار المباشر لخطة BytePlus البرمجية

- الاختبار: `extensions/byteplus/live.test.ts`
- التفعيل: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- تجاوز النموذج اختياريًا: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## الاختبار المباشر لوسائط سير عمل ComfyUI

- الاختبار: `extensions/comfy/comfy.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- النطاق:
  - يشغّل مسارات الصور والفيديو و`music_generate` المضمّنة في comfy
  - يتخطى كل قدرة ما لم يكن `plugins.entries.comfy.config.<capability>` مضبوطًا
  - يفيد بعد تغيير إرسال سير عمل comfy أو الاستقصاء الدوري أو التنزيلات أو تسجيل Plugin

## الاختبار المباشر لتوليد الصور

- الاختبار: `test/image-generation.runtime.live.test.ts`
- الأمر: `pnpm test:live test/image-generation.runtime.live.test.ts`
- عدّة الاختبار: `pnpm test:live:media image`
- النطاق:
  - يسرد كل Plugin مسجّل لمزوّد توليد الصور
  - يستخدم متغيرات بيئة المزوّد المصدّرة مسبقًا قبل الاستقصاء
  - يستخدم افتراضيًا مفاتيح API المباشرة/البيئية قبل ملفات تعريف المصادقة المخزنة، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا تتوفر لهم مصادقة/ملف تعريف/نموذج صالح للاستخدام
  - يشغّل كل مزوّد مضبوط عبر بيئة تشغيل توليد الصور المشتركة:
    - `<provider>:generate`
    - `<provider>:edit` عندما يصرّح المزوّد بدعم التحرير
- المزوّدون المضمّنون المشمولون حاليًا:
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
  - استخدم `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض المصادقة عبر مخزن ملفات التعريف وتجاهل التجاوزات المعتمدة على متغيرات البيئة وحدها

بالنسبة إلى مسار CLI الموزّع، أضف اختبارًا دخانيًا لـ`infer` بعد نجاح اختبار المزوّد/بيئة التشغيل
المباشر:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

يغطي هذا تحليل معاملات CLI، وحل إعدادات/الوكيل الافتراضي، وتفعيل
Plugin المضمّن، وبيئة تشغيل توليد الصور المشتركة، وطلب المزوّد
المباشر. يُتوقع أن تكون تبعيات Plugin موجودة قبل تحميل بيئة التشغيل.

## الاختبار المباشر لتوليد الموسيقى

- الاختبار: `extensions/music-generation-providers.live.test.ts`
- التفعيل: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- عدّة الاختبار: `pnpm test:live:media music`
- النطاق:
  - يشغّل مسار مزوّد توليد الموسيقى المشترك والمضمّن
  - يشمل حاليًا `fal` و`google` و`minimax` و`openrouter`
  - يستخدم متغيرات بيئة المزوّد المصدّرة مسبقًا قبل الاستقصاء
  - يستخدم افتراضيًا مفاتيح API المباشرة/البيئية قبل ملفات تعريف المصادقة المخزنة، حتى لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الحقيقية
  - يتخطى المزوّدين الذين لا تتوفر لهم مصادقة/ملف تعريف/نموذج صالح للاستخدام
  - يشغّل وضعي بيئة التشغيل المعلنين عند توفرهما:
    - `generate` باستخدام إدخال يحتوي على موجه فقط
    - `edit` عندما يصرّح المزوّد بـ`capabilities.edit.enabled`
  - لدى `comfy` ملف مباشر منفصل خاص به، ولا يشمله هذا الفحص المشترك
- التضييق الاختياري:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- سلوك المصادقة الاختياري:
  - استخدم `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض المصادقة عبر مخزن ملفات التعريف وتجاهل التجاوزات المعتمدة على متغيرات البيئة وحدها

## الاختبار المباشر لتوليد الفيديو

- الاختبار: `extensions/video-generation-providers.live.test.ts`
- التمكين: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- أداة الاختبار: `pnpm test:live:media video`
- النطاق:
  - يختبر مسار موفّر إنشاء الفيديو المضمّن والمشترك عبر `alibaba` و`byteplus` و`deepinfra` و`fal` و`google` و`minimax` و`openai` و`openrouter` و`pixverse` و`qwen` و`runway` و`together` و`vydra` و`xai`
  - يستخدم افتراضيًا مسار اختبار الدخان الآمن للإصدار: طلب واحد لتحويل النص إلى فيديو لكل موفّر، ومطالبة بكركند لمدة ثانية واحدة، وحد أقصى لمدة العملية لكل موفّر مأخوذ من `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (القيمة الافتراضية `180000`)
  - يتخطى FAL افتراضيًا لأن زمن انتظار قائمة الانتظار لدى الموفّر قد يهيمن على وقت الإصدار؛ مرّر `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (أو أفرغ قائمة التخطي) لتشغيله صراحةً
  - يستخدم متغيرات بيئة الموفّر المُصدَّرة مسبقًا قبل الاستكشاف
  - يستخدم مفاتيح API المباشرة أو الموجودة في البيئة قبل ملفات تعريف المصادقة المخزنة افتراضيًا، كي لا تحجب مفاتيح الاختبار القديمة في `auth-profiles.json` بيانات اعتماد الصدفة الفعلية
  - يتخطى الموفّرين الذين لا يملكون مصادقة أو ملف تعريف أو نموذجًا صالحًا للاستخدام
  - يشغّل `generate` فقط افتراضيًا
  - اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المعلنة أيضًا عند توفرها:
    - `imageToVideo` عندما يعلن الموفّر `capabilities.imageToVideo.enabled` ويقبل الموفّر أو النموذج المحدد إدخال صورة محلية مدعومة بمخزن مؤقت في الفحص المشترك
    - `videoToVideo` عندما يعلن الموفّر `capabilities.videoToVideo.enabled` ويقبل الموفّر أو النموذج المحدد إدخال فيديو محلي مدعومًا بمخزن مؤقت في الفحص المشترك
  - موفّر `imageToVideo` المعلن حاليًا لكن المتخطى في الفحص المشترك:
    - `vydra` (إدخال الصور المحلية المدعومة بمخزن مؤقت غير مدعوم في هذا المسار)
  - تغطية خاصة بموفّر Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - يشغّل ذلك الملف تحويل النص إلى فيديو باستخدام `veo3`، بالإضافة إلى مسار لتحويل الصورة إلى فيديو باستخدام `kling` يستعمل افتراضيًا مُثبّت عنوان URL لصورة بعيدة (استخدم `OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` لتجاوزه).
  - تغطية خاصة بموفّر xAI:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - تنشئ الحالة الكلاسيكية إطار PNG أوليًا محليًا ومربعًا، وتحذف الأبعاد الهندسية، وتطلب مقطعًا لتحويل الصورة إلى فيديو مدته ثانية واحدة، وتستطلع حتى الاكتمال، وتتحقق من المخزن المؤقت المنزّل.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - تنشئ حالة 1.5 إطار PNG أوليًا محليًا، وتطلب مقطعًا لتحويل الصورة إلى فيديو بدقة 1080P ومدته ثانية واحدة، وتستطلع حتى الاكتمال، وتتحقق من المخزن المؤقت المنزّل.
  - تغطية `videoToVideo` المباشرة الحالية:
    - `runway` فقط عندما يُحلّ النموذج المحدد إلى `gen4_aleph`
  - موفّرو `videoToVideo` المعلنون حاليًا لكن المتخطون في الفحص المشترك:
    - `alibaba` و`google` و`openai` و`qwen` و`xai` لأن تلك المسارات تتطلب حاليًا عناوين URL مرجعية بعيدة من نوع `http(s)` بدلًا من إدخال محلي مدعوم بمخزن مؤقت
- التضييق الاختياري:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - استخدم `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` لتضمين كل موفّر في الفحص الافتراضي، بما في ذلك FAL
  - استخدم `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` لتقليل الحد الأقصى لمدة كل عملية للموفّر عند إجراء اختبار دخان مكثف
- سلوك المصادقة الاختياري:
  - استخدم `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لفرض المصادقة عبر مخزن ملفات التعريف وتجاهل التجاوزات الموجودة في البيئة فقط

## أداة اختبارات الوسائط المباشرة

- الأمر: `pnpm test:live:media`
- نقطة الدخول: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`، التي تشغّل `pnpm test:live -- <suite-test-file>` لكل حزمة مختارة، بحيث يظل سلوك Heartbeat والوضع الهادئ متسقًا مع عمليات تشغيل `pnpm test:live` الأخرى.
- الغرض:
  - تشغّل حزم الاختبارات المباشرة المشتركة للصور والموسيقى والفيديو عبر نقطة دخول واحدة أصلية للمستودع
  - تحمّل تلقائيًا متغيرات بيئة الموفّرين المفقودة من `~/.profile`
  - تضيّق تلقائيًا كل حزمة افتراضيًا لتقتصر على الموفّرين الذين يملكون حاليًا مصادقة صالحة للاستخدام
- الخيارات:
  - `--providers <csv>` مرشح عام للموفّرين؛ ويحصر `--image-providers` و`--music-providers` و`--video-providers` المرشح في حزمة واحدة
  - يتخطى `--all-providers` التصفية التلقائية المستندة إلى المصادقة
  - يُنهي `--allow-empty` العملية بالرمز `0` عندما لا تترك التصفية أي موفّرين قابلين للتشغيل
  - يُمرَّر `--quiet` أو `--no-quiet` إلى `test:live`
- أمثلة:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## ذو صلة

- [الاختبار](/ar/help/testing) - حزم اختبارات الوحدة والتكامل وضمان الجودة وDocker
