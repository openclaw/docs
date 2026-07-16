---
read_when:
    - تريد استخدام إطار GitHub Copilot SDK لوكيل.
    - تحتاج إلى أمثلة تهيئة لبيئة تشغيل `copilot`
    - أنت تربط وكيلاً باشتراك Copilot (github / openclaw / copilot) وتريد تشغيله عبر Copilot CLI
summary: شغّل دورات وكيل OpenClaw المضمّن عبر بيئة GitHub Copilot SDK الخارجية
title: أداة تكامل Copilot SDK
x-i18n:
    generated_at: "2026-07-16T14:30:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb4a0a3bf1123c1c3cbbed2630476afb5df73bc61d47e8a3987a5d0d7f01f83a
    source_path: plugins/copilot.md
    workflow: 16
---

تشغّل إضافة `@openclaw/copilot` الخارجية دورات وكيل Copilot للاشتراك المضمّن
عبر GitHub Copilot CLI ‏(`@github/copilot-sdk`) بدلاً من
حزمة التشغيل المضمّنة في OpenClaw. تمتلك جلسة Copilot CLI حلقة
الوكيل منخفضة المستوى: تنفيذ الأدوات الأصلي، وCompaction الأصلي (`infiniteSessions`)، وحالة
سلسلة المحادثة التي تديرها CLI ضمن `copilotHome`. يظل OpenClaw مسؤولاً عن قنوات
الدردشة، وملفات الجلسات، واختيار النموذج، والأدوات الديناميكية (عبر جسر)، والموافقات،
وتسليم الوسائط، ومرآة النص الظاهرة، والأسئلة الجانبية `/btw` (راجع
[الأسئلة الجانبية (`/btw`)](#side-questions-btw))، و`openclaw doctor`.

للاطلاع على التقسيم الأوسع بين النموذج والموفّر وبيئة التشغيل، ابدأ من
[بيئات تشغيل الوكيل](/ar/concepts/agent-runtimes).

## المتطلبات

- OpenClaw مع تثبيت إضافة `@openclaw/copilot`.
- إذا كان إعدادك يستخدم `plugins.allow`، فأدرج `copilot` (معرّف البيان الذي
  تصرّح به الإضافة). لن يتطابق إدخال قائمة السماح الخاص باسم حزمة npm
  `@openclaw/copilot`، وستظل الإضافة محظورة، حتى مع
  ضبط `agentRuntime.id: "copilot"`.
- اشتراك GitHub Copilot قادر على تشغيل Copilot CLI، أو
  متغير البيئة `gitHubToken` / إدخال ملف تعريف مصادقة لعمليات التشغيل بلا واجهة أو عبر Cron.
- دليل `copilotHome` قابل للكتابة. القيمة الافتراضية هي `<agentDir>/copilot` عندما
  يوفّر OpenClaw دليل وكيل، وإلا فهي
  `~/.openclaw/agents/<agentId>/copilot`.

يشغّل `openclaw doctor` [عقد doctor](#doctor) الخاص بالإضافة من أجل
ملكية حالة الجلسة وترحيلات الإعداد المستقبلية. ولا يفحص بيئة
Copilot CLI.

## التثبيت

تُشحن بيئة تشغيل Copilot كإضافة خارجية حتى لا تتضمن حزمة `openclaw`
الأساسية `@github/copilot-sdk` أو ملف Copilot CLI الثنائي `@github/copilot-<platform>-<arch>`
الخاص بكل منصة (نحو 260 MB معًا).
ثبّتها فقط للوكلاء الذين يختارون استخدام بيئة التشغيل هذه:

```bash
openclaw plugins install @openclaw/copilot
```

يثبّت معالج الإعداد الإضافة تلقائيًا في المرة الأولى التي تختار فيها
نموذج `github-copilot/*` **ويكون** إعدادك موجّهًا لذلك النموذج (أو
موفّره) إلى بيئة تشغيل Copilot عبر `agentRuntime: { id: "copilot" }`؛ راجع
[البدء السريع](#quickstart). من دون هذا الاشتراك الاختياري، يستخدم OpenClaw موفّر
GitHub Copilot المضمّن فيه ولا يثبّت هذه الإضافة مطلقًا.

تحدّد بيئة التشغيل موقع SDK بالترتيب التالي:

1. `import("@github/copilot-sdk")` من حزمة `@openclaw/copilot`
   المثبّتة.
2. الدليل الاحتياطي `~/.openclaw/npm-runtime/copilot/` (هدف تثبيت قديم
   عند الطلب).

يؤدي غياب SDK إلى إظهار خطأ واحد بالرمز `COPILOT_SDK_MISSING` وأمر
إعادة التثبيت الوارد أعلاه.

## البدء السريع

ثبّت نموذجًا واحدًا (أو موفّرًا واحدًا) على حزمة التشغيل:

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

اضبط `agentRuntime.id` في إدخال نموذج واحد لتوجيه ذلك النموذج وحده عبر
حزمة التشغيل، أو اضبطه في موفّر لتوجيه كل نموذج تابع لذلك الموفّر.

يمثّل `github-copilot/auto` نقطة البداية القابلة للنقل. تعتمد نماذج Copilot المسماة
على سياسات الحساب والمؤسسة؛ تأكد من أن Copilot CLI المصادق عليه لديك
يعرض نموذجًا بالفعل قبل تثبيته.

## الموفّرون المدعومون

تدعم حزمة التشغيل موفّر `github-copilot` القياسي (الذي تمتلكه
`extensions/github-copilot`)، بالإضافة إلى إدخالات `models.providers` المخصّصة عندما
يحتوي النموذج على `baseUrl` غير فارغ وأحد أشكال `api` التالية:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (إكمالات متوافقة مع OpenAI)
- `openai-completions`
- `openai-responses`

تظل معرّفات الموفّرين الأصلية (`openai`، و`anthropic`، و`google`، و`ollama`) مملوكة
لبيئات تشغيلها الأصلية. استخدم معرّف موفّر مخصّصًا ومختلفًا لتوجيه نقطة نهاية
عبر Copilot BYOK بدلاً من ذلك.

يجب أن تكون نقاط نهاية Copilot BYOK عناوين HTTPS عامة. تمنح حزمة التشغيل
Copilot SDK وكيلاً رجعيًا محليًا لكل محاولة، ثم تمرّر حركة مرور الموفّر
عبر مسار الجلب المحمي في OpenClaw لتظل ملكية تثبيت DNS وسياسة SSRF
لدى OpenClaw. استخدم بيئة تشغيل OpenClaw الأصلية مع Ollama المحلي أو LM
Studio أو خوادم النماذج على LAN.

## BYOK

يستخدم Copilot BYOK عقد الموفّر المخصّص على مستوى الجلسة في SDK. يمرّر OpenClaw
نقطة نهاية النموذج المحددة، ومفتاح API، ووضع رمز الحامل، والترويسات، ومعرّف النموذج،
وحدود السياق/الإخراج؛ ويبقى منطق نقل الموفّر في SDK، لا في
النواة.

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

تُفهرس جلسات BYOK بصورة منفصلة عن جلسات الاشتراك وعن نقاط نهاية
BYOK أو بيانات اعتمادها الأخرى. يؤدي تدوير المفتاح أو الترويسات أو النموذج أو نقطة النهاية
إلى بدء جلسة Copilot SDK جديدة بدلاً من استئناف حالة غير متوافقة.

## المصادقة

ترتيب الأولوية، ويُطبّق لكل وكيل أثناء `runCopilotAttempt`:

1. **`useLoggedInUser: true` صريح** في مُدخل المحاولة — يستخدم
   مستخدم Copilot CLI المسجّل دخوله ضمن `copilotHome` الخاص بالوكيل.
2. **`gitHubToken` صريح** في مُدخل المحاولة (يتطلب `profileId` +
   `profileVersion`). لاستدعاءات CLI المباشرة والاختبارات التي تحتاج إلى
   تجاوز تحديد ملف تعريف المصادقة.
3. **`resolvedApiKey` + `authProfileId` محددان وفق العقد** — المسار
   الرئيسي في الإنتاج. تحدد النواة ملف تعريف المصادقة `github-copilot` المضبوط
   للوكيل (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) قبل
   استدعاء حزمة التشغيل، ولذلك يعمل ملف تعريف مصادقة `github-copilot:<profile>`
   من البداية إلى النهاية في إعدادات التشغيل بلا واجهة أو عبر Cron أو متعددة الملفات الشخصية من دون متغيرات بيئة.
4. **الرجوع إلى متغيرات البيئة**، التي تُفحص بهذا الترتيب (تفوز أول قيمة غير فارغة،
   وتُعد السلاسل الفارغة غائبة؛ بما يماثل أولوية موفّر `github-copilot`
   المشحون في `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN` — تجاوز خاص بحزمة التشغيل؛ يتيح تثبيت
      رمز مميز لحزمة تشغيل OpenClaw دون التأثير في `gh` على مستوى النظام /
      إعداد Copilot CLI.
   2. `COPILOT_GITHUB_TOKEN` — متغير البيئة القياسي لـ Copilot SDK / CLI.
   3. `GH_TOKEN` — متغير البيئة القياسي لـ CLI ‏`gh`.
   4. `GITHUB_TOKEN` — خيار رجوع عام لرمز GitHub المميز.

   معرّف ملف تعريف المجموعة المُنشأ هو `env:<NAME>`؛ وإصدار ملف التعريف هو
   بصمة sha256 غير قابلة للعكس للرمز المميز، لذا يؤدي تدوير قيمة البيئة
   إلى إبطال مجموعة العملاء بصورة سليمة.

5. **`useLoggedInUser` الافتراضي** عند عدم توفر أي إشارة لرمز مميز.

يحصل كل وكيل على `copilotHome` خاص به حتى لا تتسرب رموز Copilot CLI المميزة وجلساته
وإعداداته بين الوكلاء على الجهاز نفسه. القيمة الافتراضية:
`<agentDir>/copilot` (تُبقي حالة SDK خارج الدليل نفسه الذي توجد فيه
`models.json` / `auth-profiles.json` الخاصة بـ OpenClaw)، أو
`~/.openclaw/agents/<agentId>/copilot` عندما لا يُمرّر دليل وكيل.
يمكن تجاوزها باستخدام `copilotHome: <path>` في مُدخل المحاولة لتحديد
موقع مخصّص (مثل نقطة تحميل مشتركة للترحيل).

تستخدم اختبارات حزمة التشغيل الحية `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` لتمرير
رمز مميز مباشر. يزيل إعداد الاختبار الحي المشترك `COPILOT_GITHUB_TOKEN` و`GH_TOKEN`
و`GITHUB_TOKEN` بعد تجهيز ملفات تعريف المصادقة الحقيقية في دليل الاختبار
المعزول، ولذلك تتجنب قيمة `gh auth token` الممرّرة عبر المتغير المخصّص
حالات التخطي الخاطئة دون التسرب إلى مجموعات اختبار غير مرتبطة.

## سطح الإعداد

تقرأ حزمة التشغيل الإعداد من مُدخل كل محاولة (`runCopilotAttempt({...})`)
بالإضافة إلى مجموعة صغيرة من القيم الافتراضية لمتغيرات البيئة داخل `extensions/copilot/src/`:

| الحقل                    | الغرض                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | دليل حالة CLI لكل وكيل (القيم الافتراضية أعلاه).                                                                                                                                                                                                                                                 |
| `model`                  | سلسلة أو `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. احذفه لاستخدام اختيار النموذج المعتاد للوكيل؛ تتحقق حزمة التشغيل من أن الموفّر المحدد مدعوم.                                                                                                                   |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. يُطابق تحديد `ThinkLevel` / `ReasoningLevel` الخاص بـ OpenClaw في `auto-reply/thinking.ts`.                                                                                                                                                          |
| `infiniteSessionConfig`  | تجاوز اختياري لكتلة `infiniteSessions` في SDK التي يتحكم فيها `harness.compact`. يمكن تركه كما هو بأمان.                                                                                                                                                                                        |
| `hooksConfig`            | إعداد `SessionHooks` أصلي واختياري لـ Copilot SDK من أجل استدعاءات أدوات/MCP ومطالبة المستخدم والجلسة والأخطاء. وهو منفصل عن خطافات دورة الحياة القابلة للنقل في OpenClaw.                                                                                                                                   |
| `permissionPolicy`       | تجاوز اختياري لمعالج `onPermissionRequest` في SDK لأنواع أدوات SDK المضمّنة (`shell`، و`write`، و`read`، و`url`، و`mcp`، و`memory`، و`hook`). القيمة الافتراضية هي `rejectAllPolicy` كشبكة أمان؛ راجع [الأذونات وask_user](#permissions-and-ask_user) لمعرفة سبب عدم تشغيله فعليًا مطلقًا. |
| `enableSessionTelemetry` | علامة اختيارية للقياس عن بُعد لجلسة SDK.                                                                                                                                                                                                                                                            |

لا تحتاج خطافات إضافات OpenClaw إلى إعداد محاولة خاص بـ Copilot. تشغّل
حزمة التشغيل `before_prompt_build` (وخطاف التوافق القديم `before_agent_start`)،
و`llm_input`، و`llm_output`، و`agent_end` عبر
مساعدات حزمة التشغيل القياسية. كما تشغّل عمليات Compaction الناجحة في SDK
`before_compaction` و`after_compaction`. تشغّل أدوات OpenClaw المتصلة عبر جسر
`before_tool_call` وتبلّغ عن `after_tool_call`؛ ويظل `hooksConfig` مخصصًا
لاستدعاءات SDK الأصلية فقط التي لا مكافئ قابلًا للنقل لها.

لا يحتاج أي جزء آخر من OpenClaw إلى معرفة هذه الحقول. لا ترى الإضافات
والقنوات وشيفرة النواة الأخرى سوى شكل `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult` القياسي.

## Compaction

عند تشغيل `harness.compact`، تقوم حزمة تشغيل Copilot SDK بما يلي:

1. تستأنف جلسة SDK المتتبعة دون متابعة العمل المعلّق.
2. تستدعي RPC الخاص بضغط السجل على مستوى الجلسة في SDK.
3. تعيد نتيجة Compaction في SDK دون كتابة ملفات علامات توافق
   ضمن مساحة العمل.

تستمر مرآة النص في جانب OpenClaw (أدناه) في تلقي الرسائل اللاحقة لـCompaction،
لذلك يظل سجل الدردشة الظاهر للمستخدم متسقًا.

## عكس النصوص المنقولة

`runCopilotAttempt` يكتب بشكل مزدوج رسائل كل دور القابلة للنسخ المتطابق في
نص تدقيق OpenClaw عبر
`extensions/copilot/src/dual-write-transcripts.ts`. يقتصر النسخ المتطابق على كل
جلسة (`copilot:${sessionId}`) ويُفهرس حسب كل رسالة
(`${role}:${sha256_16(role,content)}`)، لذا تتصادم إدخالات الأدوار السابقة المعاد إصدارها
مع المفاتيح الموجودة على القرص بدلًا من تكرارها.

تغلف طبقتان من احتواء الفشل عملية النسخ المتطابق كي لا يؤدي فشل كتابة النص
إلى فشل المحاولة مطلقًا: غلاف داخلي قائم على بذل أفضل جهد، بالإضافة إلى
آلية دفاع متعمق `.catch(...)` على مستوى المحاولة. تُسجّل حالات الفشل ولا
تُعرض.

## الأسئلة الجانبية (`/btw`)

إن `/btw` **ليس** أصليًا في هذا الحزام. يترك `createCopilotAgentHarness()`
عن قصد `harness.runSideQuestion` غير معرّف
(كما هو مؤكّد في `extensions/copilot/harness.test.ts` و`describe("runSideQuestion")`)؛
لذلك ينتقل موزّع `/btw` في OpenClaw (`src/agents/btw.ts`) إلى
المسار نفسه الذي يستخدمه لكل بيئة تشغيل غير Codex: يُستدعى موفّر النموذج
المُعدّ مباشرةً بموجّه قصير لسؤال جانبي، وتُعاد الإجابة متدفقة عبر
`streamSimple` (من دون جلسة CLI ولا خانة إضافية في التجمع).

يحافظ ذلك على جلسات Copilot CLI مخصصة لحلقة الدور الرئيسية للوكيل،
ويُبقي سلوك `/btw` مطابقًا لبيئات التشغيل الأخرى غير Codex.

## Doctor

يُحمّل `extensions/copilot/doctor-contract-api.ts` تلقائيًا بواسطة
`src/plugins/doctor-contract-registry.ts`. وهو يوفّر:

- قائمة `legacyConfigRules` فارغة (لا توجد حقول متقاعدة بعد).
- دالة `normalizeCompatibilityConfig` بلا تأثير (يُحتفظ بها كي يكون
  لتقاعد الحقول مستقبلًا موضع ثابت داخل الشجرة).
- إدخال `sessionRouteStateOwners` واحد: الموفّر `github-copilot`، وبيئة التشغيل
  `copilot`، ومفتاح جلسة CLI ‏`copilot`، وبادئة ملف تعريف المصادقة `github-copilot:`.

## القيود

- يطالب الحزام بـ `github-copilot` بالإضافة إلى معرّفات موفّري BYOK المخصصة غير المملوكة.
  تظل معرّفات الموفّرين الأصليين المملوكة لبيان التعريف ضمن بيئة التشغيل
  المالكة لها حتى عند فرض `agentRuntime.id` على `copilot`.
- لا توجد واجهة TUI؛ تظل TUI الخاصة بـ PI هي البديل لبيئات التشغيل التي لا تملك
  واجهة نظيرة.
- لا تُرحّل حالة جلسة PI عندما يتحول وكيل إلى `copilot`.
  يكون الاختيار لكل محاولة؛ وتظل جلسات PI الحالية صالحة.
- يستخدم `ask_user` مسار الموجّه والرد نفسه في OpenClaw الذي يستخدمه حزام Codex:
  عندما تطلب Copilot SDK إدخالًا من المستخدم، ينشر OpenClaw
  موجّهًا حاجبًا إلى القناة النشطة أو TUI، وتحل رسالة المستخدم
  التالية في قائمة الانتظار طلب SDK.

## الأذونات وask_user

يحدث إنفاذ الأذونات لأدوات OpenClaw الموصولة **داخل غلاف الأداة**،
وليس عبر رد النداء `onPermissionRequest` في SDK. يطبّق
`wrapToolWithBeforeToolCallHook` نفسه الذي تستخدمه PI
(`src/agents/agent-tools.before-tool-call.ts`) بواسطة
`createOpenClawCodingTools` على كل أداة برمجية: كشف الحلقات، وسياسات
Plugin الموثوقة، وخطافات ما قبل استدعاء الأداة، وموافقات Plugin ذات المرحلتين عبر
Gateway ‏(`plugin.approval.request`)؛ وكلها تمر عبر مسار الشيفرة نفسه تمامًا
الذي تستخدمه محاولات PI الأصلية.

تُوسم كل أداة SDK يعيدها جسر أدوات Copilot بما يلي:

- `overridesBuiltInTool: true` — يستبدل أداة Copilot CLI المضمنة
  التي تحمل الاسم نفسه (edit، وread، وwrite، وbash، ...) كي يُوجّه كل استدعاء
  أداة إلى OpenClaw.
- `skipPermission: true` — يطلب من SDK عدم تشغيل
  `onPermissionRequest({kind: "custom-tool"})` قبل استدعاء الأداة. ينفّذ
  `execute()` المغلّف بالفعل فحص سياسة OpenClaw الأكثر شمولًا؛ ومن شأن
  موجّه على مستوى SDK إما تجاوز إنفاذ OpenClaw
  (السماح للجميع) أو حظر كل استدعاء أداة (رفض الجميع) — ولا يطابق أي منهما
  التكافؤ مع PI.

يستخدم حزام Codex داخل الشجرة الفصل نفسه: تُغلّف أدوات OpenClaw الموصولة
(`extensions/codex/src/app-server/dynamic-tools.ts`)، وتُوجّه أنواع الموافقة الأصلية الخاصة
بـ codex-app-server
(`item/commandExecution/requestApproval`، و`item/fileChange/requestApproval`،
و`item/permissions/requestApproval`) عبر `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). والمكافئ في Copilot SDK
— وهو `rejectAllPolicy` المغلق افتراضيًا عند الفشل لأي نوع غير `custom-tool`
يصل يومًا إلى `onPermissionRequest` — يمثل شبكة الأمان نفسها، ولا
يُفعّل عمليًا مطلقًا لأن `overridesBuiltInTool: true` يحل محل كل
أداة مضمنة.

لكي تتخذ طبقة الأدوات المغلّفة قرارات سياسة مكافئة لـ PI، يمرر
الحزام سياق أداة محاولة PI الكامل إلى
`createOpenClawCodingTools`: الهوية (`senderIsOwner`، و`memberRoleIds`،
و`ownerOnlyToolAllowlist`، ...)، والقناة/التوجيه (`groupId`،
و`currentChannelId`، و`replyToMode`، ومفاتيح تبديل أدوات الرسائل)، والمصادقة
(`authProfileStore`)، وهوية التشغيل (`sessionKey` / `runSessionKey` المشتقة
من `sandboxSessionKey` و`runId`)، وسياق النموذج (`modelApi`،
و`modelContextWindowTokens`، و`modelCompat`، و`modelHasVision`)، وخطافات التشغيل
(`onToolOutcome` و`onYield`). من دون هذه الحقول، ترفض قوائم السماح الخاصة بالمالك فقط
ضمنيًا وبشكل افتراضي، ولا يمكن لسياسات ثقة Plugin تحديد النطاق الصحيح،
ويُحل `session_status: "current"` إلى مفتاح بيئة معزولة قديم. منشئ
الجسر هو `extensions/copilot/src/tool-bridge.ts`، وهو يعكس استدعاء PI
المرجعي في `src/agents/embedded-agent-runner/run/attempt.ts:1262`.
يحل `runAttempt` سياق البيئة المعزولة عبر
واجهة `resolveSandboxContext` المشتركة، ويمرر إلى SDK دليل عمل فعليًا،
ويمرر `sandbox` بالإضافة إلى مساحة عمل إنشاء الوكيل الفرعي إلى جسر
الأدوات. ويمرر الجسر أيضًا عناصر التحكم المحدودة في إنشاء الأدوات التي
يمكنه إنفاذها عند حدود SDK: ‏`includeCoreTools`، وقائمة السماح بأدوات بيئة
التشغيل، و`toolConstructionPlan`.

يستخدم الجسر أيضًا مساعد سطح أدوات الحزام المشترك من
`openclaw/plugin-sdk/agent-harness-tool-runtime` لتحقيق التكافؤ مع PI. عند
تمكين البحث عن الأدوات، ترى SDK أدوات تحكم موجزة بالإضافة إلى منفّذ
فهرس مخفي بدلًا من كل مخططات أدوات OpenClaw. وعند تمكين وضع الشيفرة،
ينشئ المساعد سطح تحكم وضع الشيفرة نفسه ودورة حياة الفهرس
المستخدمة في أحزمة الوكلاء الأخرى. وتظل الإعدادات الافتراضية الرشيقة للنماذج
المحلية، وتصفية المخططات المتوافقة مع بيئة التشغيل، وتهيئة الدليل،
وتنظيف الفهرس كلها ضمن المساعد المشترك كي لا تنحرف أحزمة Copilot
والأحزمة المجاورة لـ Codex عن بعضها.

### رمز GitHub على مستوى الجلسة

يميّز عقد Copilot SDK بين رمز GitHub **على مستوى العميل**
(`CopilotClientOptions.gitHubToken`، الذي يصادق عملية CLI نفسها)
والرمز **على مستوى الجلسة** (`SessionConfig.gitHubToken`، الذي يحدد
استبعاد المحتوى، وتوجيه النموذج، والحصة لتلك الجلسة؛ ويُحترم في
كل من `createSession` و`resumeSession`). يحل الحزام المصادقة مرة واحدة عبر
`resolveCopilotAuth` ويضبط كلا الحقلين عندما يكون وضع المصادقة `gitHubToken`
(إما `auth.gitHubToken` صريحًا أو `resolvedApiKey` محلولًا وفق العقد من
ملف تعريف مصادقة `github-copilot` مُعدّ). عندما يكون الوضع المحلول
`useLoggedInUser`، يُحذف الحقل على مستوى الجلسة كي تواصل SDK
اشتقاق الهوية من الهوية المسجّل دخولها.

يستخدم `ask_user` ‏`SessionConfig.onUserInputRequest`. يقبل الجسر فهارس
الخيارات أو تسمياتها لطلبات الاختيار الثابت، ويقبل إجابات حرة عندما
يسمح بها طلب SDK، ويلغي طلبًا معلقًا عند إحباط محاولة OpenClaw.

## ذو صلة

- [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes)
- [حزام Codex](/ar/plugins/codex-harness)
- [Plugin أحزمة الوكلاء (مرجع SDK)](/ar/plugins/sdk-agent-harness)
