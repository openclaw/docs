---
read_when:
    - تشغيل أحزمة البرمجة عبر ACP
    - إعداد جلسات ACP المرتبطة بالمحادثة على قنوات المراسلة
    - ربط محادثة في قناة مراسلة بجلسة ACP دائمة
    - استكشاف أخطاء الواجهة الخلفية ACP أو ربط Plugin أو تسليم الإكمال وإصلاحها
    - تشغيل أوامر `/acp` من الدردشة
sidebarTitle: ACP agents
summary: شغّل أحزمة البرمجة الخارجية (Claude Code وCursor وGemini CLI وCodex ACP الصريح وOpenClaw ACP وOpenCode) عبر الواجهة الخلفية ACP
title: وكلاء ACP
x-i18n:
    generated_at: "2026-04-26T11:40:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3b8550be4cf0da2593b0770e302833e1722820d3c922e5508a253685cd0cb6b
    source_path: tools/acp-agents.md
    workflow: 15
---

تسمح جلسات [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
لـ OpenClaw بتشغيل أحزمة البرمجة الخارجية (مثل Pi وClaude Code و
Cursor وCopilot وDroid وOpenClaw ACP وOpenCode وGemini CLI وغيرها من
أحزمة ACPX المدعومة) عبر Plugin واجهة خلفية لـ ACP.

يتم تتبع كل عملية spawn لجلسة ACP باعتبارها [مهمة خلفية](/ar/automation/tasks).

<Note>
**ACP هو مسار الأحزمة الخارجية، وليس مسار Codex الافتراضي.** يملك
Plugin الخاص بـ Codex app-server الأصلي عناصر التحكم `/codex ...` و
runtime المضمّنة `agentRuntime.id: "codex"`؛ بينما يملك ACP
عناصر التحكم `/acp ...` وجلسات `sessions_spawn({ runtime: "acp" })`.

إذا كنت تريد أن يتصل Codex أو Claude Code كعميل MCP خارجي
مباشرةً بمحادثات قنوات OpenClaw الحالية، فاستخدم
[`openclaw mcp serve`](/ar/cli/mcp) بدلًا من ACP.
</Note>

## أي صفحة أريد؟

| تريد أن…                                                                                      | استخدم هذا                              | ملاحظات                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| تربط Codex أو تتحكم به في المحادثة الحالية                                                    | `/codex bind`، `/codex threads`         | مسار Codex app-server الأصلي عندما يكون Plugin `codex` مفعّلًا؛ ويتضمن ردود الدردشة المرتبطة، وتمرير الصور، وmodel/fast/الأذونات، وعناصر التحكم في الإيقاف والتوجيه. ويكون ACP بديلًا صريحًا |
| تشغّل Claude Code أو Gemini CLI أو Codex ACP الصريح أو harness خارجيًا آخر _عبر_ OpenClaw    | هذه الصفحة                               | جلسات مرتبطة بالدردشة، و`/acp spawn`، و`sessions_spawn({ runtime: "acp" })`، والمهام الخلفية، وعناصر التحكم في runtime                                                                          |
| تعرّض جلسة OpenClaw Gateway _بوصفها_ خادم ACP لمحرر أو عميل                                   | [`openclaw acp`](/ar/cli/acp)              | وضع الجسر. يتحدث IDE/العميل عبر ACP إلى OpenClaw من خلال stdio/WebSocket                                                                                                                        |
| تعيد استخدام AI CLI محلي كـ model احتياطية نصية فقط                                          | [CLI Backends](/ar/gateway/cli-backends)   | ليس ACP. لا توجد أدوات OpenClaw، ولا عناصر تحكم ACP، ولا runtime harness                                                                                                                         |

## هل يعمل هذا مباشرةً؟

عادةً نعم. تأتي التثبيتات الجديدة مع Plugin runtime المضمّنة `acpx`
مفعلة افتراضيًا مع binary مثبتة بإصدار محدد خاصة بالـ Plugin لـ `acpx` يقوم OpenClaw بفحصها
وإصلاحها ذاتيًا عند بدء التشغيل. شغّل `/acp doctor` لإجراء فحص جاهزية.

لا يعرّف OpenClaw الوكلاء على إنشاء ACP إلا عندما تكون ACP **قابلة
للاستخدام فعليًا**: يجب أن تكون ACP مفعلة، وألا يكون dispatch معطّلًا، وألا
تكون الجلسة الحالية محظورة بواسطة sandbox، وأن تكون واجهة runtime الخلفية
محملة. وإذا لم تتحقق هذه الشروط، فستبقى Skills الخاصة بـ ACP في Plugins
وإرشادات ACP الخاصة بـ `sessions_spawn` مخفية حتى لا يقترح
الوكيل واجهة خلفية غير متاحة.

<AccordionGroup>
  <Accordion title="مشكلات التشغيل الأول">
    - إذا كانت `plugins.allow` مضبوطة، فهي تمثل قائمة جرد تقييدية للـ Plugins ويجب **أن** تتضمن `acpx`؛ وإلا فسيُحظر الافتراضي المضمّن عمدًا وسيبلغ `/acp doctor` عن غياب إدخال allowlist.
    - قد يتم جلب محولات harness الهدف (Codex وClaude وما إلى ذلك) عند الطلب باستخدام `npx` في أول مرة تستخدمها فيها.
    - لا تزال مصادقة المورد مطلوبة على المضيف لتلك harness.
    - إذا لم يكن لدى المضيف npm أو وصول إلى الشبكة، فسيفشل جلب المحولات في التشغيل الأول حتى يتم تسخين الذاكرات المؤقتة مسبقًا أو تثبيت المحول بطريقة أخرى.
  </Accordion>
  <Accordion title="المتطلبات الأساسية لوقت التشغيل">
    يطلق ACP عملية harness خارجية حقيقية. يملك OpenClaw التوجيه،
    وحالة المهام الخلفية، والتسليم، والروابط، والسياسة؛ بينما تملك harness
    تسجيل الدخول إلى provider، وفهرس model، وسلوك نظام الملفات،
    والأدوات الأصلية.

    قبل لوم OpenClaw، تحقّق من:

    - أن `/acp doctor` يبلغ عن واجهة خلفية مفعلة وسليمة.
    - أن target id مسموح بها بواسطة `acp.allowedAgents` عندما تكون allowlist هذه مضبوطة.
    - أن أمر harness يمكن أن يبدأ على مضيف Gateway.
    - أن مصادقة provider موجودة لتلك harness ‏(`claude`، و`codex`، و`gemini`، و`opencode`، و`droid`، وما إلى ذلك).
    - أن model المحددة موجودة لتلك harness — فمعرّفات model غير قابلة للنقل بين harnesses.
    - أن `cwd` المطلوبة موجودة ويمكن الوصول إليها، أو احذف `cwd` ودع الواجهة الخلفية تستخدم قيمتها الافتراضية.
    - أن وضع الأذونات يطابق العمل. فالجلسات غير التفاعلية لا تستطيع النقر على مطالبات الأذونات الأصلية، لذلك فإن تشغيلات البرمجة الكثيفة بالكتابة/التنفيذ تحتاج عادةً إلى ملف أذونات ACPX يمكنه المتابعة دون واجهة.

  </Accordion>
</AccordionGroup>

لا يتم تعريض أدوات Plugins الخاصة بـ OpenClaw والأدوات المضمّنة في OpenClaw
لأحزمة ACP افتراضيًا. فعّل جسور MCP الصريحة في
[وكلاء ACP — الإعداد](/ar/tools/acp-agents-setup) فقط عندما
ينبغي أن تستدعي harness تلك الأدوات مباشرةً.

## أهداف harness المدعومة

مع الواجهة الخلفية المضمّنة `acpx`، استخدم معرّفات harness هذه بصيغة `/acp spawn <id>`
أو كأهداف لـ `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| معرّف Harness | الواجهة الخلفية المعتادة                       | ملاحظات                                                                                 |
| ------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `claude`      | محول Claude Code ACP                           | يتطلب مصادقة Claude Code على المضيف.                                                    |
| `codex`       | محول Codex ACP                                 | بديل ACP صريح فقط عندما لا يكون `/codex` الأصلي متاحًا أو عند طلب ACP.                 |
| `copilot`     | محول GitHub Copilot ACP                        | يتطلب مصادقة Copilot CLI/runtime.                                                       |
| `cursor`      | Cursor CLI ACP ‏(`cursor-agent acp`)           | تجاوز أمر acpx إذا كان التثبيت المحلي يعرّض نقطة دخول ACP مختلفة.                      |
| `droid`       | Factory Droid CLI                              | يتطلب مصادقة Factory/Droid أو `FACTORY_API_KEY` في بيئة harness.                        |
| `gemini`      | محول Gemini CLI ACP                            | يتطلب مصادقة Gemini CLI أو إعداد API key.                                               |
| `iflow`       | iFlow CLI                                      | يعتمد توفر المحول والتحكم في model على CLI المثبتة.                                     |
| `kilocode`    | Kilo Code CLI                                  | يعتمد توفر المحول والتحكم في model على CLI المثبتة.                                     |
| `kimi`        | Kimi/Moonshot CLI                              | يتطلب مصادقة Kimi/Moonshot على المضيف.                                                  |
| `kiro`        | Kiro CLI                                       | يعتمد توفر المحول والتحكم في model على CLI المثبتة.                                     |
| `opencode`    | محول OpenCode ACP                              | يتطلب مصادقة OpenCode CLI/provider.                                                     |
| `openclaw`    | جسر OpenClaw Gateway عبر `openclaw acp`        | يتيح لـ harness واعية بـ ACP أن تتحدث مجددًا إلى جلسة OpenClaw Gateway.                |
| `pi`          | Pi/runtime المضمّنة في OpenClaw                | تُستخدم لتجارب harness الأصلية في OpenClaw.                                             |
| `qwen`        | Qwen Code / Qwen CLI                           | يتطلب مصادقة متوافقة مع Qwen على المضيف.                                                |

يمكن تهيئة أسماء مستعارة مخصصة لوكلاء acpx داخل acpx نفسها، لكن
سياسة OpenClaw لا تزال تتحقق من `acp.allowedAgents` وأي
ربط `agents.list[].runtime.acp.agent` قبل dispatch.

## دليل تشغيل للمشغّل

تدفق `/acp` سريع من الدردشة:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    و`/acp spawn gemini --mode persistent --thread auto`، أو الصريح
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="اعمل">
    واصل العمل في المحادثة أو thread المرتبطة
    (أو استهدف session key صراحةً).
  </Step>
  <Step title="تحقق من الحالة">
    `/acp status`
  </Step>
  <Step title="اضبط">
    `/acp model <provider/model>`,
    و`/acp permissions <profile>`,
    و`/acp timeout <seconds>`.
  </Step>
  <Step title="وجّه">
    من دون استبدال السياق: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="أوقف">
    `/acp cancel` (الدور الحالي) أو `/acp close` (الجلسة + الروابط).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="تفاصيل دورة الحياة">
    - ينشئ Spawn جلسة ACP runtime أو يستأنفها، ويسجل بيانات ACP الوصفية في مخزن جلسات OpenClaw، وقد ينشئ مهمة خلفية عندما يكون التشغيل مملوكًا من parent.
    - تنتقل رسائل المتابعة المرتبطة مباشرةً إلى جلسة ACP حتى يتم إغلاق الربط، أو فقدان التركيز، أو إعادة الضبط، أو انتهاء الصلاحية.
    - تبقى أوامر Gateway محلية. ولا تُرسل `/acp ...` و`/status` و`/unfocus` أبدًا كنص prompt عادي إلى harness ACP المرتبطة.
    - يقوم `cancel` بإجهاض الدور النشط عندما تدعم الواجهة الخلفية الإلغاء؛ لكنه لا يحذف الربط أو بيانات الجلسة الوصفية.
    - ينهي `close` جلسة ACP من منظور OpenClaw ويزيل الربط. وقد تحتفظ harness مع ذلك بسجلها upstream الخاص إذا كانت تدعم الاستئناف.
    - تصبح عمال runtime الخاملون مؤهلين للتنظيف بعد `acp.runtime.ttlMinutes`؛ وتبقى بيانات الجلسات الوصفية المخزنة متاحة لـ `/acp sessions`.
  </Accordion>
  <Accordion title="قواعد التوجيه الأصلية لـ Codex">
    المشغلات الطبيعية باللغة التي ينبغي أن تُوجَّه إلى **Plugin Codex
    الأصلية** عندما تكون مفعلة:

    - "اربط قناة Discord هذه بـ Codex."
    - "ألحق هذه الدردشة بـ Codex thread `<id>`."
    - "اعرض Codex threads، ثم اربط هذه."

    يُعد الربط الأصلي لمحادثات Codex هو مسار التحكم الافتراضي في الدردشة.
    وتظل الأدوات الديناميكية في OpenClaw تُنفَّذ عبر OpenClaw، بينما
    تُنفَّذ الأدوات الأصلية لـ Codex مثل shell/apply-patch داخل Codex.
    وبالنسبة إلى أحداث الأدوات الأصلية لـ Codex، يحقن OpenClaw
    مرحّل hooks أصليًا لكل دور بحيث يمكن لPlugins حظر
    `before_tool_call`، ومراقبة `after_tool_call`، وتوجيه أحداث
    `PermissionRequest` الخاصة بـ Codex عبر موافقات OpenClaw. كما تُرحَّل hooks `Stop` الخاصة بـ Codex إلى
    `before_agent_finalize` في OpenClaw، حيث يمكن للـ Plugins طلب
    مرور model مرة إضافية قبل أن ينهي Codex إجابته. ويظل المرحّل
    محافظًا عن عمد: فهو لا يعدّل معاملات الأدوات الأصلية لـ Codex
    ولا يعيد كتابة سجلات Codex thread. استخدم ACP الصريح فقط
    عندما تريد نموذج ACP runtime/session. ويُوثَّق حد الدعم المضمّن لـ Codex في
    [عقد الدعم v1 لـ Codex harness](/ar/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="ورقة غش لاختيار model / provider / runtime">
    - `openai-codex/*` — مسار Codex OAuth/الاشتراك عبر PI.
    - `openai/*` مع `agentRuntime.id: "codex"` — runtime مضمّنة أصلية لـ Codex app-server.
    - `/codex ...` — تحكم أصلي في محادثة Codex.
    - `/acp ...` أو `runtime: "acp"` — تحكم صريح في ACP/acpx.
  </Accordion>
  <Accordion title="مشغلات ACP-routing باللغة الطبيعية">
    المشغلات التي ينبغي أن تُوجَّه إلى ACP runtime:

    - "شغّل هذا كجلسة Claude Code ACP لمرة واحدة ثم لخّص النتيجة."
    - "استخدم Gemini CLI لهذه المهمة في thread، ثم أبقِ المتابعات في تلك thread نفسها."
    - "شغّل Codex عبر ACP في thread خلفية."

    يختار OpenClaw القيمة `runtime: "acp"`، ويحل harness ‏`agentId`,
ويربط بالمحادثة أو thread الحالية عند الدعم، و
يوجّه المتابعات إلى تلك الجلسة حتى الإغلاق/الانتهاء. ولا يتبع Codex
هذا المسار إلا عندما يكون ACP/acpx صريحًا أو عندما يكون Plugin Codex الأصلية
غير متاحة للعملية المطلوبة.

بالنسبة إلى `sessions_spawn`، لا يتم الإعلان عن `runtime: "acp"`
إلا عندما تكون ACP مفعلة، ولا يكون الطالب داخل sandbox، وتكون
واجهة ACP runtime الخلفية محملة. وهي تستهدف معرّفات ACP harness مثل `codex`,
و`claude`، و`droid`، و`gemini`، أو `opencode`. لا تمرر معرّف وكيل
عادي من إعدادات OpenClaw من `agents_list` ما لم يكن هذا الإدخال
مهيأً صراحةً باستخدام `agents.list[].runtime.type="acp"`؛
وإلا فاستخدم runtime الافتراضية الخاصة بالوكيل الفرعي. وعندما يكون وكيل OpenClaw
مهيأً باستخدام `runtime.type="acp"`، يستخدم OpenClaw
`runtime.acp.agent` بوصفه معرّف harness الأساسي.

  </Accordion>
</AccordionGroup>

## ACP مقابل الوكلاء الفرعيين

استخدم ACP عندما تريد runtime harness خارجية. واستخدم **Codex
app-server الأصلي** لربط/التحكم في محادثات Codex عندما يكون Plugin ‏`codex`
مفعّلًا. واستخدم **الوكلاء الفرعيين** عندما تريد
تشغيلات مفوّضة أصلية لـ OpenClaw.

| المجال        | جلسة ACP                              | تشغيل وكيل فرعي                    |
| ------------- | ------------------------------------- | ---------------------------------- |
| runtime       | Plugin واجهة خلفية ACP ‏(مثل acpx)     | runtime أصلية للوكيل الفرعي في OpenClaw |
| session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| الأوامر الرئيسية | `/acp ...`                          | `/subagents ...`                   |
| أداة spawn    | `sessions_spawn` مع `runtime:"acp"`   | `sessions_spawn` ‏(runtime الافتراضية) |

راجع أيضًا [الوكلاء الفرعيين](/ar/tools/subagents).

## كيف يشغّل ACP ‏Claude Code

بالنسبة إلى Claude Code عبر ACP، تكون الطبقات كما يلي:

1. مستوى التحكم في جلسة ACP لدى OpenClaw.
2. Plugin runtime المضمّنة `acpx`.
3. محول Claude ACP.
4. آليات runtime/session على جانب Claude.

إن ACP Claude هي **جلسة harness** مع عناصر تحكم ACP، واستئناف الجلسة،
وتتبع المهام الخلفية، وربط اختياري بالمحادثة/الـ thread.

أما CLI backends فهي runtimes منفصلة محلية احتياطية نصية فقط — راجع
[CLI Backends](/ar/gateway/cli-backends).

وبالنسبة إلى المشغّلين، فالقاعدة العملية هي:

- **هل تريد `/acp spawn`، أو جلسات قابلة للربط، أو عناصر تحكم runtime، أو عمل harness دائم؟** استخدم ACP.
- **هل تريد fallback نصية محلية بسيطة عبر CLI الخام؟** استخدم CLI backends.

## الجلسات المرتبطة

### النموذج الذهني

- **سطح الدردشة** — المكان الذي يواصل فيه الناس الحديث (قناة Discord، أو Telegram topic، أو دردشة iMessage).
- **جلسة ACP** — حالة Codex/Claude/Gemini runtime الدائمة التي يوجّه إليها OpenClaw.
- **thread/topic فرعية** — سطح مراسلة إضافي اختياري يُنشأ فقط بواسطة `--thread ...`.
- **مساحة عمل runtime** — موقع نظام الملفات (`cwd`، أو checkout للمستودع، أو مساحة عمل الواجهة الخلفية) حيث تعمل harness. وهي مستقلة عن سطح الدردشة.

### روابط المحادثة الحالية

يقوم `/acp spawn <harness> --bind here` بتثبيت المحادثة الحالية على
جلسة ACP التي تم إنشاؤها — من دون thread فرعية، وعلى سطح الدردشة نفسه. ويواصل OpenClaw
امتلاك النقل، والمصادقة، والأمان، والتسليم. وتُوجَّه الرسائل اللاحقة في تلك
المحادثة إلى الجلسة نفسها؛ ويقوم `/new` و`/reset` بإعادة ضبط
الجلسة في مكانها؛ بينما يزيل `/acp close` الربط.

أمثلة:

```text
/codex bind                                              # ربط Codex الأصلي، وتوجيه الرسائل المستقبلية إلى هنا
/codex model gpt-5.4                                     # ضبط Codex thread الأصلية المرتبطة
/codex stop                                              # التحكم في Codex turn الأصلية النشطة
/acp spawn codex --bind here                             # fallback صريحة لـ Codex عبر ACP
/acp spawn codex --thread auto                           # قد ينشئ thread/topic فرعية ويربط هناك
/acp spawn codex --bind here --cwd /workspace/repo       # الربط في الدردشة نفسها، ويعمل Codex في /workspace/repo
```

<AccordionGroup>
  <Accordion title="قواعد الربط والحصرية">
    - الخياران `--bind here` و`--thread ...` متنافيان.
    - لا يعمل `--bind here` إلا على القنوات التي تعلن دعم الربط بالمحادثة الحالية؛ وإلا يعيد OpenClaw رسالة واضحة بعدم الدعم. وتستمر الروابط عبر عمليات إعادة تشغيل gateway.
    - في Discord، لا يكون `spawnAcpSessions` مطلوبًا إلا عندما يحتاج OpenClaw إلى إنشاء child thread من أجل `--thread auto|here` — وليس من أجل `--bind here`.
    - إذا أنشأت spawn إلى ACP agent مختلفة من دون `--cwd`، يرث OpenClaw **مساحة عمل الوكيل المستهدف** افتراضيًا. أما المسارات الموروثة المفقودة (`ENOENT`/`ENOTDIR`) فتعود إلى افتراضي الواجهة الخلفية؛ بينما تظهر أخطاء الوصول الأخرى (مثل `EACCES`) كأخطاء spawn.
    - تبقى أوامر إدارة Gateway محلية في المحادثات المرتبطة — إذ يتعامل OpenClaw مع أوامر `/acp ...` حتى عندما يُوجَّه نص المتابعة العادي إلى جلسة ACP المرتبطة؛ كما يبقى `/status` و`/unfocus` محليين أيضًا كلما كان التعامل مع الأوامر مفعّلًا لهذا السطح.
  </Accordion>
  <Accordion title="الجلسات المرتبطة بالـ thread">
    عندما تكون روابط الـ thread مفعلة لمحول القناة:

    - يقوم OpenClaw بربط thread بجلسة ACP مستهدفة.
    - تُوجَّه رسائل المتابعة في تلك thread إلى جلسة ACP المرتبطة.
    - يُسلَّم خرج ACP إلى thread نفسها.
    - تؤدي أوامر unfocus/close/archive/idle-timeout أو انتهاء الصلاحية بسبب max-age إلى إزالة الربط.
    - إن `/acp close` و`/acp cancel` و`/acp status` و`/status` و`/unfocus` هي أوامر Gateway، وليست prompts إلى ACP harness.

    علامات الميزات المطلوبة لـ ACP المرتبطة بالـ thread:

    - `acp.enabled=true`
    - تكون `acp.dispatch.enabled` مفعلة افتراضيًا (اضبطها على `false` لإيقاف dispatch الخاصة بـ ACP مؤقتًا).
    - تفعيل علامة إنشاء ACP thread في محول القناة (خاصة بكل محول):
      - Discord: ‏`channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: ‏`channels.telegram.threadBindings.spawnAcpSessions=true`

    يكون دعم ربط الـ thread خاصًا بكل محول. وإذا لم يكن محول القناة
    النشط يدعم روابط الـ thread، فسيعيد OpenClaw رسالة واضحة
    تفيد بعدم الدعم/عدم التوفر.

  </Accordion>
  <Accordion title="القنوات التي تدعم الـ thread">
    - أي محول قناة يعرّض قدرة ربط الجلسة/الـ thread.
    - الدعم المضمّن الحالي: **Discord** ‏threads/channels، و**Telegram** ‏topics ‏(forum topics في المجموعات/supergroups وDM topics).
    - يمكن لقنوات Plugins إضافة الدعم من خلال واجهة الربط نفسها.
  </Accordion>
</AccordionGroup>

## الروابط الدائمة للقنوات

بالنسبة إلى تدفقات العمل غير المؤقتة، هيّئ روابط ACP دائمة في
إدخالات top-level ‏`bindings[]`.

### نموذج الربط

<ParamField path="bindings[].type" type='"acp"'>
  يضع علامة على ربط دائم لمحادثة ACP.
</ParamField>
<ParamField path="bindings[].match" type="object">
  يحدد المحادثة المستهدفة. وتكون البُنى خاصة بكل قناة:

- **قناة/Thread في Discord:** ‏`match.channel="discord"` + ‏`match.peer.id="<channelOrThreadId>"`
- **Forum topic في Telegram:** ‏`match.channel="telegram"` + ‏`match.peer.id="<chatId>:topic:<topicId>"`
- **رسالة مباشرة/مجموعة في BlueBubbles:** ‏`match.channel="bluebubbles"` + ‏`match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. ويفضَّل `chat_id:*` أو `chat_identifier:*` للروابط المستقرة للمجموعات.
- **رسالة مباشرة/مجموعة في iMessage:** ‏`match.channel="imessage"` + ‏`match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. ويفضَّل `chat_id:*` للروابط المستقرة للمجموعات.
  </ParamField>
  <ParamField path="bindings[].agentId" type="string">
  معرّف وكيل OpenClaw المالك.
  </ParamField>
  <ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  تجاوز ACP اختياري.
  </ParamField>
  <ParamField path="bindings[].acp.label" type="string">
  تسمية اختيارية موجّهة للمشغّل.
  </ParamField>
  <ParamField path="bindings[].acp.cwd" type="string">
  دليل عمل اختياري لـ runtime.
  </ParamField>
  <ParamField path="bindings[].acp.backend" type="string">
  تجاوز اختياري للواجهة الخلفية.
  </ParamField>

### الإعدادات الافتراضية لـ runtime لكل وكيل

استخدم `agents.list[].runtime` لتعريف إعدادات ACP الافتراضية مرة واحدة لكل وكيل:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` ‏(معرّف harness، مثل `codex` أو `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**أولوية التجاوز للجلسات المرتبطة بـ ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. الإعدادات الافتراضية العامة لـ ACP ‏(مثل `acp.backend`)

### مثال

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### السلوك

- يتأكد OpenClaw من وجود جلسة ACP المهيأة قبل الاستخدام.
- تُوجَّه الرسائل في تلك القناة أو الـ topic إلى جلسة ACP المهيأة.
- في المحادثات المرتبطة، يقوم `/new` و`/reset` بإعادة ضبط مفتاح جلسة ACP نفسه في مكانه.
- تظل الروابط المؤقتة لـ runtime ‏(مثل تلك المُنشأة بواسطة تدفقات التركيز على الـ thread) مطبقة عند وجودها.
- بالنسبة إلى ACP spawns بين الوكلاء من دون `cwd` صريحة، يرث OpenClaw مساحة عمل الوكيل المستهدف من إعدادات الوكيل.
- تعود مسارات مساحة العمل الموروثة المفقودة إلى `cwd` الافتراضية للواجهة الخلفية؛ أما إخفاقات الوصول غير المرتبطة بالفقدان فتظهر كأخطاء spawn.

## ابدأ جلسات ACP

توجد طريقتان لبدء جلسة ACP:

<Tabs>
  <Tab title="من sessions_spawn">
    استخدم `runtime: "acp"` لبدء جلسة ACP من دور وكيل أو
    من استدعاء أداة.

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    تكون القيمة الافتراضية لـ `runtime` هي `subagent`، لذا اضبط `runtime: "acp"` صراحةً
    لجلسات ACP. وإذا حُذفت `agentId`، يستخدم OpenClaw
    `acp.defaultAgent` عند تهيئتها. وتتطلب `mode: "session"`
    وجود `thread: true` للإبقاء على محادثة مرتبطة ودائمة.
    </Note>

  </Tab>
  <Tab title="من أمر /acp">
    استخدم `/acp spawn` للتحكم الصريح من المشغّل من داخل الدردشة.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    أهم العلامات:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Tab>
</Tabs>

### معاملات `sessions_spawn`

<ParamField path="task" type="string" required>
  الـ prompt الأولية المرسلة إلى جلسة ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  يجب أن تكون `"acp"` لجلسات ACP.
</ParamField>
<ParamField path="agentId" type="string">
  معرّف harness الهدف في ACP. يعود إلى `acp.defaultAgent` إذا كانت مضبوطة.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  طلب تدفق ربط الـ thread عندما يكون مدعومًا.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  تمثل `"run"` تشغيلًا لمرة واحدة؛ وتمثل `"session"` جلسة دائمة. وإذا كانت `thread: true` وكان
  `mode` محذوفًا، فقد يستخدم OpenClaw السلوك الدائم افتراضيًا حسب
  مسار runtime. وتتطلب `mode: "session"` وجود `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  دليل العمل المطلوب لـ runtime ‏(ويتم التحقق منه بواسطة سياسة
  الواجهة الخلفية/runtime). وإذا حُذف، فإن ACP spawn ترث مساحة عمل
  الوكيل المستهدف عند تهيئتها؛ أما المسارات الموروثة المفقودة فتعود إلى
  الإعدادات الافتراضية للواجهة الخلفية، بينما تُعاد أخطاء الوصول الحقيقية.
</ParamField>
<ParamField path="label" type="string">
  تسمية موجّهة للمشغّل تُستخدم في نص الجلسة/اللافتة.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  استأنف جلسة ACP موجودة بدلًا من إنشاء جلسة جديدة. ويعيد
  الوكيل تشغيل سجل المحادثة عبر `session/load`. ويتطلب هذا
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  تقوم `"parent"` ببث ملخصات تقدم تشغيل ACP الأولي إلى
  جلسة الطالب كأحداث نظام. وتشمل الردود المقبولة
  `streamLogPath` الذي يشير إلى سجل JSONL ضمن نطاق الجلسة
  (`<sessionId>.acp-stream.jsonl`) يمكنك تتبعه للحصول على تاريخ relay الكامل.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  يجهض child turn الخاص بـ ACP بعد N ثانية. وتحافظ القيمة `0` على
  الدور ضمن مسار gateway من دون مهلة. وتُطبَّق القيمة نفسها على Gateway
  التشغيل وعلى ACP runtime حتى لا تشغل الأحزمة المتوقفة/المستنفدة للحصة
  lane الخاصة بالوكيل الأب إلى أجل غير مسمى.
</ParamField>
<ParamField path="model" type="string">
  تجاوز صريح للـ model لجلسة ACP child. تقوم ACP spawns الخاصة بـ Codex
  بتطبيع مراجع OpenClaw Codex مثل `openai-codex/gpt-5.4` إلى إعداد بدء تشغيل Codex
  في ACP قبل `session/new`؛ كما أن الصيغ ذات الشرطة المائلة مثل
  `openai-codex/gpt-5.4/high` تضبط أيضًا جهد الاستدلال في Codex ACP.
  أما الأحزمة الأخرى فيجب أن تعلن عن ACP `models` وأن تدعم
  `session/set_model`; وإلا فإن OpenClaw/acpx تفشل بوضوح بدلًا من
  العودة بصمت إلى الإعداد الافتراضي للوكيل المستهدف.
</ParamField>
<ParamField path="thinking" type="string">
  جهد صريح للتفكير/الاستدلال. بالنسبة إلى Codex ACP، تُربط `minimal` بـ
  جهد منخفض، وتُربط `low`/`medium`/`high`/`xhigh` مباشرة، بينما تؤدي `off`
  إلى حذف تجاوز جهد الاستدلال عند بدء التشغيل.
</ParamField>

## أوضاع bind وthread في Spawn

<Tabs>
  <Tab title="--bind here|off">
    | الوضع  | السلوك                                                                  |
    | ------ | ------------------------------------------------------------------------ |
    | `here` | اربط المحادثة النشطة الحالية في مكانها؛ وافشل إذا لم تكن هناك محادثة نشطة. |
    | `off`  | لا تنشئ ربطًا بالمحادثة الحالية.                                         |

    ملاحظات:

    - يمثّل `--bind here` أبسط مسار للمشغّل من أجل "اجعل هذه القناة أو الدردشة مدعومة بـ Codex."
    - لا ينشئ `--bind here` child thread.
    - يتوفر `--bind here` فقط على القنوات التي تعرّض دعم الربط بالمحادثة الحالية.
    - لا يمكن الجمع بين `--bind` و`--thread` في استدعاء `/acp spawn` نفسه.

  </Tab>
  <Tab title="--thread auto|here|off">
    | الوضع  | السلوك                                                                                              |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | داخل thread نشطة: اربط تلك الـ thread. خارج thread: أنشئ/اربط child thread عند الدعم.             |
    | `here` | اشترط thread النشطة الحالية؛ وافشل إذا لم تكن داخل واحدة.                                           |
    | `off`  | لا ربط. تبدأ الجلسة غير مرتبطة.                                                                     |

    ملاحظات:

    - على الأسطح التي لا تدعم ربط الـ thread، يكون السلوك الافتراضي فعليًا هو `off`.
    - يتطلب spawn المرتبط بالـ thread دعم سياسة القناة:
      - Discord: ‏`channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: ‏`channels.telegram.threadBindings.spawnAcpSessions=true`
    - استخدم `--bind here` عندما تريد تثبيت المحادثة الحالية من دون إنشاء child thread.

  </Tab>
</Tabs>

## نموذج التسليم

يمكن أن تكون جلسات ACP إما مساحات عمل تفاعلية أو أعمالًا خلفية
يملكها parent. ويعتمد مسار التسليم على هذا الشكل.

<AccordionGroup>
  <Accordion title="جلسات ACP التفاعلية">
    المقصود من الجلسات التفاعلية هو الاستمرار في الحديث على سطح
    دردشة مرئي:

    - يقوم `/acp spawn ... --bind here` بربط المحادثة الحالية بجلسة ACP.
    - يقوم `/acp spawn ... --thread ...` بربط channel thread/topic بجلسة ACP.
    - تقوم `bindings[].type="acp"` الدائمة والمهيأة بتوجيه المحادثات المطابقة إلى جلسة ACP نفسها.

    تُوجَّه الرسائل اللاحقة في المحادثة المرتبطة مباشرةً إلى
    جلسة ACP، ويُسلَّم خرج ACP إلى
    القناة/الـ thread/الـ topic نفسها.

    ما الذي يرسله OpenClaw إلى harness:

    - تُرسل المتابعات العادية المرتبطة كنص prompt، مع المرفقات فقط عندما تدعمها harness/backend.
    - تُعترض أوامر الإدارة `/acp` وأوامر Gateway المحلية قبل dispatch إلى ACP.
    - يتم تجسيد أحداث الإكمال التي يولدها runtime لكل هدف. تحصل وكلاء OpenClaw على ظرف سياق runtime الداخلي الخاص بـ OpenClaw؛ أما أحزمة ACP الخارجية فتحصل على prompt عادية تتضمن نتيجة child وتعليمة. ولا ينبغي أبدًا إرسال الظرف الخام `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` إلى أحزمة خارجية أو حفظه كنص transcript لمستخدم ACP.
    - تستخدم إدخالات ACP transcript نص trigger الظاهر للمستخدم أو plain completion prompt. أما بيانات الأحداث الداخلية الوصفية فتظل منظمة داخل OpenClaw حيثما أمكن ولا تُعامل على أنها محتوى دردشة كتبه المستخدم.

  </Accordion>
  <Accordion title="جلسات ACP لمرة واحدة يملكها parent">
    تكون جلسات ACP لمرة واحدة التي يُنشئها تشغيل وكيل آخر أبناءً
    في الخلفية، شبيهة بالوكلاء الفرعيين:

    - يطلب parent العمل باستخدام `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - تعمل child داخل جلسة ACP harness خاصة بها.
    - تعمل child turns على lane الخلفية نفسها المستخدمة في إنشاء الوكلاء الفرعيين الأصليين، بحيث لا تحجب harness ACP البطيئة أعمال الجلسة الرئيسية غير المرتبطة.
    - يعود الإكمال عبر مسار announce الخاص بإكمال المهمة. ويحوّل OpenClaw بيانات الإكمال الداخلية الوصفية إلى ACP prompt عادية قبل إرسالها إلى harness خارجية، بحيث لا ترى الأحزمة علامات سياق runtime الخاصة بـ OpenClaw فقط.
    - يعيد parent صياغة نتيجة child بصوت المساعد العادي عندما تكون هناك حاجة إلى رد موجّه للمستخدم.

    **لا** تتعامل مع هذا المسار على أنه دردشة ندية بين parent
    وchild. فلدى child بالفعل قناة إكمال عائدة إلى
    parent.

  </Accordion>
  <Accordion title="التسليم عبر sessions_send وA2A">
    يمكن لـ `sessions_send` استهداف جلسة أخرى بعد spawn. وبالنسبة إلى
    الجلسات الندية العادية، يستخدم OpenClaw مسار متابعة من وكيل إلى وكيل (A2A)
    بعد حقن الرسالة:

    - انتظر رد الجلسة المستهدفة.
    - اسمح اختياريًا للطالب والهدف بتبادل عدد محدود من أدوار المتابعة.
    - اطلب من الهدف إنتاج رسالة announce.
    - سلّم تلك الرسالة إلى القناة أو الـ thread المرئية.

    يمثل مسار A2A هذا fallback للإرسالات الندية عندما يحتاج المرسل إلى
    متابعة مرئية. ويظل مفعّلًا عندما تستطيع جلسة غير مرتبطة
    رؤية هدف ACP ومراسلته، على سبيل المثال تحت إعدادات
    `tools.sessions.visibility` الواسعة.

    يتخطى OpenClaw متابعة A2A فقط عندما يكون الطالب هو
    parent الخاصة بـ child ACP المملوكة له والمرة الواحدة. ففي هذه الحالة،
    قد يؤدي تشغيل A2A فوق إكمال المهمة إلى إيقاظ parent بنتيجة
    child، ثم إعادة توجيه رد parent إلى داخل child، و
    إنشاء حلقة صدى parent/child. ولهذا تُبلّغ نتيجة `sessions_send`
    بالقيمة `delivery.status="skipped"` في حالة child المملوكة تلك لأن
    مسار الإكمال مسؤول بالفعل عن النتيجة.

  </Accordion>
  <Accordion title="استئناف جلسة موجودة">
    استخدم `resumeSessionId` لمتابعة جلسة ACP سابقة بدلًا من
    البدء من جديد. ويعيد الوكيل تشغيل سجل المحادثة عبر
    `session/load`، بحيث يكمل مع السياق الكامل لما سبق.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    حالات الاستخدام الشائعة:

    - سلّم جلسة Codex من حاسوبك المحمول إلى هاتفك — واطلب من وكيلك المتابعة من حيث توقفت.
    - واصل جلسة برمجة بدأتَها تفاعليًا في CLI، ولكن الآن بشكل headless عبر وكيلك.
    - استكمل عملاً انقطع بسبب إعادة تشغيل gateway أو انتهاء مهلة الخمول.

    ملاحظات:

    - يتطلب `resumeSessionId` وجود `runtime: "acp"` — ويُعيد خطأ إذا استُخدم مع runtime الوكيل الفرعي.
    - تستعيد `resumeSessionId` سجل المحادثة upstream الخاص بـ ACP؛ ولا تزال `thread` و`mode` تُطبَّقان بشكل طبيعي على جلسة OpenClaw الجديدة التي تنشئها، لذا فإن `mode: "session"` لا تزال تتطلب `thread: true`.
    - يجب أن يدعم الوكيل الهدف `session/load` ‏(ويدعمه Codex وClaude Code).
    - إذا لم يُعثر على معرّف الجلسة، فإن spawn تفشل بخطأ واضح — من دون fallback صامتة إلى جلسة جديدة.

  </Accordion>
  <Accordion title="اختبار smoke بعد النشر">
    بعد نشر gateway، شغّل فحصًا حيًا شاملًا بدلًا
    من الاكتفاء بالثقة في اختبارات الوحدة:

    1. تحقّق من إصدار gateway وcommit على المضيف الهدف.
    2. افتح جلسة ACPX bridge مؤقتة إلى وكيل حي.
    3. اطلب من ذلك الوكيل استدعاء `sessions_spawn` مع `runtime: "acp"` و`agentId: "codex"` و`mode: "run"` والمهمة `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. تحقّق من `accepted=yes`، ووجود `childSessionKey` حقيقي، وعدم وجود خطأ من validator.
    5. نظّف جلسة bridge المؤقتة.

    أبقِ الفحص على `mode: "run"` وتجاوز `streamTo: "parent"` —
    فمسارات `mode: "session"` المرتبطة بالـ thread ومسارات relay للبث هي
    جولات تكامل أخرى أغنى ومنفصلة.

  </Accordion>
</AccordionGroup>

## التوافق مع Sandbox

تعمل جلسات ACP حاليًا على runtime المضيف، **وليس** داخل
OpenClaw sandbox.

<Warning>
**الحد الأمني:**

- يمكن لـ harness الخارجية القراءة/الكتابة وفقًا لأذونات CLI الخاصة بها و`cwd` المحددة.
- سياسة sandbox في OpenClaw **لا** تغلف تنفيذ ACP harness.
- لا يزال OpenClaw يفرض بوابات ميزات ACP، والوكلاء المسموح بهم، وملكية الجلسة، وروابط القنوات، وسياسة التسليم في Gateway.
- استخدم `runtime: "subagent"` للأعمال الأصلية الخاصة بـ OpenClaw التي تُفرض عليها sandbox.
  </Warning>

القيود الحالية:

- إذا كانت جلسة الطالب داخل sandbox، فسيتم حظر ACP spawns لكل من `sessions_spawn({ runtime: "acp" })` و`/acp spawn`.
- لا يدعم `sessions_spawn` مع `runtime: "acp"` القيمة `sandbox: "require"`.

## حل هدف الجلسة

تقبل معظم إجراءات `/acp` هدف جلسة اختياريًا (`session-key`,
أو `session-id`، أو `session-label`).

**ترتيب الحل:**

1. وسيطة الهدف الصريحة (أو `--session` في `/acp steer`)
   - تُجرب أولًا المفتاح
   - ثم معرّف الجلسة ذا شكل UUID
   - ثم التسمية
2. ربط الـ thread الحالية (إذا كانت هذه المحادثة/الـ thread مرتبطة بجلسة ACP).
3. fallback إلى جلسة الطالب الحالية.

تشارك كل من الروابط بالمحادثة الحالية وروابط الـ thread في
الخطوة 2.

إذا لم يُحل أي هدف، يعيد OpenClaw خطأ واضحًا
‏(`Unable to resolve session target: ...`).

## عناصر تحكم ACP

| الأمر                | ما الذي يفعله                                             | مثال                                                         |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ينشئ جلسة ACP؛ مع ربط حالي اختياري أو ربط thread.         | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | يلغي الدور الجاري للجلسة المستهدفة.                      | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | يرسل تعليمة توجيه إلى الجلسة الجارية.                    | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | يغلق الجلسة ويفك ربط أهداف الـ thread.                   | `/acp close`                                                  |
| `/acp status`        | يعرض الواجهة الخلفية، والوضع، والحالة، وخيارات runtime، والقدرات. | `/acp status`                                                 |
| `/acp set-mode`      | يضبط وضع runtime للجلسة المستهدفة.                       | `/acp set-mode plan`                                          |
| `/acp set`           | كتابة خيار إعدادات عام لـ runtime.                       | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | يضبط تجاوز دليل العمل لـ runtime.                        | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | يضبط ملف سياسة الموافقة.                                  | `/acp permissions strict`                                     |
| `/acp timeout`       | يضبط مهلة runtime ‏(بالثواني).                            | `/acp timeout 120`                                            |
| `/acp model`         | يضبط تجاوز model لـ runtime.                              | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | يزيل تجاوزات خيارات runtime للجلسة.                       | `/acp reset-options`                                          |
| `/acp sessions`      | يدرج جلسات ACP الحديثة من المخزن.                         | `/acp sessions`                                               |
| `/acp doctor`        | سلامة الواجهة الخلفية، والقدرات، والإصلاحات الممكنة.     | `/acp doctor`                                                 |
| `/acp install`       | يطبع خطوات تثبيت وتفعيل حتمية.                            | `/acp install`                                                |

يعرض `/acp status` خيارات runtime الفعلية بالإضافة إلى معرّفات الجلسات على مستوى runtime
والواجهة الخلفية. وتظهر أخطاء التحكم غير المدعوم
بوضوح عندما تفتقر الواجهة الخلفية إلى capability. ويقرأ `/acp sessions`
المخزن للجلسة المرتبطة الحالية أو جلسة الطالب؛ وتُحل رموز الهدف
‏(`session-key`، أو `session-id`، أو `session-label`) عبر
اكتشاف الجلسات في gateway، بما في ذلك جذور `session.store`
المخصصة لكل وكيل.

### ربط خيارات runtime

تتضمن `/acp` أوامر مريحة وضابطًا عامًا. العمليات
المتكافئة:

| الأمر                        | يرتبط بـ                              | ملاحظات                                                                                                                                                                          |
| ---------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | مفتاح إعدادات runtime ‏`model`        | بالنسبة إلى Codex ACP، يطبع OpenClaw ‏`openai-codex/<model>` إلى معرّف model الخاص بالمحول ويحوّل لواحق الاستدلال ذات الشرطة المائلة مثل `openai-codex/gpt-5.4/high` إلى `reasoning_effort`. |
| `/acp set thinking <level>`  | مفتاح إعدادات runtime ‏`thinking`     | بالنسبة إلى Codex ACP، يرسل OpenClaw قيمة `reasoning_effort` المقابلة عندما يدعمها المحول.                                                                                      |
| `/acp permissions <profile>` | مفتاح إعدادات runtime ‏`approval_policy` | —                                                                                                                                                                                |
| `/acp timeout <seconds>`     | مفتاح إعدادات runtime ‏`timeout`      | —                                                                                                                                                                                |
| `/acp cwd <path>`            | تجاوز cwd الخاص بـ runtime            | تحديث مباشر.                                                                                                                                                                     |
| `/acp set <key> <value>`     | عام                                   | يستخدم `key=cwd` مسار تجاوز cwd.                                                                                                                                                 |
| `/acp reset-options`         | يمسح كل تجاوزات runtime               | —                                                                                                                                                                                |

## acpx harness، وإعداد Plugin، والأذونات

بالنسبة إلى إعدادات acpx harness ‏(الأسماء المستعارة لـ Claude Code / Codex / Gemini CLI)، وجسور MCP الخاصة بـ plugin-tools وOpenClaw-tools، وأوضاع أذونات ACP، راجع
[وكلاء ACP — الإعداد](/ar/tools/acp-agents-setup).

## استكشاف الأخطاء وإصلاحها

| العَرَض                                                                     | السبب المحتمل                                                                    | الإصلاح                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin الخاصة بالواجهة الخلفية مفقودة، أو معطلة، أو محظورة بواسطة `plugins.allow`. | ثبّت Plugin الواجهة الخلفية وفعّلها، وضمّن `acpx` في `plugins.allow` عندما تكون allowlist هذه مضبوطة، ثم شغّل `/acp doctor`.                                                |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP معطلة عالميًا.                                                               | اضبط `acp.enabled=true`.                                                                                                                                                     |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | dispatch من رسائل الـ thread العادية معطلة.                                      | اضبط `acp.dispatch.enabled=true`.                                                                                                                                           |
| `ACP agent "<id>" is not allowed by policy`                                 | الوكيل غير موجود في allowlist.                                                   | استخدم `agentId` مسموحًا به أو حدّث `acp.allowedAgents`.                                                                                                                    |
| يبلغ `/acp doctor` عن عدم جاهزية الواجهة الخلفية مباشرةً بعد بدء التشغيل    | لا يزال فحص تبعيات Plugin أو إصلاحها الذاتي قيد التشغيل.                        | انتظر قليلًا ثم أعد تشغيل `/acp doctor`; وإذا بقيت غير سليمة، فافحص خطأ تثبيت الواجهة الخلفية وسياسة السماح/الرفض الخاصة بالـ Plugin.                                     |
| لم يتم العثور على أمر Harness                                              | لم يتم تثبيت CLI الخاصة بالمحول أو فشل جلب `npx` في التشغيل الأول.               | ثبّت/سخّن المحول مسبقًا على مضيف Gateway، أو هيّئ أمر acpx agent صراحةً.                                                                                                   |
| model-not-found من harness                                                 | معرّف model صالح لـ provider/harness أخرى لكنه غير صالح لهذا الهدف ACP.          | استخدم model مدرجة بواسطة تلك harness، أو هيّئ model في harness، أو احذف التجاوز.                                                                                          |
| خطأ مصادقة من المورد في harness                                             | OpenClaw سليمة، لكن CLI/provider الهدف لم تسجل الدخول.                           | سجّل الدخول أو قدّم مفتاح provider المطلوب في بيئة مضيف Gateway.                                                                                                            |
| `Unable to resolve session target: ...`                                     | رمز key/id/label غير صالح.                                                       | شغّل `/acp sessions`، وانسخ key/label بالضبط، ثم أعد المحاولة.                                                                                                              |
| `--bind here requires running /acp spawn inside an active ... conversation` | تم استخدام `--bind here` من دون محادثة نشطة قابلة للربط.                         | انتقل إلى الدردشة/القناة المستهدفة وأعد المحاولة، أو استخدم spawn غير مرتبطة.                                                                                               |
| `Conversation bindings are unavailable for <channel>.`                      | لا يملك المحول capability ربط ACP بالمحادثة الحالية.                             | استخدم `/acp spawn ... --thread ...` عندما يكون ذلك مدعومًا، أو هيّئ `bindings[]` على المستوى الأعلى، أو انتقل إلى قناة مدعومة.                                           |
| `--thread here requires running /acp spawn inside an active ... thread`     | تم استخدام `--thread here` خارج سياق thread.                                     | انتقل إلى الـ thread المستهدفة أو استخدم `--thread auto`/`off`.                                                                                                             |
| `Only <user-id> can rebind this channel/conversation/thread.`               | يملك مستخدم آخر هدف الربط النشط.                                                | أعد الربط بصفتك المالك أو استخدم محادثة أو thread مختلفة.                                                                                                                   |
| `Thread bindings are unavailable for <channel>.`                            | لا يملك المحول capability ربط الـ thread.                                        | استخدم `--thread off` أو انتقل إلى محول/قناة مدعومة.                                                                                                                        |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | تعمل ACP runtime على جانب المضيف؛ وجلسة الطالب داخل sandbox.                     | استخدم `runtime="subagent"` من الجلسات داخل sandbox، أو شغّل ACP spawn من جلسة ليست داخل sandbox.                                                                          |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | تم طلب `sandbox="require"` لـ ACP runtime.                                       | استخدم `runtime="subagent"` عندما يكون sandboxing مطلوبًا، أو استخدم ACP مع `sandbox="inherit"` من جلسة ليست داخل sandbox.                                                 |
| `Cannot apply --model ... did not advertise model support`                  | لا يعرّض harness الهدف تبديل models عامًّا في ACP.                               | استخدم harness تعلن عن ACP `models`/`session/set_model`، أو استخدم مراجع model الخاصة بـ Codex ACP، أو هيّئ model مباشرةً في harness إذا كانت تملك علامة بدء تشغيل خاصة بها. |
| غياب بيانات ACP الوصفية للجلسة المرتبطة                                      | بيانات ACP الوصفية قديمة/محذوفة.                                                 | أعد الإنشاء باستخدام `/acp spawn`، ثم أعد الربط/التركيز على الـ thread.                                                                                                     |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | تمنع `permissionMode` عمليات الكتابة/التنفيذ في جلسة ACP غير التفاعلية.          | اضبط `plugins.entries.acpx.config.permissionMode` على `approve-all` وأعد تشغيل gateway. راجع [إعدادات الأذونات](/ar/tools/acp-agents-setup#permission-configuration).          |
| تفشل جلسة ACP مبكرًا مع خرج قليل                                             | يتم حظر مطالبات الأذونات بواسطة `permissionMode`/`nonInteractivePermissions`.     | تحقّق من سجلات gateway بحثًا عن `AcpRuntimeError`. وللحصول على أذونات كاملة، اضبط `permissionMode=approve-all`; وللتراجع السلس، اضبط `nonInteractivePermissions=deny`.      |
| تتوقف جلسة ACP إلى أجل غير مسمى بعد إكمال العمل                             | انتهت عملية harness لكن جلسة ACP لم تبلغ عن الإكمال.                             | راقب باستخدام `ps aux \| grep acpx`; واقتل العمليات القديمة يدويًا.                                                                                                        |
| ترى harness القيمة `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                  | تسرب ظرف الحدث الداخلي عبر حد ACP.                                               | حدّث OpenClaw وأعد تشغيل تدفق الإكمال؛ يجب أن تتلقى الأحزمة الخارجية prompts إكمال عادية فقط.                                                                              |

## ذو صلة

- [وكلاء ACP — الإعداد](/ar/tools/acp-agents-setup)
- [إرسال الوكيل](/ar/tools/agent-send)
- [CLI Backends](/ar/gateway/cli-backends)
- [Codex harness](/ar/plugins/codex-harness)
- [أدوات sandbox متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools)
- [`openclaw acp` ‏(وضع الجسر)](/ar/cli/acp)
- [الوكلاء الفرعيون](/ar/tools/subagents)
