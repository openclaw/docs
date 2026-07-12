---
read_when:
    - تريد استخدام إطار عمل GitHub Copilot SDK لوكيل
    - تحتاج إلى أمثلة على الإعداد لبيئة التشغيل `copilot`
    - أنت تربط وكيلاً باشتراك Copilot ‏(github / openclaw / copilot) وتريد تشغيله عبر Copilot CLI
summary: شغّل أدوار وكيل OpenClaw المضمّن عبر إطار GitHub Copilot SDK الخارجي
title: أداة تكامل Copilot SDK
x-i18n:
    generated_at: "2026-07-12T06:09:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a9b75a038540af6a8306f3e80c87d6085dde29d128adf85b930713209fc5
    source_path: plugins/copilot.md
    workflow: 16
---

يشغّل Plugin الخارجي `@openclaw/copilot` دورات وكيل Copilot ذات الاشتراك المضمّن عبر GitHub Copilot CLI (`@github/copilot-sdk`) بدلًا من حاضنة OpenClaw المدمجة. تمتلك جلسة Copilot CLI حلقة الوكيل منخفضة المستوى: تنفيذ الأدوات الأصلي، وCompaction الأصلي (`infiniteSessions`)، وحالة سلسلة المحادثة التي يديرها CLI ضمن `copilotHome`. ويظل OpenClaw مسؤولًا عن قنوات الدردشة، وملفات الجلسات، واختيار النموذج، والأدوات الديناميكية (الموصولة بجسر)، والموافقات، وتسليم الوسائط، ونسخة السجل المرئية، والأسئلة الجانبية عبر `/btw` (راجع [الأسئلة الجانبية (`/btw`)](#side-questions-btw))، و`openclaw doctor`.

للتعرّف على الفصل الأوسع بين النموذج والموفّر وبيئة التشغيل، ابدأ بصفحة
[بيئات تشغيل الوكيل](/ar/concepts/agent-runtimes).

## المتطلبات

- OpenClaw مع تثبيت Plugin ‏`@openclaw/copilot`.
- إذا كان إعدادك يستخدم `plugins.allow`، فأدرج `copilot` (معرّف البيان الذي يعلنه Plugin). لن يتطابق إدخال قائمة السماح باسم حزمة npm ‏`@openclaw/copilot`، وسيظل Plugin محظورًا حتى مع ضبط `agentRuntime.id: "copilot"`.
- اشتراك GitHub Copilot قادر على تشغيل Copilot CLI، أو متغير البيئة `gitHubToken` / إدخال ملف تعريف مصادقة لعمليات التشغيل دون واجهة أو عمليات Cron.
- دليل `copilotHome` قابل للكتابة. القيمة الافتراضية هي `<agentDir>/copilot` عندما يوفّر OpenClaw دليلًا للوكيل، وإلا فهي `~/.openclaw/agents/<agentId>/copilot`.

يشغّل `openclaw doctor` [عقد الفحص](#doctor) الخاص بـPlugin للتحقق من ملكية حالة الجلسة وترحيلات الإعداد المستقبلية. ولا يفحص بيئة Copilot CLI.

## التثبيت

تُشحن بيئة تشغيل Copilot بوصفها Plugin خارجيًا حتى لا تتضمن حزمة `openclaw` الأساسية `@github/copilot-sdk` أو ملف Copilot CLI الثنائي الخاص بالمنصة `@github/copilot-<platform>-<arch>` (بإجمالي يقارب 260 ميغابايت). ثبّتها فقط للوكلاء الذين يختارون استخدام بيئة التشغيل هذه:

```bash
openclaw plugins install @openclaw/copilot
```

يثبّت معالج الإعداد Plugin تلقائيًا في المرة الأولى التي تختار فيها نموذجًا من `github-copilot/*` **ويكون** إعدادك قد وجّه ذلك النموذج (أو موفّره) إلى بيئة تشغيل Copilot عبر `agentRuntime: { id: "copilot" }`؛ راجع [البدء السريع](#quickstart). من دون هذا الاشتراك الصريح، يستخدم OpenClaw موفّر GitHub Copilot المدمج ولا يثبّت Plugin هذا مطلقًا.

تحلّ بيئة التشغيل SDK بالترتيب الآتي:

1. `import("@github/copilot-sdk")` من حزمة `@openclaw/copilot` المثبّتة.
2. دليل الرجوع `~/.openclaw/npm-runtime/copilot/` (هدف التثبيت القديم عند الطلب).

يؤدي فقدان SDK إلى ظهور خطأ واحد بالرمز `COPILOT_SDK_MISSING` مع أمر إعادة التثبيت أعلاه.

## البدء السريع

ثبّت نموذجًا واحدًا (أو موفّرًا واحدًا) على الحاضنة:

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

اضبط `agentRuntime.id` في إدخال نموذج واحد لتوجيه ذلك النموذج وحده عبر الحاضنة، أو اضبطه على موفّر لتوجيه كل نموذج تابع لذلك الموفّر.

يمثّل `github-copilot/auto` نقطة البداية القابلة للنقل. تعتمد نماذج Copilot المسماة على الحساب وسياسة المؤسسة؛ تأكد من أن Copilot CLI المصادَق عليه يعرض النموذج فعلًا قبل تثبيته.

## الموفّرون المدعومون

تدعم الحاضنة موفّر `github-copilot` القياسي (المملوك لـ`extensions/github-copilot`)، إضافةً إلى إدخالات `models.providers` المخصصة عندما يحتوي النموذج على `baseUrl` غير فارغ وأحد أشكال `api` الآتية:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (إكمالات متوافقة مع OpenAI)
- `openai-completions`
- `openai-responses`

تظل معرّفات الموفّرين الأصليين (`openai`، و`anthropic`، و`google`، و`ollama`) مملوكة لبيئات تشغيلها الأصلية. استخدم معرّف موفّر مخصصًا ومختلفًا لتوجيه نقطة نهاية عبر Copilot BYOK بدلًا من ذلك.

يجب أن تكون نقاط نهاية Copilot BYOK عناوين HTTPS عامة. تمنح الحاضنة Copilot SDK وكيل local loopback لكل محاولة، ثم تمرّر حركة مرور الموفّر عبر مسار الجلب المحمي في OpenClaw حتى تظل سياسة تثبيت DNS ومنع SSRF مملوكة لـOpenClaw. استخدم بيئة تشغيل OpenClaw الأصلية لخوادم نماذج Ollama المحلية أو LM Studio أو خوادم الشبكة المحلية.

## BYOK

يستخدم Copilot BYOK عقد الموفّر المخصص على مستوى الجلسة في SDK. يمرّر OpenClaw نقطة نهاية النموذج المحلولة، ومفتاح API، ووضع رمز الحامل، والترويسات، ومعرّف النموذج، وحدود السياق/المخرجات؛ بينما يظل منطق نقل الموفّر في SDK لا في النواة.

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

تُفهرس جلسات BYOK بصورة منفصلة عن جلسات الاشتراك وعن نقاط نهاية BYOK أو بيانات اعتمادها الأخرى. يؤدي تدوير المفتاح أو الترويسات أو النموذج أو نقطة النهاية إلى بدء جلسة Copilot SDK جديدة بدلًا من استئناف حالة غير متوافقة.

## المصادقة

ترتيب الأولوية، ويُطبّق لكل وكيل أثناء `runCopilotAttempt`:

1. **القيمة الصريحة `useLoggedInUser: true`** في مدخلات المحاولة — تستخدم مستخدم Copilot CLI المسجّل دخوله ضمن `copilotHome` الخاص بالوكيل.
2. **القيمة الصريحة `gitHubToken`** في مدخلات المحاولة (تتطلب `profileId` + ‏`profileVersion`). وهي مخصصة لاستدعاءات CLI المباشرة والاختبارات التي تحتاج إلى تجاوز حل ملف تعريف المصادقة.
3. **القيمتان `resolvedApiKey` + ‏`authProfileId` المحلولتان وفق العقد** — المسار الرئيسي في بيئة الإنتاج. تحلّ النواة ملف تعريف مصادقة `github-copilot` المضبوط للوكيل (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) قبل استدعاء الحاضنة، وبذلك يعمل ملف تعريف مصادقة `github-copilot:<profile>` من البداية إلى النهاية في الإعدادات دون واجهة، أو Cron، أو متعددة الملفات الشخصية من دون متغيرات بيئة.
4. **الرجوع إلى متغيرات البيئة**، مع فحصها بالترتيب الآتي (تفوز أول قيمة غير فارغة، وتُعد السلاسل الفارغة غير موجودة؛ وهذا يعكس أولوية موفّر `github-copilot` المشحون في `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN` — تجاوز خاص بالحاضنة؛ يتيح لك تثبيت رمز لحاضنة OpenClaw من دون إرباك إعداد `gh` / ‏Copilot CLI على مستوى النظام.
   2. `COPILOT_GITHUB_TOKEN` — متغير البيئة القياسي لـCopilot SDK / ‏CLI.
   3. `GH_TOKEN` — متغير البيئة القياسي لـ`gh` CLI.
   4. `GITHUB_TOKEN` — رجوع عام لرمز GitHub.

   يكون معرّف ملف التعريف المركّب في المجمّع هو `env:<NAME>`؛ وإصدار ملف التعريف هو بصمة sha256 غير قابلة للعكس للرمز، ولذلك يؤدي تدوير قيمة البيئة إلى إبطال مجمّع العملاء بصورة سليمة.

5. **القيمة الافتراضية `useLoggedInUser`** عند عدم توفر أي إشارة لرمز.

يحصل كل وكيل على `copilotHome` خاص به حتى لا تتسرّب رموز Copilot CLI وجلساته وإعداداته مطلقًا بين الوكلاء على الجهاز نفسه. القيمة الافتراضية:
`<agentDir>/copilot` (تُبقي حالة SDK خارج الدليل نفسه الذي يحتوي ملفات `models.json` / ‏`auth-profiles.json` الخاصة بـOpenClaw)، أو
`~/.openclaw/agents/<agentId>/copilot` عند عدم توفير دليل للوكيل.
يمكنك تجاوزها باستخدام `copilotHome: <path>` في مدخلات المحاولة لتحديد موقع مخصص (مثل نقطة تحميل مشتركة للترحيل).

تستخدم اختبارات الحاضنة الحية `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` لتوفير رمز مباشر. ينظّف إعداد الاختبارات الحية المشترك `COPILOT_GITHUB_TOKEN` و`GH_TOKEN` و`GITHUB_TOKEN` بعد تجهيز ملفات تعريف المصادقة الحقيقية في دليل الاختبار المعزول، ولذلك يؤدي تمرير قيمة `gh auth token` عبر المتغير المخصص إلى تجنّب عمليات التخطي الخاطئة من دون تسريبها إلى مجموعات اختبار غير ذات صلة.

## سطح الإعداد

تقرأ الحاضنة الإعداد من مدخلات كل محاولة (`runCopilotAttempt({...})`) إضافةً إلى مجموعة صغيرة من قيم البيئة الافتراضية داخل `extensions/copilot/src/`:

| الحقل                    | الغرض                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | دليل حالة CLI لكل وكيل (القيم الافتراضية أعلاه).                                                                                                                                                                                                                                                 |
| `model`                  | سلسلة أو `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. احذفه لاستخدام اختيار النموذج المعتاد للوكيل؛ وتتحقق الحاضنة من أن الموفّر المحلول مدعوم.                                                                                                                   |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. يُطابق نتيجة حل `ThinkLevel` / ‏`ReasoningLevel` في OpenClaw داخل `auto-reply/thinking.ts`.                                                                                                                                                          |
| `infiniteSessionConfig`  | تجاوز اختياري لكتلة `infiniteSessions` في SDK التي يشغّلها `harness.compact`. يمكن تركه كما هو بأمان.                                                                                                                                                                                        |
| `hooksConfig`            | إعداد اختياري وأصلي لـ`SessionHooks` في Copilot SDK لاستدعاءات الأدوات/MCP وموجّه المستخدم والجلسة والأخطاء. وهو منفصل عن خطافات دورة الحياة القابلة للنقل في OpenClaw.                                                                                                                                   |
| `permissionPolicy`       | تجاوز اختياري لمعالج `onPermissionRequest` في SDK لأنواع أدوات SDK المدمجة (`shell`، و`write`، و`read`، و`url`، و`mcp`، و`memory`، و`hook`). القيمة الافتراضية هي `rejectAllPolicy` بوصفها شبكة أمان؛ راجع [الأذونات وask_user](#permissions-and-ask_user) لمعرفة سبب عدم تشغيلها فعليًا مطلقًا. |
| `enableSessionTelemetry` | علامة اختيارية لقياس بيانات جلسة SDK.                                                                                                                                                                                                                                                            |

لا تحتاج خطافات Plugin في OpenClaw إلى أي إعداد خاص بـCopilot على مستوى المحاولة. تشغّل الحاضنة `before_prompt_build` (وخطاف التوافق القديم `before_agent_start`)، و`llm_input`، و`llm_output`، و`agent_end` عبر مساعدات الحاضنة القياسية. كما تشغّل عمليات Compaction الناجحة في SDK الخطافين `before_compaction` و`after_compaction`. تشغّل أدوات OpenClaw الموصولة بجسر `before_tool_call` وتبلّغ `after_tool_call`؛ ويظل `hooksConfig` مخصصًا لاستدعاءات SDK الأصلية فقط التي ليس لها مكافئ قابل للنقل.

لا يحتاج أي جزء آخر من OpenClaw إلى معرفة هذه الحقول. لا ترى Plugins الأخرى والقنوات وكود النواة سوى الشكل القياسي `AgentHarnessAttemptParams` / ‏`AgentHarnessAttemptResult`.

## Compaction

عند تشغيل `harness.compact`، تقوم حاضنة Copilot SDK بما يأتي:

1. تستأنف جلسة SDK المتعقبة من دون متابعة العمل المعلّق.
2. تستدعي RPC الخاص بضغط السجل على مستوى الجلسة في SDK.
3. تعيد نتيجة Compaction في SDK من دون كتابة ملفات علامات توافق ضمن مساحة العمل.

تستمر نسخة سجل OpenClaw (أدناه) في تلقي الرسائل اللاحقة لعملية Compaction، بحيث يظل سجل الدردشة الموجّه للمستخدم متسقًا.

## نسخ السجل

يكتب `runCopilotAttempt` نسخة مزدوجة من رسائل كل دورة القابلة للنسخ إلى سجل تدقيق OpenClaw عبر
`extensions/copilot/src/dual-write-transcripts.ts`. ويكون نطاق النسخة محددًا لكل جلسة (`copilot:${sessionId}`)، ومفتاحها محددًا لكل رسالة
(`${role}:${sha256_16(role,content)}`)، ولذلك تتصادم إدخالات الدورات السابقة المعاد إصدارها مع المفاتيح الموجودة على القرص بدلًا من تكرارها.

تُحيط بالمرآة طبقتان لاحتواء الأعطال، بحيث لا يؤدي فشل كتابة النص المنسوخ
إلى إفشال المحاولة مطلقًا: غلاف داخلي قائم على بذل أفضل جهد، بالإضافة إلى
`.catch(...)` للدفاع المتعمق على مستوى المحاولة. تُسجَّل الأعطال، ولا
تُعرَض.

## الأسئلة الجانبية (`/btw`)

الأمر `/btw` **ليس** أصليًا في حاضنة الاختبار هذه. تتعمد
`createCopilotAgentHarness()` ترك `harness.runSideQuestion` غير معرّف
(كما هو مؤكَّد في `extensions/copilot/harness.test.ts` ضمن `describe("runSideQuestion")`)،
لذلك يتراجع موزّع `/btw` في OpenClaw (`src/agents/btw.ts`) إلى المسار نفسه
الذي يستخدمه لكل بيئة تشغيل غير Codex: يُستدعى موفّر النموذج المُعدّ مباشرةً
باستخدام مطالبة قصيرة لسؤال جانبي، ثم يُعاد الرد عبر البث باستخدام
`streamSimple` (من دون جلسة CLI ومن دون خانة إضافية في المجمّع).

يُبقي هذا جلسات Copilot CLI مخصّصة لحلقة الدور الرئيسية للوكيل، ويجعل
سلوك `/btw` مطابقًا لسلوكه في بيئات التشغيل الأخرى غير Codex.

## Doctor

يُحمَّل `extensions/copilot/doctor-contract-api.ts` تلقائيًا بواسطة
`src/plugins/doctor-contract-registry.ts`. ويساهم بما يلي:

- `legacyConfigRules` فارغ (لا توجد حقول متقاعدة حتى الآن).
- `normalizeCompatibilityConfig` بلا عمليات (مُحتفَظ به كي يكون لعمليات
  تقاعد الحقول مستقبلًا موضع ثابت داخل الشجرة).
- إدخال واحد في `sessionRouteStateOwners`: الموفّر `github-copilot`، وبيئة
  التشغيل `copilot`، ومفتاح جلسة CLI‏ `copilot`، وبادئة ملف تعريف المصادقة
  `github-copilot:`.

## القيود

- تطالب حاضنة الاختبار بالمعرّف `github-copilot` بالإضافة إلى معرّفات موفّري
  BYOK المخصّصة غير المملوكة. تبقى معرّفات الموفّرين الأصليين المملوكة لبيان
  التعريف ضمن بيئة التشغيل المالكة لها، حتى عند فرض `agentRuntime.id` على
  القيمة `copilot`.
- لا توجد واجهة TUI؛ تظل واجهة TUI الخاصة بـ PI هي البديل الاحتياطي لبيئات
  التشغيل التي لا تملك واجهة نظيرة.
- لا تُرحَّل حالة جلسة PI عندما ينتقل وكيل إلى `copilot`.
  يجري الاختيار لكل محاولة؛ وتظل جلسات PI الحالية صالحة.
- يستخدم `ask_user` مسار المطالبة والرد نفسه في OpenClaw الذي تستخدمه
  حاضنة Codex: عندما تطلب Copilot SDK إدخالًا من المستخدم، ينشر OpenClaw
  مطالبة حاجبة إلى القناة النشطة/واجهة TUI، وتحل رسالة المستخدم التالية
  في قائمة الانتظار طلب SDK.

## الأذونات وask_user

يحدث فرض الأذونات لأدوات OpenClaw الموصولة **داخل غلاف الأداة**، وليس عبر
رد النداء `onPermissionRequest` الخاص بـ SDK. تطبّق
`createOpenClawCodingTools` على كل أداة برمجية الغلاف نفسه
`wrapToolWithBeforeToolCallHook` الذي تستخدمه PI
(`src/agents/agent-tools.before-tool-call.ts`): كشف الحلقات، وسياسات
Plugins الموثوقة، وخطافات ما قبل استدعاء الأداة، وموافقات Plugins ثنائية
المرحلة عبر Gateway (`plugin.approval.request`)؛ وكلها تمر عبر مسار الشيفرة
نفسه تمامًا الذي تمر به محاولات PI الأصلية.

تُعلَّم أداة SDK التي يعيدها `convertOpenClawToolToSdkTool` بما يلي:

- `overridesBuiltInTool: true` — تستبدل أداة Copilot CLI المضمّنة التي تحمل
  الاسم نفسه (edit، read، write، bash، ...) بحيث يُعاد توجيه كل استدعاء
  للأداة إلى OpenClaw.
- `skipPermission: true` — تطلب من SDK عدم تشغيل
  `onPermissionRequest({kind: "custom-tool"})` قبل استدعاء الأداة. تنفّذ
  `execute()` المغلّفة بالفعل فحص سياسة OpenClaw الأكثر شمولًا؛ إذ إن مطالبة
  على مستوى SDK ستتجاوز فرض OpenClaw (السماح للكل) أو تحظر كل استدعاء
  للأدوات (رفض الكل)، ولا يطابق أي منهما التكافؤ مع PI.

تستخدم حاضنة Codex داخل الشجرة التقسيم نفسه: تُغلَّف أدوات OpenClaw الموصولة
(`extensions/codex/src/app-server/dynamic-tools.ts`)، وتُوجَّه أنواع الموافقة
الأصلية الخاصة بـ codex-app-server
(`item/commandExecution/requestApproval`، و`item/fileChange/requestApproval`،
و`item/permissions/requestApproval`) عبر `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). والمكافئ لذلك في
Copilot SDK، وهو `rejectAllPolicy` المغلق عند الفشل لأي نوع غير
`custom-tool` يصل في أي وقت إلى `onPermissionRequest`، يمثّل شبكة الأمان
نفسها، ولا يعمل عمليًا مطلقًا لأن `overridesBuiltInTool: true` تزيح كل أداة
مضمّنة.

لكي تتخذ طبقة الأدوات المغلّفة قرارات سياسة مكافئة لـ PI، تمرّر حاضنة
الاختبار سياق أدوات محاولة PI الكامل إلى `createOpenClawCodingTools`:
الهوية (`senderIsOwner`، و`memberRoleIds`، و`ownerOnlyToolAllowlist`، ...)،
والقناة/التوجيه (`groupId`، و`currentChannelId`، و`replyToMode`، ومفاتيح
تبديل أدوات الرسائل)، والمصادقة (`authProfileStore`)، وهوية التشغيل
(`sessionKey` / `runSessionKey` المشتقان من `sandboxSessionKey`، و`runId`)،
وسياق النموذج (`modelApi`، و`modelContextWindowTokens`، و`modelCompat`،
و`modelHasVision`)، وخطافات التشغيل (`onToolOutcome`، و`onYield`). من دون
هذه الحقول، ترفض قوائم السماح الخاصة بالمالك فقط افتراضيًا وبصمت، ولا
يمكن لسياسات الثقة في Plugins تحديد النطاق الصحيح، وتُحل
`session_status: "current"` إلى مفتاح بيئة اختبار معزولة قديم. منشئ الجسر
هو `extensions/copilot/src/tool-bridge.ts`، ويحاكي الاستدعاء المرجعي الخاص
بـ PI في `src/agents/embedded-agent-runner/run/attempt.ts:1262`.
يحل `runAttempt` سياق بيئة الاختبار المعزولة عبر نقطة الربط المشتركة
`resolveSandboxContext`، ويمرّر إلى SDK دليل عمل فعّالًا، كما يمرّر `sandbox`
بالإضافة إلى مساحة عمل إنشاء الوكيل الفرعي إلى جسر الأدوات. ويمرّر الجسر
أيضًا عناصر التحكم المحدودة في إنشاء الأدوات التي يمكنه فرضها عند حدود SDK:
`includeCoreTools`، وقائمة السماح لأدوات بيئة التشغيل، و`toolConstructionPlan`.

يستخدم الجسر أيضًا مساعد سطح أدوات حاضنة الاختبار المشترك من
`openclaw/plugin-sdk/agent-harness-tool-runtime` لتحقيق التكافؤ مع PI. عند
تمكين البحث عن الأدوات، ترى SDK أدوات تحكم مدمجة بالإضافة إلى منفّذ مخفي
للفهرس بدلًا من كل مخططات أدوات OpenClaw. وعند تمكين وضع الشيفرة، يبني
المساعد سطح تحكم وضع الشيفرة نفسه ودورة حياة الفهرس المستخدمة في حاضنات
الوكلاء الأخرى. وتظل الإعدادات الافتراضية الخفيفة للنماذج المحلية، وتصفية
المخططات المتوافقة مع بيئة التشغيل، وتهيئة الأدلة، وتنظيف الفهرس، كلها في
المساعد المشترك كي لا تنحرف حاضنات Copilot والحاضنات المرتبطة بـ Codex عن
بعضها.

### رمز GitHub على مستوى الجلسة

يميّز عقد Copilot SDK بين رمز GitHub **على مستوى العميل**
(`CopilotClientOptions.gitHubToken`، الذي يصادق عملية CLI نفسها) والرمز
**على مستوى الجلسة** (`SessionConfig.gitHubToken`، الذي يحدد استبعاد
المحتوى وتوجيه النموذج والحصة لتلك الجلسة؛ ويُعتمد في كل من
`createSession` و`resumeSession`). تحل حاضنة الاختبار المصادقة مرة واحدة
عبر `resolveCopilotAuth` وتضبط كلا الحقلين عندما يكون وضع المصادقة
`gitHubToken` (أي `auth.gitHubToken` صريح أو `resolvedApiKey` محلول وفق
العقد من ملف تعريف مصادقة `github-copilot` مُعدّ). وعندما يكون الوضع
المحلول `useLoggedInUser`، يُحذف الحقل على مستوى الجلسة لكي تواصل SDK
اشتقاق الهوية من هوية المستخدم المسجّل دخوله.

يستخدم `ask_user` الدالة `SessionConfig.onUserInputRequest`. يقبل الجسر
فهارس الخيارات أو تسمياتها لطلبات الاختيار الثابت، ويقبل الإجابات الحرة
عندما يسمح بها طلب SDK، ويلغي طلبًا معلّقًا عند إيقاف محاولة OpenClaw.

## ذو صلة

- [بيئات تشغيل الوكلاء](/ar/concepts/agent-runtimes)
- [حاضنة Codex](/ar/plugins/codex-harness)
- [Plugins حاضنة الوكلاء (مرجع SDK)](/ar/plugins/sdk-agent-harness)
