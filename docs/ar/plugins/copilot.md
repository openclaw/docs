---
read_when:
    - تريد استخدام حزمة اختبار GitHub Copilot SDK لوكيل
    - تحتاج إلى أمثلة تكوين لوقت تشغيل `copilot`
    - أنت توصل وكيلاً بخدمة Copilot بالاشتراك (github / openclaw / copilot) وتريد تشغيله عبر Copilot CLI
summary: تشغيل دورات الوكيل المضمّن في OpenClaw عبر حزمة اختبار GitHub Copilot SDK الخارجية
title: أداة اختبار Copilot SDK
x-i18n:
    generated_at: "2026-06-27T18:05:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

يسمح Plugin الخارجي `@openclaw/copilot` لـ OpenClaw بتشغيل دورات وكيل Copilot المضمنة ذات الاشتراك عبر GitHub Copilot CLI (`@github/copilot-sdk`) بدلًا من حزمة PI المدمجة.

استخدم حزمة Copilot SDK عندما تريد أن تملك جلسة Copilot CLI حلقة الوكيل منخفضة المستوى: تنفيذ الأدوات الأصلي، وCompaction الأصلي (`infiniteSessions`)، وحالة سلسلة المحادثة المُدارة بواسطة CLI تحت `copilotHome`.
يظل OpenClaw مالكًا لقنوات الدردشة، وملفات الجلسات، واختيار النموذج، وأدوات OpenClaw الديناميكية (الموصولة)، والموافقات، وتسليم الوسائط، ومرآة النص المرئي، وأسئلة `/btw` الجانبية (تتعامل معها PI الاحتياطية داخل الشجرة — راجع
[الأسئلة الجانبية (`/btw`)](#side-questions-btw))، و`openclaw doctor`.

للتقسيم الأوسع للنموذج/المزوّد/وقت التشغيل، ابدأ بـ
[أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes).

## المتطلبات

- OpenClaw مع تثبيت Plugin ‏`@openclaw/copilot`.
- إذا كان تكوينك يستخدم `plugins.allow`، فأدرج `copilot` (معرّف البيان
  الذي يعلنه Plugin). ستترك قائمة السماح التقييدية التي تستخدم اسم حزمة npm بنمط `@openclaw/copilot`
  Plugin محظورًا ولن يتم تحميل وقت التشغيل
  حتى مع `agentRuntime.id: "copilot"`.
- اشتراك GitHub Copilot يمكنه تشغيل Copilot CLI (أو إدخال `gitHubToken` في البيئة / ملف تعريف مصادقة للتشغيل بلا واجهة / تشغيل cron).
- دليل `copilotHome` قابل للكتابة. تستخدم الحزمة افتراضيًا
  `<agentDir>/copilot` عندما يوفر OpenClaw دليل وكيل، وإلا
  `~/.openclaw/agents/<agentId>/copilot` لعزل كامل لكل وكيل.

يشغّل `openclaw doctor` 
[عقد الطبيب](#doctor) الخاص بـ Plugin لملكية حالة الجلسة التصريحية وترحيلات التوافق المستقبلية. ولا يشغّل فحوصات بيئة Copilot CLI.

## تثبيت Plugin

وقت تشغيل Copilot هو Plugin خارجي، لذلك لا تحمل حزمة `openclaw` الأساسية
اعتمادية `@github/copilot-sdk` أو ملف CLI الثنائي الخاص بالمنصة
`@github/copilot-<platform>-<arch>`. يضيفان معًا نحو
260 ميغابايت، لذا ثبّتهما فقط للوكلاء الذين يختارون هذا وقت التشغيل:

```bash
openclaw plugins install @openclaw/copilot
```

يثبّت المعالج Plugin في المرة الأولى التي تختار فيها نموذج
`github-copilot/*` **و** يختار تكوينك النموذج (أو مزوّده)
ليستخدم وقت تشغيل وكيل Copilot عبر
`agentRuntime: { id: "copilot" }` (راجع [البدء السريع](#quickstart) أدناه).
ومن دون هذا الاشتراك، يستخدم openclaw مزوّد GitHub Copilot المدمج
ولا يثبّت Plugin وقت التشغيل أبدًا.

يحل وقت التشغيل SDK بهذا الترتيب:

1. `import("@github/copilot-sdk")` من حزمة `@openclaw/copilot`
   المثبتة.
2. دليل الرجوع المعروف `~/.openclaw/npm-runtime/copilot/` (هدف التثبيت القديم عند الطلب).

تظهر SDK المفقودة كخطأ واحد برمز `COPILOT_SDK_MISSING`
ومعه أمر إعادة تثبيت Plugin أعلاه.

## البدء السريع

ثبّت نموذجًا واحدًا (أو مزوّدًا واحدًا) على الحزمة:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

المساران متكافئان. استخدم `agentRuntime.id` على إدخال نموذج واحد
عندما يجب توجيه ذلك النموذج فقط عبر الحزمة؛ واضبط
`agentRuntime.id` على مزوّد عندما يجب أن يستخدمه كل نموذج تحت ذلك المزوّد.

`github-copilot/auto` هو نقطة البداية المحمولة. تعتمد نماذج Copilot المسماة
على سياسات الحساب والمؤسسة، لذا لا تثبّت واحدًا إلا بعد التأكد
من أن Copilot CLI المصادق يعرضه.

## المزوّدون المدعومون

تعلن الحزمة دعمها لمزوّد `github-copilot` القانوني
(نفس المعرّف الذي يملكه `extensions/github-copilot`):

- `github-copilot`

كما تدعم إدخالات `models.providers` المخصصة عندما يحتوي النموذج المحدد على
`baseUrl` غير فارغ وأحد أشكال API هذه:

- `openai-responses`
- `openai-completions`
- `ollama` (إكمالات متوافقة مع OpenAI)
- `azure-openai-responses`
- `anthropic-messages`

تظل معرّفات المزوّدين الأصلية مثل `openai` و`anthropic` و`google` و`ollama`
مملوكة لأوقات تشغيلها الأصلية. استخدم معرّف مزوّد مخصصًا منفصلًا عند توجيه
نقطة نهاية عبر Copilot BYOK.

يجب أن تكون نقاط نهاية Copilot BYOK عناوين HTTPS على شبكة عامة. تمنح الحزمة
Copilot SDK عنوان وكيل local loopback لكل محاولة، ثم تمرر حركة المزوّد
عبر مسار fetch المحروس في OpenClaw حتى تظل سياسة تثبيت DNS وSSRF
مملوكة لـ OpenClaw. استخدم وقت تشغيل OpenClaw الأصلي لـ Ollama المحلي أو LM Studio
أو خوادم النماذج على LAN.

## BYOK

يستخدم Copilot BYOK عقد المزوّد المخصص على مستوى الجلسة في SDK. يمرّر OpenClaw
نقطة نهاية النموذج المحلولة، ومفتاح API، ووضع رمز الحامل، والرؤوس، ومعرّف النموذج،
وحدود السياق/الإخراج من دون نقل منطق نقل المزوّد إلى
النواة.

على سبيل المثال:

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

تُفهرس جلسات BYOK بشكل منفصل عن جلسات الاشتراك وعن نقاط النهاية الأخرى أو بصمات بيانات الاعتماد. يؤدي تدوير المفتاح أو الرؤوس أو النموذج أو
نقطة النهاية إلى إنشاء جلسة Copilot SDK جديدة بدلًا من استئناف
حالة غير متوافقة.

## المصادقة

الأولوية لكل وكيل، وتُطبّق أثناء `runCopilotAttempt`:

1. **`useLoggedInUser: true` صريح** على مُدخل المحاولة. يستخدم مستخدم Copilot
   CLI المسجل دخوله والمحلول تحت `copilotHome` الخاص بالوكيل.
2. **`gitHubToken` صريح** على مُدخل المحاولة (مع `profileId` +
   `profileVersion`). مفيد لاستدعاءات CLI المباشرة والاختبارات حيث يريد
   المستدعي تجاوز حل ملف تعريف المصادقة.
3. **`resolvedApiKey` + `authProfileId` محلولان بالعقد** من شكل
   `EmbeddedRunAttemptParams`. هذا هو **المسار الرئيسي للإنتاج**:
   تحل النواة ملف تعريف مصادقة `github-copilot` المكوّن للوكيل
   (عبر `src/infra/provider-usage.auth.ts:resolveProviderAuths`) قبل
   استدعاء الحزمة، وتستهلك الحزمة كلا الحقلين مباشرة.
   هذا يجعل ملف تعريف مصادقة `github-copilot:<profile>` يعمل من البداية إلى النهاية
   لإعدادات بلا واجهة / cron / متعددة الملفات الشخصية من دون متغيرات بيئة.
4. **رجوع متغير البيئة** لتشغيل CLI المباشر / dogfood عندما لا يكون هناك
   ملف تعريف مصادقة مكوّن. يتحقق وقت التشغيل من المتغيرات التالية
   بترتيب الأولوية، مطابقًا لمزوّد `github-copilot` المشحون
   (`extensions/github-copilot/auth.ts`) وإعداد Copilot SDK
   الموثق:
   1. `OPENCLAW_GITHUB_TOKEN` -- تجاوز خاص بالحزمة؛ اضبط هذا
      لتثبيت رمز لحزمة OpenClaw من دون إزعاج
      تكوين `gh` / Copilot CLI على مستوى النظام.
   2. `COPILOT_GITHUB_TOKEN` -- متغير البيئة القياسي لـ Copilot SDK / CLI.
   3. `GH_TOKEN` -- متغير البيئة القياسي لـ `gh` CLI (يطابق أولوية مزوّد
      `github-copilot` الحالية).
   4. `GITHUB_TOKEN` -- رجوع رمز GitHub عام.

   تفوز أول قيمة غير فارغة؛ وتُعامل السلاسل الفارغة على أنها
   غائبة. معرّف ملف تعريف التجمع المُركّب هو `env:<NAME>` و
   `profileVersion` هو بصمة sha256 غير قابلة للعكس للرمز،
   لذلك يؤدي تدوير قيمة البيئة إلى إبطال تجمع العميل بشكل نظيف.

5. **`useLoggedInUser` الافتراضي** عندما لا تتوفر إشارة رمز.

يحصل كل وكيل على `copilotHome` مخصص حتى لا تتسرب رموز Copilot CLI والجلسات و
التكوين بين الوكلاء على الجهاز نفسه. الافتراضي هو
`<agentDir>/copilot` عندما يمرر المضيف دليل وكيل إلى الحزمة
(لعزل حالة SDK عن `models.json` / `auth-profiles.json` الخاصة بـ OpenClaw في
الدليل نفسه)، أو `~/.openclaw/agents/<agentId>/copilot` خلاف ذلك.
تجاوز ذلك باستخدام `copilotHome: <path>` على مُدخل المحاولة عندما تحتاج إلى
موقع مخصص (مثلًا، نقطة تحميل مشتركة للترحيل).

تستخدم اختبارات الحزمة الحية `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` عندما تكون هناك حاجة إلى رمز مباشر.
يمسح إعداد الاختبارات الحية المشترك عن قصد
`COPILOT_GITHUB_TOKEN` و`GH_TOKEN` و`GITHUB_TOKEN` بعد تجهيز ملفات تعريف مصادقة حقيقية
في منزل اختبار معزول، لذا فإن تمرير قيمة `gh auth token`
عبر متغير الاختبار الحي المخصص يتجنب التخطي الخاطئ من دون كشف
الرمز لمجموعات اختبار غير ذات صلة.

## سطح التكوين

تقرأ الحزمة تكوينها من مُدخل كل محاولة
(`runCopilotAttempt({...})`) بالإضافة إلى مجموعة صغيرة من افتراضيات البيئة داخل
`extensions/copilot/src/`:

- `copilotHome` — دليل حالة CLI لكل وكيل (الافتراضيات موثقة أعلاه).
- `model` — سلسلة أو `{ provider, id, api?, baseUrl?, headers?, authHeader? }`.
  عند حذفه، يستخدم OpenClaw اختيار النموذج العادي للوكيل وتتحقق
  الحزمة من أن المزوّد المحلول مدعوم.
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`. يُطابق من
  حل `ThinkLevel` / `ReasoningLevel` في OpenClaw ضمن
  `auto-reply/thinking.ts`.
- `infiniteSessionConfig` — تجاوز اختياري لكتلة SDK
  `infiniteSessions` التي يقودها `harness.compact`. الافتراضيات آمنة
  لتركها كما هي.
- `hooksConfig` — تكوين توافق `SessionHooks` الأصلي الاختياري في Copilot SDK
  لاستدعاءات الأدوات/MCP، وموجه المستخدم، والجلسة، والأخطاء.
  وهو منفصل عن خطافات دورة الحياة المحمولة في OpenClaw.
- `permissionPolicy` — تجاوز اختياري لمعالج
  `onPermissionRequest` في SDK المستخدم لأنواع أدوات SDK المدمجة
  (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). يكون افتراضيًا
  `rejectAllPolicy` كشبكة أمان؛ عمليًا لا تستدعي SDK أبدًا
  أيًا من تلك الأنواع لأن كل أداة OpenClaw موصولة
  تُسجّل مع `overridesBuiltInTool: true` و
  `skipPermission: true` بحيث تمر 100% من استدعاءات الأدوات عبر
  `execute()` المغلف الخاص بـ OpenClaw. راجع [الأذونات وask_user](#permissions-and-ask_user).
- `enableSessionTelemetry` — علامة اختيارية لقياس بُعد جلسة SDK.

لا تحتاج خطافات Plugin في OpenClaw إلى تكوين محاولة خاص بـ Copilot. تشغّل
الحزمة `before_prompt_build` (وخطاف التوافق القديم `before_agent_start`)، و`llm_input`، و`llm_output`، و`agent_end` عبر
مساعدات الحزمة القياسية. كما تشغّل عمليات Compaction الناجحة في SDK
`before_compaction` و`after_compaction`. تواصل أدوات OpenClaw الموصولة
تشغيل `before_tool_call` والإبلاغ عن `after_tool_call`؛ ويظل `hooksConfig` مخصصًا
لاستدعاءات SDK الأصلية فقط التي لا تملك مكافئًا محمولًا.

لا يحتاج أي شيء في بقية OpenClaw إلى معرفة هذه الحقول. لا ترى
Plugins الأخرى والقنوات وكود النواة سوى شكل
`AgentHarnessAttemptParams` / `AgentHarnessAttemptResult` القياسي.

## Compaction

عند تشغيل `harness.compact`، تقوم حزمة Copilot SDK بما يلي:

1. تستأنف جلسة SDK المتعقبة من دون متابعة العمل المعلّق.
2. تستدعي RPC لضغط السجل على نطاق الجلسة في SDK.
3. تعيد نتيجة Compaction من SDK من دون كتابة ملفات علامات توافق
   تحت مساحة العمل.

تستمر مرآة نص OpenClaw الجانبية (انظر أدناه) في تلقي
رسائل ما بعد Compaction، لذلك يبقى سجل الدردشة المرئي للمستخدم متسقًا.

## عكس النص

يكتب `runCopilotAttempt` كتابة مزدوجة لكل رسائل الدور القابلة للعكس في
نص تدقيق OpenClaw عبر
`extensions/copilot/src/dual-write-transcripts.ts`. تكون المرآة
ضمن نطاق كل جلسة (`copilot:${sessionId}`) وتستخدم هوية لكل رسالة
(`${role}:${sha256_16(role,content)}`) بحيث تتصادم إعادة إصدار إدخالات الأدوار السابقة
مع المفاتيح الموجودة على القرص ولا تتكرر.

تُغلّف المرآة بطبقتين من احتواء الفشل بحيث لا يمكن لفشل كتابة النص
إفشال المحاولة: غلاف داخلي بأفضل جهد و`.catch(...)`
دفاعي على مستوى المحاولة. تُسجّل حالات الفشل ولكن لا تُعرض.

## الأسئلة الجانبية (`/btw`)

`/btw` ليس **أصليًا** في هذا الحزام. يترك `createCopilotAgentHarness()`
عن قصد `harness.runSideQuestion` غير معرّف، لذلك ينتقل موزّع `/btw` في OpenClaw
(`src/agents/btw.ts`) إلى مسار رجوع PI نفسه داخل الشجرة الذي يستخدمه لكل
بيئة تشغيل غير Codex: يُستدعى موفر النموذج المكوّن مباشرةً بموجّه قصير لسؤال
جانبي، ثم يُعاد بثه عبر `streamSimple` (لا جلسة CLI، ولا خانة إضافية في المجمع).

يبقي هذا جلسات Copilot CLI محجوزة لحلقة الدور الرئيسية للوكيل، ويبقي سلوك
`/btw` مطابقًا لبيئات التشغيل الأخرى المدعومة بـ PI. يُثبَت العقد في
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
ضمن `describe("runSideQuestion")`.

## Doctor

يُحمَّل `extensions/copilot/doctor-contract-api.ts` تلقائيًا بواسطة
`src/plugins/doctor-contract-registry.ts`. وهو يضيف:

- `legacyConfigRules` فارغة (لا حقول متقاعدة في MVP).
- `normalizeCompatibilityConfig` بلا إجراء (أُبقيت حتى تكون لتقاعد الحقول
  مستقبلًا جهة ثابتة داخل الشجرة).
- إدخال `sessionRouteStateOwners` واحد يطالب بالموفر `github-copilot`؛
  وبيئة التشغيل `copilot`؛ ومفتاح جلسة CLI `copilot`؛ وبادئة ملف تعريف
  المصادقة `github-copilot:`.

## القيود

- يطالب الحزام بـ `github-copilot` إضافةً إلى معرّفات موفر BYOK المخصصة غير المملوكة.
  تبقى معرّفات الموفر الأصلي المملوكة للبيان على بيئة التشغيل المالكة لها حتى عندما
  يُفرض `agentRuntime.id` على `copilot`.
- لا يقدّم الحزام TUI؛ ولا يتأثر TUI الخاص بـ PI، ويبقى هو الرجوع لأي
  بيئات تشغيل لا تملك سطحًا نظيرًا.
- لا تُهاجَر حالة جلسة PI عندما ينتقل وكيل إلى `copilot`.
  الاختيار لكل محاولة؛ وتبقى جلسات PI الحالية صالحة.
- يستخدم `ask_user` مسار OpenClaw نفسه للمطالبة والرد مثل حزام Codex.
  عندما يطلب Copilot SDK إدخالًا من المستخدم، ينشر OpenClaw مطالبة حاظرة
  إلى القناة/TUI النشطة، وتقوم رسالة المستخدم التالية في الطابور بحل طلب SDK.

## الأذونات و ask_user

يحدث فرض الأذونات لأدوات OpenClaw الموصولة **داخل غلاف الأداة**،
وليس عبر استدعاء SDK الرجعي `onPermissionRequest`. يُطبَّق
`wrapToolWithBeforeToolCallHook` نفسه الذي يستخدمه PI
(`src/agents/pi-tools.before-tool-call.ts`) بواسطة
`createOpenClawCodingTools` على كل أداة برمجة: كشف الحلقات،
وسياسات Plugin الموثوقة، وخطافات ما قبل استدعاء الأداة، وموافقات Plugin
ذات المرحلتين عبر Gateway (`plugin.approval.request`) كلها تعمل بالمسار
البرمجي نفسه تمامًا مثل محاولات PI الأصلية.

للسماح لذلك الغلاف بامتلاك القرار، توضع على SDK Tool المعادة من
`convertOpenClawToolToSdkTool` العلامات التالية:

- `overridesBuiltInTool: true` — تستبدل أداة Copilot CLI المضمّنة
  ذات الاسم نفسه (edit، read، write، bash، …) بحيث يوجَّه كل استدعاء
  أداة عائدًا إلى OpenClaw.
- `skipPermission: true` — تخبر SDK ألا تشغّل
  `onPermissionRequest({kind: "custom-tool"})` قبل استدعاء الأداة.
  تنفّذ `execute()` المغلّفة فحص سياسة OpenClaw الأغنى داخليًا؛ أما
  مطالبة على مستوى SDK فإما أن تتجاوز فرض OpenClaw (إذا سمحنا بالكل)
  أو تحظر كل استدعاء أداة (إذا رفضنا الكل) — ولا يطابق أي منهما تكافؤ PI.

يستخدم حزام codex داخل الشجرة التقسيم نفسه: أدوات OpenClaw الموصولة
تُغلّف (`extensions/codex/src/app-server/dynamic-tools.ts`) وأنواع الموافقة
الأصلية _الخاصة_ بـ codex-app-server
(`item/commandExecution/requestApproval`,
`item/fileChange/requestApproval`,
`item/permissions/requestApproval`) تُمرَّر عبر
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). أما مكافئ Copilot SDK
— سياسة `rejectAllPolicy` التي تفشل مغلقةً لأي نوع غير `custom-tool`
قد يصل إلى `onPermissionRequest` — فهو شبكة الأمان نفسها، ولا يعمل عمليًا
لأن `overridesBuiltInTool: true` يزيح كل أداة مضمّنة.

كي تتخذ طبقة الأداة المغلّفة قرارات سياسة مكافئة لـ PI، يمرّر الحزام سياق
أداة محاولة PI الكامل إلى `createOpenClawCodingTools` — الهوية
(`senderIsOwner`, `memberRoleIds`, `ownerOnlyToolAllowlist`, …)،
القناة/التوجيه (`groupId`, `currentChannelId`, `replyToMode`,
مفاتيح تبديل أدوات الرسائل)، المصادقة (`authProfileStore`)، هوية التشغيل
(`sessionKey`/`runSessionKey` المشتقة من `sandboxSessionKey`, `runId`)،
سياق النموذج (`modelApi`, `modelContextWindowTokens`,
`modelCompat`, `modelHasVision`)، وخطافات التشغيل (`onToolOutcome`,
`onYield`). من دون هذه الحقول، تتصرف قوائم السماح الخاصة بالمالك فقط
بصمت كرفض افتراضي، ولا تستطيع سياسات ثقة Plugin الحل إلى النطاق الصحيح،
ويحل `session_status: "current"` إلى مفتاح sandbox قديم. يوجد باني الجسر في
`extensions/copilot/src/tool-bridge.ts` ويطابق استدعاء PI المرجعي في
`src/agents/pi-embedded-runner/run/attempt.ts:1029-1117`. يقوم `runAttempt`
بالفعل بحل سياق sandbox عبر مسار `resolveSandboxContext` المشترك، ويمرّر
إلى SDK دليل عمل فعّالًا، ويمرّر `sandbox` إضافةً إلى مساحة عمل إنشاء
الوكيل الفرعي إلى جسر الأدوات. يمرّر الجسر أيضًا عناصر التحكم المحدودة
في إنشاء الأدوات التي يمكنه فرضها عند حد SDK: `includeCoreTools`،
وقائمة السماح لأدوات بيئة التشغيل، و`toolConstructionPlan`.

يستخدم الجسر أيضًا مساعد سطح أدوات الحزام المشترك من
`openclaw/plugin-sdk/agent-harness-tool-runtime` لتكافؤ PI. عندما يكون
بحث الأدوات مفعّلًا، ترى SDK أدوات تحكم مضغوطة إضافةً إلى منفّذ كتالوج
مخفي بدل كل مخطط أدوات OpenClaw. عندما يكون وضع الكود مفعّلًا، يبني
المساعد سطح التحكم نفسه لوضع الكود ودورة حياة الكتالوج المستخدمة بواسطة
أحزمة الوكلاء الأخرى. تبقى الإعدادات الافتراضية الخفيفة للنموذج المحلي،
وترشيح المخططات المتوافق مع بيئة التشغيل، وترطيب الأدلة، وتنظيف الكتالوج
كلها في المساعد المشترك حتى لا تنحرف أحزمة Copilot والأحزمة المجاورة لـ Codex.

### رمز GitHub على مستوى الجلسة

يميّز عقد Copilot SDK بين رمز GitHub على **مستوى العميل**
(`CopilotClientOptions.gitHubToken`، المستخدم لمصادقة عملية CLI نفسها)
ورمز **مستوى الجلسة** (`SessionConfig.gitHubToken`، الذي يحدد استبعاد
المحتوى، وتوجيه النموذج، والحصة لتلك الجلسة، ويُحترم في كل من
`createSession` و`resumeSession`). يحل الحزام المصادقة مرة واحدة عبر
`resolveCopilotAuth` ويضبط كلا الحقلين عندما يكون نمط المصادقة
`gitHubToken` (إما `auth.gitHubToken` صريح أو `resolvedApiKey` محلول
بالعقد من ملف تعريف مصادقة `github-copilot` مكوّن). عندما يكون النمط
المحلول `useLoggedInUser`، يُحذف حقل مستوى الجلسة حتى تواصل SDK اشتقاق
الهوية من الهوية المسجّل دخولها.

يستخدم `ask_user` `SessionConfig.onUserInputRequest`. يقبل الجسر فهارس
الاختيارات أو تسمياتها لطلبات الاختيار الثابت، ويقبل إجابات حرة عندما
يسمح طلب SDK بها، ويلغي طلبًا معلقًا عندما تُجهض محاولة OpenClaw.

## ذات صلة

- [بيئات تشغيل الوكيل](/ar/concepts/agent-runtimes)
- [حزام Codex](/ar/plugins/codex-harness)
- [إضافات حزام الوكيل (مرجع SDK)](/ar/plugins/sdk-agent-harness)
