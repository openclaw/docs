---
read_when:
    - تشغيل أطر البرمجة عبر ACP
    - إعداد جلسات ACP المرتبطة بالمحادثة على قنوات المراسلة
    - ربط محادثة في قناة رسائل بجلسة ACP مستمرة
    - استكشاف أخطاء واجهة ACP الخلفية أو ربط Plugin أو تسليم الإكمال وإصلاحها
    - تنفيذ أوامر /acp من الدردشة
sidebarTitle: ACP agents
summary: شغّل حاضنات البرمجة الخارجية (Claude Code وCursor وGemini CLI وCodex ACP الصريح وOpenClaw ACP وOpenCode) عبر الواجهة الخلفية لـ ACP
title: وكلاء ACP
x-i18n:
    generated_at: "2026-04-30T08:28:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8257bdba22b613093da1a06761fdc5034cae4bca249ae91a531ec3fccabb954
    source_path: tools/acp-agents.md
    workflow: 16
---

[جلسات بروتوكول عميل الوكيل (ACP)](https://agentclientprotocol.com/)
تتيح لـ OpenClaw تشغيل أدوات ترميز خارجية (مثل Pi و Claude Code و
Cursor و Copilot و Droid و OpenClaw ACP و OpenCode و Gemini CLI وأدوات
ACPX أخرى مدعومة) عبر Plugin خلفي لـ ACP.

يتم تتبّع كل إنشاء لجلسة ACP بوصفه [مهمة في الخلفية](/ar/automation/tasks).

<Note>
**ACP هو مسار الأداة الخارجية، وليس مسار Codex الافتراضي.** يمتلك
Plugin خادم تطبيق Codex الأصلي عناصر تحكم `/codex ...` ووقت التشغيل
المضمّن `agentRuntime.id: "codex"`؛ أما ACP فيمتلك عناصر تحكم
`/acp ...` وجلسات `sessions_spawn({ runtime: "acp" })`.

إذا كنت تريد أن يتصل Codex أو Claude Code كعميل MCP خارجي
مباشرة بمحادثات قنوات OpenClaw الحالية، فاستخدم
[`openclaw mcp serve`](/ar/cli/mcp) بدلا من ACP.
</Note>

## أي صفحة أريد؟

| تريد أن…                                                                                         | استخدم هذا                            | ملاحظات                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ربط Codex أو التحكم به في المحادثة الحالية                                                       | `/codex bind`, `/codex threads`       | مسار خادم تطبيق Codex الأصلي عندما يكون Plugin `codex` مفعلا؛ يتضمن ردود الدردشة المربوطة، وتمرير الصور، وعناصر التحكم في النموذج/الوضع السريع/الأذونات، والإيقاف، والتوجيه. ACP بديل صريح |
| تشغيل Claude Code أو Gemini CLI أو Codex ACP صريح أو أداة خارجية أخرى _عبر_ OpenClaw             | هذه الصفحة                            | جلسات مرتبطة بالدردشة، و`/acp spawn`، و`sessions_spawn({ runtime: "acp" })`، ومهام في الخلفية، وعناصر تحكم وقت التشغيل                                                                                  |
| عرض جلسة OpenClaw Gateway _كخادم_ ACP لمحرر أو عميل                                               | [`openclaw acp`](/ar/cli/acp)            | وضع الجسر. يتحدث IDE/العميل ACP إلى OpenClaw عبر stdio/WebSocket                                                                                                                                        |
| إعادة استخدام CLI ذكاء اصطناعي محلي كنموذج احتياطي نصي فقط                                      | [خلفيات CLI](/ar/gateway/cli-backends)   | ليس ACP. لا توجد أدوات OpenClaw، ولا عناصر تحكم ACP، ولا وقت تشغيل للأداة                                                                                                                              |

## هل يعمل هذا مباشرة؟

عادة نعم. تتضمن عمليات التثبيت الجديدة Plugin وقت التشغيل المضمّن `acpx`
مفعلا افتراضيا، مع ملف `acpx` ثنائي مثبت بإصدار محدد ومحلي للـ Plugin
يفحصه OpenClaw ويصلحه ذاتيا عند بدء التشغيل. شغّل `/acp doctor` لفحص الجاهزية.

لا يعلّم OpenClaw الوكلاء عن إنشاء ACP إلا عندما يكون ACP **قابلا
للاستخدام فعلا**: يجب أن يكون ACP مفعلا، وألا يكون الإرسال معطلا، وألا تكون
الجلسة الحالية محظورة بسبب صندوق العزل، ويجب أن تكون خلفية وقت التشغيل
محمّلة. إذا لم تتحقق هذه الشروط، تبقى Skills الخاصة بـ ACP Plugin
وإرشادات ACP في `sessions_spawn` مخفية حتى لا يقترح الوكيل خلفية غير متاحة.

<AccordionGroup>
  <Accordion title="تنبيهات التشغيل الأول">
    - إذا كان `plugins.allow` مضبوطا، فهو مخزون Plugins تقييدي و**يجب** أن يتضمن `acpx`؛ وإلا فسيتم حظر الافتراضي المضمّن عمدا وسيبلّغ `/acp doctor` عن إدخال قائمة السماح المفقود.
    - يتم تجهيز محول Codex ACP المضمّن مع Plugin `acpx` وتشغيله محليا عندما يكون ذلك ممكنا.
    - قد تظل محولات الأدوات المستهدفة الأخرى تُجلب عند الطلب باستخدام `npx` في أول مرة تستخدمها فيها.
    - يجب أن تظل مصادقة المورّد موجودة على المضيف لتلك الأداة.
    - إذا لم يكن لدى المضيف npm أو وصول إلى الشبكة، تفشل عمليات جلب المحولات في التشغيل الأول إلى أن يتم تجهيز الذاكرات المؤقتة مسبقا أو تثبيت المحول بطريقة أخرى.

  </Accordion>
  <Accordion title="متطلبات وقت التشغيل">
    يطلق ACP عملية أداة خارجية حقيقية. يمتلك OpenClaw التوجيه،
    وحالة مهام الخلفية، والتسليم، والروابط، والسياسة؛ وتمتلك الأداة
    تسجيل دخول المزوّد، وفهرس النماذج، وسلوك نظام الملفات، وأدواتها
    الأصلية.

    قبل إلقاء اللوم على OpenClaw، تحقق من الآتي:

    - يبلغ `/acp doctor` عن خلفية مفعلة وسليمة.
    - يكون معرّف الهدف مسموحا به بواسطة `acp.allowedAgents` عندما تكون قائمة السماح هذه مضبوطة.
    - يمكن لأمر الأداة أن يبدأ على مضيف Gateway.
    - مصادقة المزوّد موجودة لتلك الأداة (`claude`, `codex`, `gemini`, `opencode`, `droid`, إلخ).
    - النموذج المحدد موجود لتلك الأداة — معرّفات النماذج غير قابلة للنقل بين الأدوات.
    - مسار `cwd` المطلوب موجود ويمكن الوصول إليه، أو احذف `cwd` ودع الخلفية تستخدم افتراضيها.
    - وضع الأذونات يطابق العمل. لا يمكن للجلسات غير التفاعلية النقر على مطالبات الأذونات الأصلية، لذلك تحتاج عمليات الترميز الكثيفة في الكتابة/التنفيذ عادة إلى ملف أذونات ACPX يمكنه المتابعة دون واجهة.

  </Accordion>
</AccordionGroup>

لا يتم كشف أدوات OpenClaw Plugin والأدوات المضمّنة في OpenClaw
لأدوات ACP افتراضيا. فعّل جسور MCP الصريحة في
[وكلاء ACP — الإعداد](/ar/tools/acp-agents-setup) فقط عندما يجب على الأداة
استدعاء تلك الأدوات مباشرة.

## أهداف الأدوات المدعومة

مع خلفية `acpx` المضمّنة، استخدم معرّفات الأدوات هذه كأهداف
`/acp spawn <id>` أو `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| معرّف الأداة | الخلفية المعتادة                                | ملاحظات                                                                               |
| ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| `claude`     | محول Claude Code ACP                            | يتطلب مصادقة Claude Code على المضيف.                                                  |
| `codex`      | محول Codex ACP                                  | بديل ACP صريح فقط عندما يكون `/codex` الأصلي غير متاح أو عندما يُطلب ACP.            |
| `copilot`    | محول GitHub Copilot ACP                         | يتطلب مصادقة Copilot CLI/وقت التشغيل.                                                 |
| `cursor`     | Cursor CLI ACP (`cursor-agent acp`)             | تجاوز أمر acpx إذا كان تثبيت محلي يكشف نقطة دخول ACP مختلفة.                         |
| `droid`      | Factory Droid CLI                               | يتطلب مصادقة Factory/Droid أو `FACTORY_API_KEY` في بيئة الأداة.                       |
| `gemini`     | محول Gemini CLI ACP                             | يتطلب مصادقة Gemini CLI أو إعداد مفتاح API.                                           |
| `iflow`      | iFlow CLI                                       | يعتمد توفر المحول والتحكم في النموذج على CLI المثبت.                                  |
| `kilocode`   | Kilo Code CLI                                   | يعتمد توفر المحول والتحكم في النموذج على CLI المثبت.                                  |
| `kimi`       | Kimi/Moonshot CLI                               | يتطلب مصادقة Kimi/Moonshot على المضيف.                                                |
| `kiro`       | Kiro CLI                                        | يعتمد توفر المحول والتحكم في النموذج على CLI المثبت.                                  |
| `opencode`   | محول OpenCode ACP                               | يتطلب مصادقة OpenCode CLI/المزوّد.                                                    |
| `openclaw`   | جسر OpenClaw Gateway عبر `openclaw acp`         | يتيح لأداة واعية بـ ACP التحدث عائدا إلى جلسة OpenClaw Gateway.                       |
| `pi`         | وقت تشغيل Pi/OpenClaw المضمّن                   | يُستخدم لتجارب أدوات OpenClaw الأصلية.                                                |
| `qwen`       | Qwen Code / Qwen CLI                            | يتطلب مصادقة متوافقة مع Qwen على المضيف.                                              |

يمكن تكوين أسماء مستعارة مخصصة لوكلاء acpx في acpx نفسه، لكن سياسة
OpenClaw تظل تتحقق من `acp.allowedAgents` وأي ربط
`agents.list[].runtime.acp.agent` قبل الإرسال.

## دليل تشغيل المشغّل

تدفق `/acp` سريع من الدردشة:

<Steps>
  <Step title="الإنشاء">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`، أو الأمر الصريح
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="العمل">
    تابع في المحادثة أو السلسلة المربوطة (أو استهدف مفتاح الجلسة
    صراحة).
  </Step>
  <Step title="فحص الحالة">
    `/acp status`
  </Step>
  <Step title="الضبط">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="التوجيه">
    دون استبدال السياق: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="الإيقاف">
    `/acp cancel` (الدور الحالي) أو `/acp close` (الجلسة + الروابط).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="تفاصيل دورة الحياة">
    - ينشئ الإنشاء جلسة وقت تشغيل ACP أو يستأنفها، ويسجل بيانات ACP الوصفية في مخزن جلسات OpenClaw، وقد ينشئ مهمة في الخلفية عندما تكون العملية مملوكة للأصل.
    - تُعامل جلسات ACP المملوكة للأصل كعمل في الخلفية حتى عندما تكون جلسة وقت التشغيل مستمرة؛ يمر الإكمال والتسليم عبر الأسطح من خلال منبّه المهمة الأصلية بدلا من التصرف كجلسة دردشة عادية موجهة للمستخدم.
    - تغلق صيانة المهام جلسات ACP النهائية أو اليتيمة والمملوكة للأصل ذات التشغيل الواحد. تُحفظ جلسات ACP المستمرة ما دام ربط محادثة نشط باقيا؛ وتُغلق الجلسات المستمرة القديمة التي لا تملك ربطا نشطا حتى لا يمكن استئنافها بصمت بعد انتهاء المهمة المالكة أو اختفاء سجل مهمتها.
    - تذهب رسائل المتابعة المربوطة مباشرة إلى جلسة ACP إلى أن يُغلق الربط أو يُزال تركيزه أو يُعاد ضبطه أو تنتهي صلاحيته.
    - تبقى أوامر Gateway محلية. لا يتم إرسال `/acp ...` و`/status` و`/unfocus` أبدا كنص مطالبة عادي إلى أداة ACP مربوطة.
    - يجهض `cancel` الدور النشط عندما تدعم الخلفية الإلغاء؛ ولا يحذف الربط أو بيانات الجلسة الوصفية.
    - ينهي `close` جلسة ACP من منظور OpenClaw ويزيل الربط. قد تظل الأداة تحتفظ بتاريخها العلوي الخاص إذا كانت تدعم الاستئناف.
    - يكون عمال وقت التشغيل الخاملون مؤهلين للتنظيف بعد `acp.runtime.ttlMinutes`؛ وتبقى بيانات الجلسة الوصفية المخزنة متاحة لـ `/acp sessions`.

  </Accordion>
  <Accordion title="قواعد توجيه Codex الأصلية">
    محفزات اللغة الطبيعية التي يجب أن تُوجّه إلى **Codex Plugin الأصلي**
    عندما يكون مفعلا:

    - "اربط قناة Discord هذه بـ Codex."
    - "أرفق هذه الدردشة بسلسلة Codex `<id>`."
    - "اعرض سلاسل Codex، ثم اربط هذه."

    ربط محادثة Codex الأصلي هو مسار التحكم الافتراضي في الدردشة.
    تظل أدوات OpenClaw الديناميكية تُنفذ عبر OpenClaw، بينما تُنفذ
    أدوات Codex الأصلية مثل shell/apply-patch داخل Codex.
    بالنسبة إلى أحداث أدوات Codex الأصلية، يحقن OpenClaw مرحّل hook أصلي
    لكل دور حتى تتمكن hooks الخاصة بالـ Plugin من حظر `before_tool_call`،
    ومراقبة `after_tool_call`، وتوجيه أحداث Codex `PermissionRequest`
    عبر موافقات OpenClaw. تُمرّر hooks الخاصة بـ Codex `Stop` إلى
    OpenClaw `before_agent_finalize`، حيث يمكن للـ Plugins طلب مرور نموذج
    إضافي قبل أن ينهي Codex إجابته. يظل المرحّل محافظا عمدا: فهو لا يغيّر
    معاملات أدوات Codex الأصلية ولا يعيد كتابة سجلات سلاسل Codex. استخدم
    ACP الصريح فقط عندما تريد نموذج وقت تشغيل/جلسة ACP. تم توثيق حدود دعم
    Codex المضمّن في
    [عقد دعم أداة Codex v1](/ar/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="ملخص اختيار النموذج / المزوّد / وقت التشغيل">
    - `openai-codex/*` — مسار OAuth/الاشتراك في PI Codex.
    - `openai/*` بالإضافة إلى `agentRuntime.id: "codex"` — وقت تشغيل مضمن أصلي لخادم تطبيق Codex.
    - `/codex ...` — تحكم أصلي في محادثة Codex.
    - `/acp ...` أو `runtime: "acp"` — تحكم ACP/acpx صريح.

  </Accordion>
  <Accordion title="مشغلات اللغة الطبيعية لتوجيه ACP">
    المشغلات التي يجب أن توجّه إلى وقت تشغيل ACP:

    - "شغّل هذا كجلسة Claude Code ACP لمرة واحدة ولخّص النتيجة."
    - "استخدم Gemini CLI لهذه المهمة في سلسلة، ثم أبقِ المتابعات في السلسلة نفسها."
    - "شغّل Codex من خلال ACP في سلسلة خلفية."

    يختار OpenClaw القيمة `runtime: "acp"`، ويحلّ `agentId` الخاص بالحزمة،
    ويرتبط بالمحادثة أو السلسلة الحالية عند دعم ذلك، و
    يوجّه المتابعات إلى تلك الجلسة حتى الإغلاق/انتهاء الصلاحية. يتبع Codex هذا
    المسار فقط عندما يكون ACP/acpx صريحًا أو عندما لا يكون Plugin الأصلي
    لـ Codex متاحًا للعملية المطلوبة.

    بالنسبة إلى `sessions_spawn`، لا يتم الإعلان عن `runtime: "acp"` إلا عندما يكون ACP
    مفعّلًا، ولا يكون الطالب معزولًا في sandbox، ويكون
    خلفية وقت تشغيل ACP محمّلة. يؤدي `acp.dispatch.enabled=false` إلى إيقاف
    إرسال سلاسل ACP التلقائي مؤقتًا، لكنه لا يخفي أو يحظر استدعاءات
    `sessions_spawn({ runtime: "acp" })` الصريحة. يستهدف معرّفات حزم ACP مثل `codex`،
    أو `claude`، أو `droid`، أو `gemini`، أو `opencode`. لا تمرّر معرّف وكيل
    عاديًا من إعدادات OpenClaw من `agents_list` إلا إذا كان ذلك الإدخال
    مهيأً صراحةً باستخدام `agents.list[].runtime.type="acp"`؛
    وإلا فاستخدم وقت تشغيل الوكيل الفرعي الافتراضي. عندما يكون وكيل OpenClaw
    مهيأً باستخدام `runtime.type="acp"`، يستخدم OpenClaw
    `runtime.acp.agent` كمعرّف الحزمة الأساسية.

  </Accordion>
</AccordionGroup>

## ACP مقابل الوكلاء الفرعيين

استخدم ACP عندما تريد وقت تشغيل حزمة خارجيًا. استخدم **خادم تطبيق Codex
الأصلي** لربط/التحكم في محادثة Codex عندما يكون Plugin `codex`
مفعّلًا. استخدم **الوكلاء الفرعيين** عندما تريد تشغيلات مفوضة أصلية في OpenClaw.

| المنطقة       | جلسة ACP                              | تشغيل وكيل فرعي                    |
| ------------- | ------------------------------------- | ---------------------------------- |
| وقت التشغيل   | Plugin خلفية ACP (مثل acpx)           | وقت تشغيل وكيل فرعي أصلي في OpenClaw |
| مفتاح الجلسة  | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| الأوامر الرئيسية | `/acp ...`                         | `/subagents ...`                   |
| أداة الإنشاء  | `sessions_spawn` مع `runtime:"acp"`   | `sessions_spawn` (وقت التشغيل الافتراضي) |

انظر أيضًا [الوكلاء الفرعيين](/ar/tools/subagents).

## كيف يشغّل ACP ‏Claude Code

بالنسبة إلى Claude Code عبر ACP، تكون المكدسة:

1. مستوى تحكم جلسة ACP في OpenClaw.
2. Plugin وقت تشغيل `acpx` المضمّن.
3. محوّل Claude ACP.
4. آليات وقت التشغيل/الجلسة من جهة Claude.

ACP Claude هو **جلسة حزمة** مع عناصر تحكم ACP، واستئناف الجلسة،
وتتبع مهام الخلفية، وربط اختياري بالمحادثة/السلسلة.

خلفيات CLI هي أوقات تشغيل احتياطية محلية نصية فقط ومنفصلة — راجع
[خلفيات CLI](/ar/gateway/cli-backends).

بالنسبة إلى المشغّلين، القاعدة العملية هي:

- **تريد `/acp spawn` أو جلسات قابلة للربط أو عناصر تحكم وقت التشغيل أو عمل حزمة مستمرًا؟** استخدم ACP.
- **تريد احتياطيًا نصيًا محليًا بسيطًا عبر CLI الخام؟** استخدم خلفيات CLI.

## الجلسات المرتبطة

### النموذج الذهني

- **سطح الدردشة** — حيث يواصل الأشخاص الحديث (قناة Discord، موضوع Telegram، دردشة iMessage).
- **جلسة ACP** — حالة وقت تشغيل Codex/Claude/Gemini الدائمة التي يوجّه OpenClaw إليها.
- **سلسلة/موضوع فرعي** — سطح مراسلة إضافي اختياري يتم إنشاؤه فقط بواسطة `--thread ...`.
- **مساحة عمل وقت التشغيل** — موقع نظام الملفات (`cwd`، نسخة repo، مساحة عمل الخلفية) حيث تعمل الحزمة. مستقل عن سطح الدردشة.

### روابط المحادثة الحالية

يثبّت `/acp spawn <harness> --bind here` المحادثة الحالية على
جلسة ACP المنشأة — بلا سلسلة فرعية، وعلى سطح الدردشة نفسه. يواصل OpenClaw
امتلاك النقل، والمصادقة، والسلامة، والتسليم. يتم توجيه رسائل المتابعة في تلك
المحادثة إلى الجلسة نفسها؛ يعيد `/new` و`/reset` ضبط
الجلسة في مكانها؛ ويزيل `/acp close` الربط.

أمثلة:

```text
/codex bind                                              # ربط Codex الأصلي، وتوجيه الرسائل المستقبلية هنا
/codex model gpt-5.4                                     # ضبط سلسلة Codex الأصلية المرتبطة
/codex stop                                              # التحكم في دورة Codex الأصلية النشطة
/acp spawn codex --bind here                             # احتياطي ACP صريح لـ Codex
/acp spawn codex --thread auto                           # قد ينشئ سلسلة/موضوعًا فرعيًا ويربط هناك
/acp spawn codex --bind here --cwd /workspace/repo       # ربط الدردشة نفسه، يعمل Codex في /workspace/repo
```

<AccordionGroup>
  <Accordion title="قواعد الربط والحصرية">
    - `--bind here` و`--thread ...` متنافيان.
    - يعمل `--bind here` فقط على القنوات التي تعلن دعم ربط المحادثة الحالية؛ ويعيد OpenClaw رسالة واضحة بعدم الدعم خلاف ذلك. تستمر الروابط عبر عمليات إعادة تشغيل Gateway.
    - في Discord، لا يكون `spawnAcpSessions` مطلوبًا إلا عندما يحتاج OpenClaw إلى إنشاء سلسلة فرعية لـ `--thread auto|here` — وليس لـ `--bind here`.
    - إذا أنشأت جلسة إلى وكيل ACP مختلف دون `--cwd`، يرث OpenClaw مساحة عمل **الوكيل الهدف** افتراضيًا. تعود المسارات الموروثة المفقودة (`ENOENT`/`ENOTDIR`) إلى الإعداد الافتراضي للخلفية؛ وتظهر أخطاء الوصول الأخرى (مثل `EACCES`) كأخطاء إنشاء.
    - تبقى أوامر إدارة Gateway محلية في المحادثات المرتبطة — تتولى OpenClaw معالجة أوامر `/acp ...` حتى عندما يتم توجيه نص المتابعة العادي إلى جلسة ACP المرتبطة؛ كما يبقى `/status` و`/unfocus` محليين أيضًا كلما كان التعامل مع الأوامر مفعّلًا لذلك السطح.

  </Accordion>
  <Accordion title="الجلسات المرتبطة بالسلاسل">
    عندما تكون روابط السلاسل مفعّلة لمحوّل قناة:

    - يربط OpenClaw سلسلة بجلسة ACP هدف.
    - يتم توجيه رسائل المتابعة في تلك السلسلة إلى جلسة ACP المرتبطة.
    - يتم تسليم مخرجات ACP مرة أخرى إلى السلسلة نفسها.
    - يؤدي إلغاء التركيز/الإغلاق/الأرشفة/انتهاء مهلة الخمول أو انتهاء الحد الأقصى للعمر إلى إزالة الربط.
    - `/acp close` و`/acp cancel` و`/acp status` و`/status` و`/unfocus` هي أوامر Gateway، وليست مطالبات لحزمة ACP.

    أعلام الميزات المطلوبة لـ ACP المرتبط بالسلاسل:

    - `acp.enabled=true`
    - يكون `acp.dispatch.enabled` مفعّلًا افتراضيًا (اضبطه على `false` لإيقاف إرسال سلاسل ACP التلقائي مؤقتًا؛ تظل استدعاءات `sessions_spawn({ runtime: "acp" })` الصريحة تعمل).
    - علم إنشاء سلاسل ACP الخاص بمحوّل القناة مفعّل (خاص بالمحوّل):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    دعم ربط السلاسل خاص بالمحوّل. إذا كان محوّل القناة النشط
    لا يدعم روابط السلاسل، يعيد OpenClaw رسالة واضحة
    بعدم الدعم/عدم التوفر.

  </Accordion>
  <Accordion title="القنوات الداعمة للسلاسل">
    - أي محوّل قناة يعرّض قدرة ربط الجلسة/السلسلة.
    - الدعم المضمّن الحالي: سلاسل/قنوات **Discord**، وموضوعات **Telegram** (موضوعات المنتدى في المجموعات/المجموعات الفائقة وموضوعات الرسائل المباشرة).
    - يمكن لقنوات Plugin إضافة الدعم من خلال واجهة الربط نفسها.

  </Accordion>
</AccordionGroup>

## روابط القنوات الدائمة

لسير العمل غير المؤقت، هيّئ روابط ACP دائمة في
إدخالات `bindings[]` ذات المستوى الأعلى.

### نموذج الربط

<ParamField path="bindings[].type" type='"acp"'>
  يميّز ربط محادثة ACP دائمًا.
</ParamField>
<ParamField path="bindings[].match" type="object">
  يحدد المحادثة الهدف. الأشكال حسب القناة:

- **قناة/سلسلة Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **موضوع منتدى Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **رسالة مباشرة/مجموعة BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. فضّل `chat_id:*` أو `chat_identifier:*` لروابط المجموعات المستقرة.
- **رسالة مباشرة/مجموعة iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. فضّل `chat_id:*` لروابط المجموعات المستقرة.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  معرّف وكيل OpenClaw المالك.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  تجاوز ACP اختياري.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  تسمية اختيارية موجهة للمشغّل.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  دليل عمل وقت تشغيل اختياري.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  تجاوز خلفية اختياري.
</ParamField>

### افتراضيات وقت التشغيل لكل وكيل

استخدم `agents.list[].runtime` لتعريف افتراضيات ACP مرة واحدة لكل وكيل:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (معرّف الحزمة، مثل `codex` أو `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**أسبقية التجاوز لجلسات ACP المرتبطة:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. افتراضيات ACP العامة (مثل `acp.backend`)

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

- يضمن OpenClaw وجود جلسة ACP المهيأة قبل الاستخدام.
- يتم توجيه الرسائل في تلك القناة أو ذلك الموضوع إلى جلسة ACP المهيأة.
- في المحادثات المرتبطة، يعيد `/new` و`/reset` ضبط مفتاح جلسة ACP نفسه في مكانه.
- تظل روابط وقت التشغيل المؤقتة (مثل التي تنشئها تدفقات تركيز السلاسل) سارية حيثما وُجدت.
- بالنسبة إلى إنشاءات ACP عبر وكلاء مختلفة دون `cwd` صريح، يرث OpenClaw مساحة عمل الوكيل الهدف من إعدادات الوكيل.
- تعود مسارات مساحة العمل الموروثة المفقودة إلى cwd الافتراضي للخلفية؛ وتظهر حالات فشل الوصول غير الناتجة عن الفقدان كأخطاء إنشاء.

## بدء جلسات ACP

طريقتان لبدء جلسة ACP:

<Tabs>
  <Tab title="من sessions_spawn">
    استخدم `runtime: "acp"` لبدء جلسة ACP من دورة وكيل أو
    استدعاء أداة.

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
    القيمة الافتراضية لـ `runtime` هي `subagent`، لذا عيّن `runtime: "acp"` صراحةً
    لجلسات ACP. إذا حُذف `agentId`، يستخدم OpenClaw
    `acp.defaultAgent` عند تكوينه. يتطلب `mode: "session"`
    `thread: true` للاحتفاظ بمحادثة مرتبطة مستمرة.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    استخدم `/acp spawn` للتحكم الصريح من المشغّل عبر الدردشة.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    العلامات الرئيسية:

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
  الموجّه الأولي المُرسَل إلى جلسة ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  يجب أن يكون `"acp"` لجلسات ACP.
</ParamField>
<ParamField path="agentId" type="string">
  معرّف أداة تشغيل ACP المستهدفة. يعود إلى `acp.defaultAgent` إذا كان معيّناً.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  اطلب مسار ربط السلسلة حيثما كان ذلك مدعوماً.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` تشغيل لمرة واحدة؛ و`"session"` مستمرة. إذا كان `thread: true` و
  حُذف `mode`، فقد يستخدم OpenClaw السلوك المستمر افتراضياً وفق
  مسار وقت التشغيل. يتطلب `mode: "session"` وجود `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  دليل عمل وقت التشغيل المطلوب (تتحقق منه سياسة الخلفية/وقت التشغيل).
  إذا حُذف، يرث إنشاء ACP مساحة عمل الوكيل المستهدف
  عند تكوينها؛ وتعود المسارات الموروثة المفقودة إلى إعدادات الخلفية
  الافتراضية، بينما تُرجع أخطاء الوصول الحقيقية.
</ParamField>
<ParamField path="label" type="string">
  تسمية موجهة إلى المشغّل تُستخدم في نص الجلسة/الشعار.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  استأنف جلسة ACP موجودة بدلاً من إنشاء جلسة جديدة. يعيد
  الوكيل تشغيل سجل محادثته عبر `session/load`. يتطلب
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  يبث `"parent"` ملخصات تقدم تشغيل ACP الأولي مرة أخرى إلى
  جلسة الطالب كأحداث نظام. تشمل الاستجابات المقبولة
  `streamLogPath` الذي يشير إلى سجل JSONL بنطاق الجلسة
  (`<sessionId>.acp-stream.jsonl`) يمكنك تتبعه لسجل الترحيل الكامل.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  يوقف دورة ACP الفرعية بعد N ثانية. تُبقي `0` الدورة على
  مسار بلا مهلة في Gateway. تُطبّق القيمة نفسها على تشغيل Gateway
  ووقت تشغيل ACP حتى لا تشغل أدوات التشغيل العالقة/المستنفدة للحصة
  مسار الوكيل الأصل إلى أجل غير مسمى.
</ParamField>
<ParamField path="model" type="string">
  تجاوز نموذج صريح لجلسة ACP الفرعية. تقوم عمليات إنشاء Codex ACP
  بتطبيع مراجع OpenClaw Codex مثل `openai-codex/gpt-5.4` إلى تكوين
  بدء Codex ACP قبل `session/new`؛ كما تضبط الصيغ المائلة مثل
  `openai-codex/gpt-5.4/high` جهد الاستدلال في Codex ACP.
  يجب أن تعلن أدوات التشغيل الأخرى عن `models` في ACP وأن تدعم
  `session/set_model`؛ وإلا يفشل OpenClaw/acpx بوضوح بدلاً من
  الرجوع بصمت إلى الإعداد الافتراضي للوكيل المستهدف.
</ParamField>
<ParamField path="thinking" type="string">
  جهد تفكير/استدلال صريح. في Codex ACP، تُطابق `minimal` جهداً
  منخفضاً، وتُطابق `low`/`medium`/`high`/`xhigh` مباشرة، بينما
  يحذف `off` تجاوز جهد الاستدلال عند بدء التشغيل.
</ParamField>

## أوضاع ربط الإنشاء والسلاسل

<Tabs>
  <Tab title="--bind here|off">
    | الوضع   | السلوك                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | اربط المحادثة النشطة الحالية في مكانها؛ وافشل إذا لم تكن هناك محادثة نشطة. |
    | `off`  | لا تنشئ ربطاً بالمحادثة الحالية.                          |

    ملاحظات:

    - `--bind here` هو أبسط مسار للمشغّل من أجل "اجعل هذه القناة أو الدردشة مدعومة من Codex."
    - لا ينشئ `--bind here` سلسلة فرعية.
    - لا يتوفر `--bind here` إلا على القنوات التي تكشف دعم ربط المحادثة الحالية.
    - لا يمكن جمع `--bind` و`--thread` في استدعاء `/acp spawn` نفسه.

  </Tab>
  <Tab title="--thread auto|here|off">
    | الوضع   | السلوك                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | داخل سلسلة نشطة: اربط تلك السلسلة. خارج السلسلة: أنشئ/اربط سلسلة فرعية عند الدعم. |
    | `here` | اشترط وجود سلسلة نشطة حالية؛ وافشل إذا لم تكن داخل واحدة.                                                  |
    | `off`  | بلا ربط. تبدأ الجلسة غير مرتبطة.                                                                 |

    ملاحظات:

    - على الأسطح التي لا تدعم ربط السلاسل، يكون السلوك الافتراضي فعلياً `off`.
    - يتطلب الإنشاء المرتبط بسلسلة دعماً من سياسة القناة:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - استخدم `--bind here` عندما تريد تثبيت المحادثة الحالية دون إنشاء سلسلة فرعية.

  </Tab>
</Tabs>

## نموذج التسليم

يمكن أن تكون جلسات ACP إما مساحات عمل تفاعلية أو عملاً خلفياً
مملوكاً للأصل. يعتمد مسار التسليم على هذا الشكل.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    تهدف الجلسات التفاعلية إلى مواصلة الحديث على سطح دردشة مرئي:

    - يربط `/acp spawn ... --bind here` المحادثة الحالية بجلسة ACP.
    - يربط `/acp spawn ... --thread ...` سلسلة/موضوع قناة بجلسة ACP.
    - توجه عمليات الربط المستمرة المكونة `bindings[].type="acp"` المحادثات المطابقة إلى جلسة ACP نفسها.

    تُوجَّه رسائل المتابعة في المحادثة المرتبطة مباشرةً إلى
    جلسة ACP، ويُسلَّم إخراج ACP مرة أخرى إلى
    القناة/السلسلة/الموضوع نفسه.

    ما يرسله OpenClaw إلى أداة التشغيل:

    - تُرسل المتابعات المرتبطة العادية كنص موجّه، مع المرفقات فقط عندما تدعمها أداة التشغيل/الخلفية.
    - تُعترض أوامر إدارة `/acp` وأوامر Gateway المحلية قبل الإرسال إلى ACP.
    - تُجسَّد أحداث الإكمال المُنشأة في وقت التشغيل لكل هدف. تحصل وكلاء OpenClaw على مغلف سياق وقت التشغيل الداخلي في OpenClaw؛ وتحصل أدوات تشغيل ACP الخارجية على موجّه عادي يتضمن نتيجة الفرع والتعليمات. يجب ألا يُرسل مغلف `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` الخام إلى أدوات التشغيل الخارجية أو يُحفَظ كنص سجل مستخدم في ACP.
    - تستخدم إدخالات سجل ACP نص المشغّل المرئي للمستخدم أو موجّه الإكمال العادي. تبقى بيانات تعريف الأحداث الداخلية منظمة في OpenClaw حيثما أمكن، ولا تُعامل كمحتوى دردشة كتبه المستخدم.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    جلسات ACP لمرة واحدة التي ينشئها تشغيل وكيل آخر هي فروع خلفية،
    مشابهة للوكلاء الفرعيين:

    - يطلب الأصل العمل باستخدام `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - يعمل الفرع في جلسة أداة تشغيل ACP الخاصة به.
    - تعمل دورات الفرع على المسار الخلفي نفسه المستخدم لإنشاء الوكلاء الفرعيين الأصليين، لذلك لا تمنع أداة تشغيل ACP البطيئة عمل الجلسة الرئيسية غير ذي الصلة.
    - تُبلّغ نتيجة الإكمال عبر مسار إعلان إكمال المهمة. يحوّل OpenClaw بيانات تعريف الإكمال الداخلية إلى موجّه ACP عادي قبل إرسالها إلى أداة تشغيل خارجية، بحيث لا ترى أدوات التشغيل علامات سياق وقت التشغيل الخاصة بـ OpenClaw فقط.
    - يعيد الأصل صياغة نتيجة الفرع بصوت المساعد الطبيعي عندما تكون هناك فائدة من رد موجه للمستخدم.

    **لا** تعامل هذا المسار كمحادثة نظير إلى نظير بين الأصل
    والفرع. لدى الفرع بالفعل قناة إكمال تعود إلى
    الأصل.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    يمكن أن يستهدف `sessions_send` جلسة أخرى بعد الإنشاء. للجلسات
    النظيرة العادية، يستخدم OpenClaw مسار متابعة وكيل إلى وكيل (A2A)
    بعد حقن الرسالة:

    - انتظر رد الجلسة المستهدفة.
    - اختيارياً اسمح للطالب والهدف بتبادل عدد محدود من دورات المتابعة.
    - اطلب من الهدف إنتاج رسالة إعلان.
    - سلّم ذلك الإعلان إلى القناة أو السلسلة المرئية.

    مسار A2A هذا هو بديل لإرسالات النظراء عندما يحتاج المرسل إلى
    متابعة مرئية. يبقى مفعّلاً عندما تستطيع جلسة غير ذات صلة
    رؤية هدف ACP ومراسلته، على سبيل المثال ضمن إعدادات
    `tools.sessions.visibility` الواسعة.

    يتخطى OpenClaw متابعة A2A فقط عندما يكون الطالب هو
    أصل فرعه الخاص من ACP لمرة واحدة والمملوك للأصل. في هذه الحالة،
    قد يؤدي تشغيل A2A فوق إكمال المهمة إلى إيقاظ الأصل بنتيجة
    الفرع، وإعادة توجيه رد الأصل إلى الفرع، وإنشاء حلقة صدى
    بين الأصل/الفرع. يبلّغ ناتج `sessions_send`
    `delivery.status="skipped"` في حالة الفرع المملوك هذه لأن
    مسار الإكمال مسؤول بالفعل عن النتيجة.

  </Accordion>
  <Accordion title="Resume an existing session">
    استخدم `resumeSessionId` لمتابعة جلسة ACP سابقة بدلاً من
    البدء من جديد. يعيد الوكيل تشغيل سجل محادثته عبر
    `session/load`، لذلك يتابع بسياق كامل لما سبق.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    حالات الاستخدام الشائعة:

    - سلّم جلسة Codex من حاسوبك المحمول إلى هاتفك — أخبر وكيلك أن يتابع من حيث توقفت.
    - تابع جلسة برمجة بدأتَها تفاعلياً في CLI، والآن بلا واجهة عبر وكيلك.
    - استأنف عملاً انقطع بسبب إعادة تشغيل Gateway أو انتهاء مهلة الخمول.

    ملاحظات:

    - ينطبق `resumeSessionId` فقط عندما يكون `runtime: "acp"`؛ يتجاهل وقت تشغيل الوكيل الفرعي الافتراضي هذا الحقل الخاص بـ ACP فقط.
    - ينطبق `streamTo` فقط عندما يكون `runtime: "acp"`؛ يتجاهل وقت تشغيل الوكيل الفرعي الافتراضي هذا الحقل الخاص بـ ACP فقط.
    - `resumeSessionId` هو معرّف استئناف ACP/أداة تشغيل محلي للمضيف، وليس مفتاح جلسة قناة OpenClaw؛ ما زال OpenClaw يتحقق من سياسة إنشاء ACP وسياسة الوكيل المستهدف قبل الإرسال، بينما تملك خلفية ACP أو أداة التشغيل صلاحية تحميل ذلك المعرّف upstream.
    - يستعيد `resumeSessionId` سجل محادثة ACP upstream؛ ولا يزال `thread` و`mode` ينطبقان عادةً على جلسة OpenClaw الجديدة التي تنشئها، لذا ما زال `mode: "session"` يتطلب `thread: true`.
    - يجب أن يدعم الوكيل المستهدف `session/load` (يدعمه Codex وClaude Code).
    - إذا لم يُعثر على معرّف الجلسة، يفشل الإنشاء بخطأ واضح — بلا رجوع صامت إلى جلسة جديدة.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    بعد نشر Gateway، شغّل فحصاً مباشراً شاملاً بدلاً من
    الثقة باختبارات الوحدات:

    1. تحقق من إصدار Gateway المنشور والالتزام على المضيف المستهدف.
    2. افتح جلسة جسر ACPX مؤقتة إلى وكيل مباشر.
    3. اطلب من ذلك الوكيل استدعاء `sessions_spawn` مع `runtime: "acp"` و`agentId: "codex"` و`mode: "run"`، والمهمة `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. تحقق من `accepted=yes`، ومن وجود `childSessionKey` حقيقي، ومن عدم وجود خطأ تحقق.
    5. نظّف جلسة الجسر المؤقتة.

    أبقِ البوابة على `mode: "run"` وتجاوز `streamTo: "parent"` —
    فمسارات `mode: "session"` المرتبطة بالسلاسل وترحيل البث هي
    عمليات تكامل أغنى ومنفصلة.

  </Accordion>
</AccordionGroup>

## توافق Sandbox

تعمل جلسات ACP حالياً على وقت تشغيل المضيف، **وليس** داخل
Sandbox في OpenClaw.

<Warning>
**حد الأمان:**

- يمكن لأداة التشغيل الخارجية القراءة/الكتابة وفقًا لأذونات CLI الخاصة بها و`cwd` المحدد.
- لا تُغلّف سياسة وضع الحماية في OpenClaw تنفيذ أداة تشغيل ACP.
- لا يزال OpenClaw يفرض بوابات ميزات ACP، والوكلاء المسموحين، وملكية الجلسة، وارتباطات القنوات، وسياسة تسليم Gateway.
- استخدم `runtime: "subagent"` للأعمال الأصلية في OpenClaw والخاضعة لوضع الحماية.

</Warning>

القيود الحالية:

- إذا كانت جلسة الطالب خاضعة لوضع الحماية، فسيتم حظر إنشاء عمليات ACP لكل من `sessions_spawn({ runtime: "acp" })` و`/acp spawn`.
- لا يدعم `sessions_spawn` مع `runtime: "acp"` الخيار `sandbox: "require"`.

## حل هدف الجلسة

تقبل معظم إجراءات `/acp` هدف جلسة اختياريًا (`session-key`،
`session-id`، أو `session-label`).

**ترتيب الحل:**

1. وسيطة الهدف الصريحة (أو `--session` لـ `/acp steer`)
   - يجرّب المفتاح
   - ثم معرّف جلسة بشكل UUID
   - ثم التسمية
2. ارتباط سلسلة المحادثة الحالية (إذا كانت هذه المحادثة/السلسلة مرتبطة بجلسة ACP).
3. الرجوع إلى جلسة الطالب الحالية.

تشارك ارتباطات المحادثة الحالية وارتباطات السلاسل كلاهما في
الخطوة 2.

إذا لم يتم حل أي هدف، يعيد OpenClaw خطأ واضحًا
(`Unable to resolve session target: ...`).

## عناصر تحكم ACP

| الأمر                | ما يفعله                                                  | مثال                                                         |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ينشئ جلسة ACP؛ مع ارتباط حالي أو ارتباط سلسلة اختياري.   | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | يلغي الدور الجاري لجلسة الهدف.                           | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | يرسل تعليمة توجيه إلى جلسة قيد التشغيل.                  | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | يغلق الجلسة ويلغي ارتباط أهداف السلسلة.                  | `/acp close`                                                  |
| `/acp status`        | يعرض الخلفية والوضع والحالة وخيارات وقت التشغيل والقدرات. | `/acp status`                                                 |
| `/acp set-mode`      | يضبط وضع وقت التشغيل لجلسة الهدف.                        | `/acp set-mode plan`                                          |
| `/acp set`           | يكتب خيار تكوين عام لوقت التشغيل.                        | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | يضبط تجاوز دليل العمل لوقت التشغيل.                      | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | يضبط ملف تعريف سياسة الموافقة.                           | `/acp permissions strict`                                     |
| `/acp timeout`       | يضبط مهلة وقت التشغيل (بالثواني).                        | `/acp timeout 120`                                            |
| `/acp model`         | يضبط تجاوز نموذج وقت التشغيل.                            | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | يزيل تجاوزات خيارات وقت تشغيل الجلسة.                    | `/acp reset-options`                                          |
| `/acp sessions`      | يسرد جلسات ACP الأخيرة من المخزن.                        | `/acp sessions`                                               |
| `/acp doctor`        | صحة الخلفية والقدرات والإصلاحات القابلة للتنفيذ.         | `/acp doctor`                                                 |
| `/acp install`       | يطبع خطوات تثبيت وتمكين حتمية.                           | `/acp install`                                                |

يعرض `/acp status` خيارات وقت التشغيل الفعالة بالإضافة إلى معرّفات الجلسة على مستوى وقت التشغيل
وعلى مستوى الخلفية. تظهر أخطاء عناصر التحكم غير المدعومة
بوضوح عندما تفتقر خلفية ما إلى قدرة. يقرأ `/acp sessions`
المخزن للجلسة الحالية المرتبطة أو جلسة الطالب؛ ويتم حل رموز الهدف
(`session-key`، أو `session-id`، أو `session-label`) عبر
اكتشاف جلسات Gateway، بما في ذلك جذور `session.store`
المخصصة لكل وكيل.

### تعيين خيارات وقت التشغيل

يحتوي `/acp` على أوامر ملائمة وأداة ضبط عامة. العمليات
المكافئة:

| الأمر                        | يُعيَّن إلى                           | ملاحظات                                                                                                                                                                        |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | مفتاح تكوين وقت التشغيل `model`      | بالنسبة إلى Codex ACP، يطبّع OpenClaw `openai-codex/<model>` إلى معرّف نموذج المحوّل ويعيّن لواحق التفكير بعد الشرطة المائلة مثل `openai-codex/gpt-5.4/high` إلى `reasoning_effort`. |
| `/acp set thinking <level>`  | مفتاح تكوين وقت التشغيل `thinking`   | بالنسبة إلى Codex ACP، يرسل OpenClaw قيمة `reasoning_effort` المقابلة حيثما يدعم المحوّل ذلك.                                                                                 |
| `/acp permissions <profile>` | مفتاح تكوين وقت التشغيل `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | مفتاح تكوين وقت التشغيل `timeout`    | —                                                                                                                                                                              |
| `/acp cwd <path>`            | تجاوز `cwd` لوقت التشغيل             | تحديث مباشر.                                                                                                                                                                  |
| `/acp set <key> <value>`     | عام                                  | يستخدم `key=cwd` مسار تجاوز `cwd`.                                                                                                                                            |
| `/acp reset-options`         | يمسح جميع تجاوزات وقت التشغيل        | —                                                                                                                                                                              |

## أداة تشغيل acpx، وإعداد Plugin، والأذونات

لتكوين أداة تشغيل acpx (أسماء Claude Code / Codex / Gemini CLI
المستعارة)، وجسور MCP الخاصة بـ plugin-tools وOpenClaw-tools، وأوضاع أذونات ACP، راجع
[وكلاء ACP — الإعداد](/ar/tools/acp-agents-setup).

## استكشاف الأخطاء وإصلاحها

| العَرَض                                                                     | السبب المحتمل                                                                                                           | الإصلاح                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin الواجهة الخلفية مفقود أو معطّل أو محظور بواسطة `plugins.allow`.                                                       | ثبّت وفعّل Plugin الواجهة الخلفية، وأدرج `acpx` في `plugins.allow` عند ضبط قائمة السماح هذه، ثم شغّل `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP معطّل عموميًا.                                                                                                 | اضبط `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | الإرسال التلقائي من رسائل المحادثات العادية معطّل.                                                               | اضبط `acp.dispatch.enabled=true` لاستئناف توجيه المحادثات تلقائيًا؛ ستظل استدعاءات `sessions_spawn({ runtime: "acp" })` الصريحة تعمل.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | الوكيل غير موجود في قائمة السماح.                                                                                                | استخدم `agentId` مسموحًا به أو حدّث `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | لا يزال فحص تبعية Plugin أو الإصلاح الذاتي قيد التشغيل.                                                               | انتظر قليلًا وأعد تشغيل `/acp doctor`؛ إذا بقي غير سليم، افحص خطأ تثبيت الواجهة الخلفية وسياسة السماح/الحظر الخاصة بـ Plugin.                                             |
| لم يتم العثور على أمر الحاضنة                                                   | CLI المهايئ غير مثبّت، أو تبعيات Plugin المرحلية مفقودة، أو فشل جلب `npx` في أول تشغيل لمهايئ غير Codex. | شغّل `/acp doctor`، وأصلح تبعيات Plugin، وثبّت/سخّن المهايئ مسبقًا على مضيف Gateway، أو اضبط أمر وكيل acpx صراحةً.                          |
| النموذج غير موجود من الحاضنة                                            | معرّف النموذج صالح لمزوّد/حاضنة أخرى لكنه غير صالح لهدف ACP هذا.                                                | استخدم نموذجًا تسرده تلك الحاضنة، أو اضبط النموذج في الحاضنة، أو احذف التجاوز.                                                                            |
| خطأ مصادقة المورّد من الحاضنة                                          | OpenClaw سليم، لكن CLI/المزوّد الهدف لم يسجل الدخول.                                                     | سجّل الدخول أو وفّر مفتاح المزوّد المطلوب في بيئة مضيف Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | رمز مفتاح/معرّف/تسمية غير صالح.                                                                                                | شغّل `/acp sessions`، وانسخ المفتاح/التسمية بدقة، ثم أعد المحاولة.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | استُخدم `--bind here` من دون محادثة نشطة قابلة للربط.                                                            | انتقل إلى الدردشة/القناة الهدف وأعد المحاولة، أو استخدم إنشاءً غير مربوط.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | يفتقر المهايئ إلى قدرة ربط ACP بالمحادثة الحالية.                                                             | استخدم `/acp spawn ... --thread ...` حيث يكون ذلك مدعومًا، أو اضبط `bindings[]` من المستوى الأعلى، أو انتقل إلى قناة مدعومة.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | استُخدم `--thread here` خارج سياق سلسلة محادثة.                                                                         | انتقل إلى سلسلة المحادثة الهدف أو استخدم `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | مستخدم آخر يملك هدف الربط النشط.                                                                           | أعد الربط بصفتك المالك أو استخدم محادثة أو سلسلة محادثة أخرى.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | يفتقر المهايئ إلى قدرة ربط سلسلة المحادثة.                                                                               | استخدم `--thread off` أو انتقل إلى مهايئ/قناة مدعومة.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | وقت تشغيل ACP يعمل على جانب المضيف؛ جلسة الطالب معزولة.                                                              | استخدم `runtime="subagent"` من الجلسات المعزولة، أو شغّل إنشاء ACP من جلسة غير معزولة.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | طُلب `sandbox="require"` لوقت تشغيل ACP.                                                                         | استخدم `runtime="subagent"` للعزل المطلوب، أو استخدم ACP مع `sandbox="inherit"` من جلسة غير معزولة.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | لا تكشف الحاضنة الهدف تبديل نماذج ACP العام.                                                        | استخدم حاضنة تعلن عن ACP `models`/`session/set_model`، أو استخدم مراجع نماذج Codex ACP، أو اضبط النموذج مباشرةً في الحاضنة إذا كان لديها علم بدء تشغيل خاص بها. |
| بيانات ACP الوصفية مفقودة للجلسة المربوطة                                      | بيانات ACP الوصفية للجلسة قديمة/محذوفة.                                                                                    | أعد إنشاءها باستخدام `/acp spawn`، ثم أعد ربط/تركيز سلسلة المحادثة.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | يحظر `permissionMode` عمليات الكتابة/التنفيذ في جلسة ACP غير تفاعلية.                                                    | اضبط `plugins.entries.acpx.config.permissionMode` على `approve-all` وأعد تشغيل Gateway. راجع [تكوين الأذونات](/ar/tools/acp-agents-setup#permission-configuration). |
| تفشل جلسة ACP مبكرًا مع مخرجات قليلة                                  | مطالبات الأذونات محظورة بواسطة `permissionMode`/`nonInteractivePermissions`.                                        | افحص سجلات Gateway بحثًا عن `AcpRuntimeError`. للأذونات الكاملة، اضبط `permissionMode=approve-all`؛ وللتدهور السلس، اضبط `nonInteractivePermissions=deny`.        |
| تتوقف جلسة ACP إلى أجل غير مسمى بعد إكمال العمل                       | انتهت عملية الحاضنة لكن جلسة ACP لم تبلّغ عن الاكتمال.                                                    | راقب باستخدام `ps aux \| grep acpx`؛ وأنهِ العمليات القديمة يدويًا.                                                                                                       |
| ترى الحاضنة `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | تسرّب غلاف حدث داخلي عبر حدود ACP.                                                                | حدّث OpenClaw وأعد تشغيل تدفق الإكمال؛ ينبغي أن تتلقى الحاضنات الخارجية مطالبات إكمال عادية فقط.                                                          |

## ذات صلة

- [وكلاء ACP — الإعداد](/ar/tools/acp-agents-setup)
- [إرسال الوكيل](/ar/tools/agent-send)
- [واجهات CLI الخلفية](/ar/gateway/cli-backends)
- [حاضنة Codex](/ar/plugins/codex-harness)
- [أدوات عزل الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (وضع الجسر)](/ar/cli/acp)
- [الوكلاء الفرعيون](/ar/tools/subagents)
