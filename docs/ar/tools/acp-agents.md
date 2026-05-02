---
read_when:
    - تشغيل حاضنات البرمجة عبر ACP
    - إعداد جلسات ACP المرتبطة بالمحادثة على قنوات المراسلة
    - ربط محادثة قناة رسائل بجلسة ACP دائمة
    - استكشاف أخطاء الواجهة الخلفية لـ ACP أو ربط Plugin أو تسليم الإكمال وإصلاحها
    - تشغيل أوامر /acp من الدردشة
sidebarTitle: ACP agents
summary: شغّل أدوات البرمجة الخارجية (Claude Code، Cursor، Gemini CLI، Codex ACP الصريح، OpenClaw ACP، OpenCode) عبر الواجهة الخلفية لـ ACP
title: وكلاء ACP
x-i18n:
    generated_at: "2026-05-02T21:04:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec2404924cbb4c4cd0d94485bc7d8ea586c0ef5f4380e72d5212c8bd9d868c20
    source_path: tools/acp-agents.md
    workflow: 16
---

[جلسات Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
تتيح لـ OpenClaw تشغيل أدوات تسخير البرمجة الخارجية (مثل Pi وClaude Code
وCursor وCopilot وDroid وOpenClaw ACP وOpenCode وGemini CLI وأدوات
تسخير ACPX المدعومة الأخرى) عبر Plugin خلفية ACP.

يتم تتبع كل إنشاء جلسة ACP بوصفه [مهمة في الخلفية](/ar/automation/tasks).

<Note>
**ACP هو مسار أداة التسخير الخارجية، وليس مسار Codex الافتراضي.** يملك
Plugin خادم تطبيق Codex الأصلي عناصر التحكم `/codex ...` ووقت التشغيل
المضمن `agentRuntime.id: "codex"`؛ أما ACP فيملك عناصر التحكم
`/acp ...` وجلسات `sessions_spawn({ runtime: "acp" })`.

إذا أردت أن يتصل Codex أو Claude Code كعميل MCP خارجي مباشرة
بمحادثات قناة OpenClaw الحالية، فاستخدم
[`openclaw mcp serve`](/ar/cli/mcp) بدلا من ACP.
</Note>

## أي صفحة أريد؟

| ما الذي تريد فعله…                                                                              | استخدم هذا                            | ملاحظات                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ربط Codex أو التحكم به في المحادثة الحالية                                                      | `/codex bind`, `/codex threads`       | مسار خادم تطبيق Codex الأصلي عند تمكين Plugin `codex`؛ يتضمن ردود الدردشة المرتبطة، وتمرير الصور، والنموذج/السريع/الأذونات، والإيقاف، وعناصر التحكم في التوجيه. ACP بديل صريح |
| تشغيل Claude Code أو Gemini CLI أو Codex ACP الصريح أو أداة تسخير خارجية أخرى _عبر_ OpenClaw | هذه الصفحة                            | جلسات مرتبطة بالدردشة، و`/acp spawn`، و`sessions_spawn({ runtime: "acp" })`، ومهام الخلفية، وعناصر التحكم في وقت التشغيل                                                                 |
| عرض جلسة OpenClaw Gateway _كـ_ خادم ACP لمحرر أو عميل                                           | [`openclaw acp`](/ar/cli/acp)            | وضع الجسر. يتحدث IDE/العميل ACP إلى OpenClaw عبر stdio/WebSocket                                                                                                                             |
| إعادة استخدام AI CLI محلي كنموذج احتياطي نصي فقط                                                | [واجهات CLI الخلفية](/ar/gateway/cli-backends) | ليس ACP. لا توجد أدوات OpenClaw، ولا عناصر تحكم ACP، ولا وقت تشغيل لأداة التسخير                                                                                                            |

## هل يعمل هذا مباشرة دون إعداد إضافي؟

نعم، بعد تثبيت Plugin وقت تشغيل ACP الرسمي:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

يمكن لنسخ المصدر استخدام Plugin مساحة العمل المحلية `extensions/acpx` بعد
`pnpm install`. شغل `/acp doctor` لإجراء فحص جاهزية.

لا يعلّم OpenClaw الوكلاء عن إنشاء ACP إلا عندما يكون ACP **قابلا
للاستخدام فعلا**: يجب تمكين ACP، ويجب ألا يكون الإرسال معطلا، ويجب ألا
تكون الجلسة الحالية محظورة بسبب صندوق الحماية، ويجب أن تكون خلفية وقت
التشغيل محملة. إذا لم تتحقق هذه الشروط، تبقى Skills الخاصة بـ ACP Plugin
وإرشادات ACP في `sessions_spawn` مخفية حتى لا يقترح الوكيل خلفية غير
متاحة.

<AccordionGroup>
  <Accordion title="مشكلات التشغيل الأول الشائعة">
    - إذا كان `plugins.allow` مضبوطا، فهو مخزون Plugin تقييدي و**يجب** أن يتضمن `acpx`؛ وإلا فسيتم حظر خلفية ACP المثبتة عمدا وسيبلغ `/acp doctor` عن إدخال قائمة السماح المفقود.
    - يتم تجهيز محول Codex ACP مع Plugin `acpx` وتشغيله محليا عندما يكون ذلك ممكنا.
    - قد يستمر جلب محولات أدوات التسخير المستهدفة الأخرى عند الطلب باستخدام `npx` في أول مرة تستخدمها فيها.
    - يجب أن تكون مصادقة المورد موجودة على المضيف لأداة التسخير تلك.
    - إذا لم يكن لدى المضيف npm أو وصول إلى الشبكة، تفشل عمليات جلب محول التشغيل الأول إلى أن يتم تسخين ذاكرات التخزين المؤقت مسبقا أو تثبيت المحول بطريقة أخرى.

  </Accordion>
  <Accordion title="متطلبات وقت التشغيل">
    يشغل ACP عملية أداة تسخير خارجية حقيقية. يملك OpenClaw التوجيه،
    وحالة مهمة الخلفية، والتسليم، والارتباطات، والسياسة؛ وتملك أداة
    التسخير تسجيل دخول المورد، وكتالوج النماذج، وسلوك نظام الملفات،
    والأدوات الأصلية.

    قبل لوم OpenClaw، تحقق مما يلي:

    - يبلغ `/acp doctor` عن خلفية ممكنة وسليمة.
    - مسموح بمعرف الهدف بواسطة `acp.allowedAgents` عند ضبط قائمة السماح هذه.
    - يمكن لأمر أداة التسخير أن يبدأ على مضيف Gateway.
    - مصادقة المورد موجودة لأداة التسخير تلك (`claude`, `codex`, `gemini`, `opencode`, `droid`, إلخ).
    - النموذج المحدد موجود لأداة التسخير تلك — معرفات النماذج غير قابلة للنقل بين أدوات التسخير.
    - قيمة `cwd` المطلوبة موجودة ويمكن الوصول إليها، أو احذف `cwd` ودع الخلفية تستخدم قيمتها الافتراضية.
    - وضع الأذونات يطابق العمل. لا تستطيع الجلسات غير التفاعلية النقر على مطالبات الأذونات الأصلية، لذلك تحتاج عمليات البرمجة الكثيفة بالكتابة/التنفيذ عادة إلى ملف تعريف أذونات ACPX يمكنه المتابعة بلا واجهة تفاعلية.

  </Accordion>
</AccordionGroup>

لا يتم عرض أدوات OpenClaw Plugin ولا أدوات OpenClaw المضمنة على أدوات
تسخير ACP افتراضيا. مكّن جسور MCP الصريحة في
[وكلاء ACP — الإعداد](/ar/tools/acp-agents-setup) فقط عندما يجب أن تستدعي
أداة التسخير تلك الأدوات مباشرة.

## أهداف أدوات التسخير المدعومة

مع خلفية `acpx`، استخدم معرفات أدوات التسخير هذه كأهداف
`/acp spawn <id>` أو `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| معرف أداة التسخير | الخلفية المعتادة                              | ملاحظات                                                                            |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | محول Claude Code ACP                           | يتطلب مصادقة Claude Code على المضيف.                                                |
| `codex`    | محول Codex ACP                                 | بديل ACP صريح فقط عندما لا يكون `/codex` الأصلي متاحا أو عند طلب ACP.              |
| `copilot`  | محول GitHub Copilot ACP                        | يتطلب مصادقة Copilot CLI/وقت التشغيل.                                               |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | تجاوز أمر acpx إذا كان تثبيت محلي يعرض نقطة دخول ACP مختلفة.                       |
| `droid`    | Factory Droid CLI                              | يتطلب مصادقة Factory/Droid أو `FACTORY_API_KEY` في بيئة أداة التسخير.              |
| `gemini`   | محول Gemini CLI ACP                            | يتطلب مصادقة Gemini CLI أو إعداد مفتاح API.                                         |
| `iflow`    | iFlow CLI                                      | يعتمد توفر المحول والتحكم في النموذج على CLI المثبت.                                |
| `kilocode` | Kilo Code CLI                                  | يعتمد توفر المحول والتحكم في النموذج على CLI المثبت.                                |
| `kimi`     | Kimi/Moonshot CLI                              | يتطلب مصادقة Kimi/Moonshot على المضيف.                                              |
| `kiro`     | Kiro CLI                                       | يعتمد توفر المحول والتحكم في النموذج على CLI المثبت.                                |
| `opencode` | محول OpenCode ACP                              | يتطلب مصادقة OpenCode CLI/المورد.                                                   |
| `openclaw` | جسر OpenClaw Gateway عبر `openclaw acp`        | يتيح لأداة تسخير مدركة لـ ACP التحدث مرة أخرى إلى جلسة OpenClaw Gateway.           |
| `pi`       | وقت تشغيل Pi/OpenClaw المضمن                  | يستخدم لتجارب أدوات التسخير الأصلية في OpenClaw.                                   |
| `qwen`     | Qwen Code / Qwen CLI                           | يتطلب مصادقة متوافقة مع Qwen على المضيف.                                            |

يمكن تكوين الأسماء المستعارة المخصصة لوكلاء acpx داخل acpx نفسه، لكن
سياسة OpenClaw لا تزال تتحقق من `acp.allowedAgents` وأي تعيين
`agents.list[].runtime.acp.agent` قبل الإرسال.

## دليل تشغيل المشغل

تدفق `/acp` سريع من الدردشة:

<Steps>
  <Step title="إنشاء">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`، أو
    `/acp spawn codex --bind here` صريح.
  </Step>
  <Step title="العمل">
    تابع في المحادثة أو السلسلة المرتبطة (أو استهدف مفتاح الجلسة
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
    `/acp cancel` (الدور الحالي) أو `/acp close` (الجلسة + الارتباطات).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="تفاصيل دورة الحياة">
    - ينشئ Spawn جلسة وقت تشغيل ACP أو يستأنفها، ويسجل بيانات ACP الوصفية في مخزن جلسات OpenClaw، وقد ينشئ مهمة خلفية عندما يكون التشغيل مملوكا للأصل.
    - يتم التعامل مع جلسات ACP المملوكة للأصل كعمل في الخلفية حتى عندما تكون جلسة وقت التشغيل مستمرة؛ يمر الإكمال والتسليم عبر الأسطح من خلال منبه المهمة الأصلية بدلا من التصرف كجلسة دردشة عادية موجهة للمستخدم.
    - تغلق صيانة المهام جلسات ACP أحادية التشغيل الطرفية أو اليتيمة المملوكة للأصل. يتم الاحتفاظ بجلسات ACP المستمرة ما دام ارتباط محادثة نشط باقيا؛ وتغلق الجلسات المستمرة القديمة دون ارتباط نشط حتى لا يمكن استئنافها بصمت بعد انتهاء المهمة المالكة أو اختفاء سجل مهمتها.
    - تذهب رسائل المتابعة المرتبطة مباشرة إلى جلسة ACP حتى يتم إغلاق الارتباط أو إلغاء تركيزه أو إعادة ضبطه أو انتهاء صلاحيته.
    - تبقى أوامر Gateway محلية. لا يتم إرسال `/acp ...` و`/status` و`/unfocus` أبدا كنص مطالبة عادي إلى أداة تسخير ACP مرتبطة.
    - يجهض `cancel` الدور النشط عندما تدعم الخلفية الإلغاء؛ ولا يحذف الارتباط أو بيانات الجلسة الوصفية.
    - ينهي `close` جلسة ACP من وجهة نظر OpenClaw ويزيل الارتباط. قد تظل أداة التسخير تحتفظ بتاريخها العلوي الخاص إذا كانت تدعم الاستئناف.
    - عمال وقت التشغيل الخاملون مؤهلون للتنظيف بعد `acp.runtime.ttlMinutes`؛ وتظل بيانات الجلسة الوصفية المخزنة متاحة لـ `/acp sessions`.

  </Accordion>
  <Accordion title="قواعد توجيه Codex الأصلية">
    محفزات اللغة الطبيعية التي يجب أن توجه إلى **Plugin Codex الأصلي**
    عند تمكينه:

    - "اربط قناة Discord هذه بـ Codex."
    - "أرفق هذه الدردشة بسلسلة Codex `<id>`."
    - "اعرض سلاسل Codex، ثم اربط هذه."

    ربط محادثة Codex الأصلي هو مسار التحكم في الدردشة الافتراضي.
    لا تزال أدوات OpenClaw الديناميكية تنفذ عبر OpenClaw، بينما
    تنفذ أدوات Codex الأصلية مثل shell/apply-patch داخل Codex.
    بالنسبة إلى أحداث أدوات Codex الأصلية، يحقن OpenClaw مرحل hook
    أصليا لكل دور حتى تستطيع Plugin hooks حظر `before_tool_call`،
    ومراقبة `after_tool_call`، وتوجيه أحداث Codex `PermissionRequest`
    عبر موافقات OpenClaw. يتم ترحيل Hooks `Stop` الخاصة بـ Codex إلى
    `before_agent_finalize` في OpenClaw، حيث يمكن للـ Plugins طلب مرور
    نموذجي إضافي واحد قبل أن ينهي Codex إجابته. يبقى المرحل محافظا
    عمدا: فهو لا يغير وسيطات أدوات Codex الأصلية ولا يعيد كتابة سجلات
    سلاسل Codex. استخدم ACP الصريح فقط عندما تريد نموذج وقت تشغيل/جلسة
    ACP. حدود دعم Codex المضمنة موثقة في
    [عقد دعم أداة تسخير Codex v1](/ar/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="ورقة غش لاختيار النموذج / المزوّد / وقت التشغيل">
    - `openai-codex/*` — مسار OAuth/الاشتراك الخاص بـ PI Codex.
    - `openai/*` بالإضافة إلى `agentRuntime.id: "codex"` — وقت تشغيل Codex المضمن الأصلي لخادم التطبيق.
    - `/codex ...` — تحكم محادثة Codex الأصلي.
    - `/acp ...` أو `runtime: "acp"` — تحكم ACP/acpx صريح.

  </Accordion>
  <Accordion title="مشغلات اللغة الطبيعية لتوجيه ACP">
    المشغلات التي يجب أن توجّه إلى وقت تشغيل ACP:

    - "شغّل هذا كجلسة Claude Code ACP لمرة واحدة ولخّص النتيجة."
    - "استخدم Gemini CLI لهذه المهمة في سلسلة، ثم أبقِ المتابعات في السلسلة نفسها."
    - "شغّل Codex عبر ACP في سلسلة خلفية."

    يختار OpenClaw القيمة `runtime: "acp"`، ويحلّ معرّف الحاضنة `agentId`،
    ويربط بالمحادثة أو السلسلة الحالية عند دعم ذلك، ثم
    يوجّه المتابعات إلى تلك الجلسة حتى الإغلاق/انتهاء الصلاحية. يتبع Codex هذا
    المسار فقط عندما يكون ACP/acpx صريحًا أو عندما يكون Plugin Codex الأصلي
    غير متاح للعملية المطلوبة.

    بالنسبة إلى `sessions_spawn`، لا يُعلَن عن `runtime: "acp"` إلا عندما يكون ACP
    ممكّنًا، ولا يكون مقدّم الطلب داخل صندوق عزل، ويكون وقت تشغيل ACP
    الخلفي محمّلًا. يوقف `acp.dispatch.enabled=false` الإرسال التلقائي
    لسلاسل ACP مؤقتًا، لكنه لا يخفي أو يحظر استدعاءات
    `sessions_spawn({ runtime: "acp" })` الصريحة. يستهدف ذلك معرّفات حاضنات ACP مثل `codex`،
    أو `claude`، أو `droid`، أو `gemini`، أو `opencode`. لا تمرّر معرّف وكيل
    إعداد OpenClaw عاديًا من `agents_list` إلا إذا كان ذلك الإدخال
    مكوّنًا صراحةً مع `agents.list[].runtime.type="acp"`؛
    وإلا فاستخدم وقت تشغيل الوكيل الفرعي الافتراضي. عندما يكون وكيل OpenClaw
    مكوّنًا مع `runtime.type="acp"`، يستخدم OpenClaw
    `runtime.acp.agent` كمعرّف الحاضنة الأساسية.

  </Accordion>
</AccordionGroup>

## ACP مقابل الوكلاء الفرعيين

استخدم ACP عندما تريد وقت تشغيل حاضنة خارجيًا. استخدم **خادم تطبيق Codex
الأصلي** لربط/تحكم محادثة Codex عندما يكون Plugin `codex`
ممكّنًا. استخدم **الوكلاء الفرعيين** عندما تريد تشغيلات مفوّضة أصلية في OpenClaw.

| المجال          | جلسة ACP                           | تشغيل وكيل فرعي                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| وقت التشغيل       | Plugin خلفية ACP (مثل acpx) | وقت تشغيل الوكيل الفرعي الأصلي في OpenClaw  |
| مفتاح الجلسة   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| الأوامر الرئيسية | `/acp ...`                            | `/subagents ...`                   |
| أداة الإنشاء    | `sessions_spawn` مع `runtime:"acp"` | `sessions_spawn` (وقت التشغيل الافتراضي) |

راجع أيضًا [الوكلاء الفرعيين](/ar/tools/subagents).

## كيف يشغّل ACP ‏Claude Code

بالنسبة إلى Claude Code عبر ACP، تكون المكدس كالتالي:

1. مستوى تحكم جلسة OpenClaw ACP.
2. Plugin وقت التشغيل الرسمي `@openclaw/acpx`.
3. محوّل Claude ACP.
4. آليات وقت التشغيل/الجلسة في جهة Claude.

ACP Claude هو **جلسة حاضنة** مع عناصر تحكم ACP، واستئناف الجلسة،
وتتبع مهام الخلفية، وربط اختياري بالمحادثة/السلسلة.

خلفيات CLI هي أوقات تشغيل احتياطية محلية نصية فقط ومنفصلة — راجع
[خلفيات CLI](/ar/gateway/cli-backends).

بالنسبة للمشغلين، القاعدة العملية هي:

- **تريد `/acp spawn`، أو جلسات قابلة للربط، أو عناصر تحكم وقت التشغيل، أو عمل حاضنة مستمر؟** استخدم ACP.
- **تريد احتياطًا نصيًا محليًا بسيطًا عبر CLI الخام؟** استخدم خلفيات CLI.

## الجلسات المربوطة

### النموذج الذهني

- **سطح الدردشة** — حيث يواصل الأشخاص الحديث (قناة Discord، موضوع Telegram، دردشة iMessage).
- **جلسة ACP** — حالة وقت تشغيل Codex/Claude/Gemini الدائمة التي يوجّه OpenClaw إليها.
- **سلسلة/موضوع فرعي** — سطح مراسلة إضافي اختياري يُنشأ فقط بواسطة `--thread ...`.
- **مساحة عمل وقت التشغيل** — موقع نظام الملفات (`cwd`، نسخة المستودع، مساحة عمل الخلفية) حيث تعمل الحاضنة. مستقلة عن سطح الدردشة.

### روابط المحادثة الحالية

يثبّت `/acp spawn <harness> --bind here` المحادثة الحالية إلى
جلسة ACP المنشأة — بلا سلسلة فرعية، وعلى سطح الدردشة نفسه. يستمر OpenClaw في
امتلاك النقل والمصادقة والسلامة والتسليم. تُوجّه رسائل المتابعة في تلك
المحادثة إلى الجلسة نفسها؛ يعيد `/new` و`/reset` تعيين
الجلسة في مكانها؛ ويزيل `/acp close` الربط.

أمثلة:

```text
/codex bind                                              # ربط Codex أصلي، وجّه الرسائل المستقبلية هنا
/codex model gpt-5.4                                     # اضبط سلسلة Codex الأصلية المربوطة
/codex stop                                              # تحكم في دورة Codex الأصلية النشطة
/acp spawn codex --bind here                             # احتياط ACP صريح لـ Codex
/acp spawn codex --thread auto                           # قد ينشئ سلسلة/موضوعًا فرعيًا ويربط هناك
/acp spawn codex --bind here --cwd /workspace/repo       # ربط الدردشة نفسه، يعمل Codex في /workspace/repo
```

<AccordionGroup>
  <Accordion title="قواعد الربط والحصرية">
    - `--bind here` و`--thread ...` متنافيان.
    - يعمل `--bind here` فقط على القنوات التي تعلن دعم ربط المحادثة الحالية؛ وإلا يعيد OpenClaw رسالة واضحة تفيد بعدم الدعم. تستمر الروابط عبر عمليات إعادة تشغيل Gateway.
    - في Discord، يتحكم `spawnSessions` في إنشاء السلاسل الفرعية لـ `--thread auto|here` — وليس `--bind here`.
    - إذا أنشأت إلى وكيل ACP مختلف دون `--cwd`، يرث OpenClaw مساحة عمل **الوكيل الهدف** افتراضيًا. تعود المسارات الموروثة المفقودة (`ENOENT`/`ENOTDIR`) إلى الافتراضي الخاص بالخلفية؛ أما أخطاء الوصول الأخرى (مثل `EACCES`) فتظهر كأخطاء إنشاء.
    - تبقى أوامر إدارة Gateway محلية في المحادثات المربوطة — تتولى OpenClaw أوامر `/acp ...` حتى عندما يُوجّه نص المتابعة العادي إلى جلسة ACP المربوطة؛ كما يبقى `/status` و`/unfocus` محليين كلما كان التعامل مع الأوامر ممكّنًا لذلك السطح.

  </Accordion>
  <Accordion title="الجلسات المربوطة بالسلاسل">
    عندما تكون روابط السلاسل ممكّنة لمحوّل قناة:

    - يربط OpenClaw سلسلة بجلسة ACP هدف.
    - تُوجّه رسائل المتابعة في تلك السلسلة إلى جلسة ACP المربوطة.
    - يُسلّم خرج ACP مرة أخرى إلى السلسلة نفسها.
    - يزيل إلغاء التركيز/الإغلاق/الأرشفة/مهلة الخمول أو انتهاء العمر الأقصى الربط.
    - `/acp close`، و`/acp cancel`، و`/acp status`، و`/status`، و`/unfocus` هي أوامر Gateway، وليست مطالبات إلى حاضنة ACP.

    أعلام الميزات المطلوبة لـ ACP المربوط بالسلاسل:

    - `acp.enabled=true`
    - يكون `acp.dispatch.enabled` مفعّلًا افتراضيًا (عيّن `false` لإيقاف إرسال سلاسل ACP التلقائي مؤقتًا؛ تظل استدعاءات `sessions_spawn({ runtime: "acp" })` الصريحة تعمل).
    - تمكين إنشاء جلسات السلاسل لمحوّل القناة (افتراضيًا: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    دعم ربط السلاسل خاص بالمحوّل. إذا كان محوّل القناة النشط
    لا يدعم روابط السلاسل، يعيد OpenClaw رسالة واضحة
    تفيد بعدم الدعم/عدم التوفر.

  </Accordion>
  <Accordion title="القنوات الداعمة للسلاسل">
    - أي محوّل قناة يعرّض قدرة ربط الجلسات/السلاسل.
    - الدعم المضمّن الحالي: سلاسل/قنوات **Discord**، وموضوعات **Telegram** (موضوعات المنتدى في المجموعات/المجموعات الفائقة وموضوعات الرسائل المباشرة).
    - يمكن لقنوات Plugin إضافة الدعم عبر واجهة الربط نفسها.

  </Accordion>
</AccordionGroup>

## روابط القنوات الدائمة

بالنسبة إلى سير العمل غير المؤقتة، كوّن روابط ACP الدائمة في
إدخالات `bindings[]` ذات المستوى الأعلى.

### نموذج الربط

<ParamField path="bindings[].type" type='"acp"'>
  يعلّم ربط محادثة ACP دائمًا.
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
  دليل عمل وقت التشغيل الاختياري.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  تجاوز خلفية اختياري.
</ParamField>

### افتراضيات وقت التشغيل لكل وكيل

استخدم `agents.list[].runtime` لتعريف افتراضيات ACP مرة واحدة لكل وكيل:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (معرّف الحاضنة، مثل `codex` أو `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**أسبقية التجاوز لجلسات ACP المربوطة:**

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

- يضمن OpenClaw وجود جلسة ACP المكوّنة قبل الاستخدام.
- تُوجّه الرسائل في تلك القناة أو ذلك الموضوع إلى جلسة ACP المكوّنة.
- في المحادثات المربوطة، يعيد `/new` و`/reset` تعيين مفتاح جلسة ACP نفسه في مكانه.
- تظل روابط وقت التشغيل المؤقتة (مثل التي تنشئها تدفقات تركيز السلاسل) مطبقة حيثما وجدت.
- بالنسبة إلى إنشاءات ACP العابرة للوكلاء دون `cwd` صريح، يرث OpenClaw مساحة عمل الوكيل الهدف من إعداد الوكيل.
- تعود مسارات مساحة العمل الموروثة المفقودة إلى cwd الافتراضي للخلفية؛ وتظهر إخفاقات الوصول غير المفقودة كأخطاء إنشاء.

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
    الإعداد الافتراضي لـ `runtime` هو `subagent`، لذلك اضبط `runtime: "acp"` صراحةً
    لجلسات ACP. إذا حُذف `agentId`، يستخدم OpenClaw
    `acp.defaultAgent` عند تكوينه. يتطلب `mode: "session"`
    `thread: true` للحفاظ على محادثة مرتبطة مستمرة.
    </Note>

  </Tab>
  <Tab title="من أمر /acp">
    استخدم `/acp spawn` للتحكم الصريح من المشغّل عبر الدردشة.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    العلامات الأساسية:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    راجع [أوامر Slash](/ar/tools/slash-commands).

  </Tab>
</Tabs>

### معاملات `sessions_spawn`

<ParamField path="task" type="string" required>
  الموجّه الأولي المرسل إلى جلسة ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  يجب أن يكون `"acp"` لجلسات ACP.
</ParamField>
<ParamField path="agentId" type="string">
  معرّف حزمة ACP المستهدفة. يرجع إلى `acp.defaultAgent` إذا كان معيّناً.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  اطلب تدفق ربط السلسلة حيث يكون مدعوماً.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` لمرة واحدة؛ و`"session"` مستمر. إذا كانت `thread: true` وكان
  `mode` محذوفاً، فقد يعتمد OpenClaw السلوك المستمر افتراضياً بحسب
  مسار runtime. يتطلب `mode: "session"` قيمة `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  دليل العمل المطلوب لـ runtime (يُتحقق منه وفق سياسة الخلفية/runtime).
  إذا حُذف، يرث إنشاء ACP مساحة عمل الوكيل المستهدف
  عند تكوينها؛ وتعود المسارات الموروثة المفقودة إلى
  الإعدادات الافتراضية للخلفية، بينما تُعاد أخطاء الوصول الحقيقية.
</ParamField>
<ParamField path="label" type="string">
  تسمية موجهة للمشغّل تُستخدم في نص الجلسة/الشعار.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  استأنف جلسة ACP موجودة بدلاً من إنشاء جلسة جديدة. يعيد
  الوكيل تشغيل سجل محادثته عبر `session/load`. يتطلب
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  يبث `"parent"` ملخصات تقدم تشغيل ACP الأولية إلى
  جلسة الطالب كأحداث نظام. تتضمن الاستجابات المقبولة
  `streamLogPath` الذي يشير إلى سجل JSONL بنطاق الجلسة
  (`<sessionId>.acp-stream.jsonl`) يمكنك تتبعه للحصول على سجل الترحيل الكامل.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  يوقف دور ACP الفرعي بعد N ثانية. تُبقي `0` الدور على
  مسار Gateway بلا مهلة انتهاء. تُطبق القيمة نفسها على تشغيل Gateway
  وruntime الخاص بـ ACP حتى لا تشغل الحِزم المتوقفة أو المستنفدة للحصة
  مسار الوكيل الأصل إلى أجل غير مسمى.
</ParamField>
<ParamField path="model" type="string">
  تجاوز صريح للنموذج لجلسة ACP الفرعية. تقوم عمليات إنشاء Codex ACP
  بتطبيع مراجع OpenClaw Codex مثل `openai-codex/gpt-5.4` إلى تكوين
  بدء Codex ACP قبل `session/new`؛ كما تضبط صيغ Slash مثل
  `openai-codex/gpt-5.4/high` جهد الاستدلال في Codex ACP.
  يجب على الحِزم الأخرى الإعلان عن `models` في ACP ودعم
  `session/set_model`؛ وإلا يفشل OpenClaw/acpx بوضوح بدلاً من
  الرجوع بصمت إلى الإعداد الافتراضي للوكيل المستهدف.
</ParamField>
<ParamField path="thinking" type="string">
  جهد تفكير/استدلال صريح. بالنسبة إلى Codex ACP، تُطابق `minimal`
  الجهد المنخفض، وتُطابق `low`/`medium`/`high`/`xhigh` مباشرةً، و`off`
  يحذف تجاوز بدء جهد الاستدلال.
</ParamField>

## أوضاع ربط الإنشاء والسلسلة

<Tabs>
  <Tab title="--bind here|off">
    | الوضع | السلوك                                                                |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | اربط المحادثة النشطة الحالية في مكانها؛ وافشل إذا لم تكن هناك محادثة نشطة. |
    | `off`  | لا تنشئ ربطاً بالمحادثة الحالية.                                      |

    ملاحظات:

    - `--bind here` هو أبسط مسار للمشغّل من أجل "اجعل هذه القناة أو الدردشة مدعومة من Codex."
    - لا ينشئ `--bind here` سلسلة فرعية.
    - لا يتوفر `--bind here` إلا على القنوات التي تكشف دعماً لربط المحادثة الحالية.
    - لا يمكن الجمع بين `--bind` و`--thread` في استدعاء `/acp spawn` نفسه.

  </Tab>
  <Tab title="--thread auto|here|off">
    | الوضع | السلوك                                                                                             |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | داخل سلسلة نشطة: اربط تلك السلسلة. خارج السلسلة: أنشئ/اربط سلسلة فرعية عندما يكون ذلك مدعوماً. |
    | `here` | اشترط وجود سلسلة نشطة حالية؛ وافشل إذا لم تكن داخل واحدة.                                      |
    | `off`  | بلا ربط. تبدأ الجلسة غير مرتبطة.                                                                  |

    ملاحظات:

    - على الأسطح التي لا تدعم ربط السلاسل، يكون السلوك الافتراضي فعلياً `off`.
    - يتطلب الإنشاء المرتبط بسلسلة دعماً من سياسة القناة:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - استخدم `--bind here` عندما تريد تثبيت المحادثة الحالية دون إنشاء سلسلة فرعية.

  </Tab>
</Tabs>

## نموذج التسليم

يمكن أن تكون جلسات ACP إما مساحات عمل تفاعلية أو عملاً خلفياً
مملوكاً للأصل. يعتمد مسار التسليم على هذا الشكل.

<AccordionGroup>
  <Accordion title="جلسات ACP التفاعلية">
    صُممت الجلسات التفاعلية للاستمرار في الحديث على سطح دردشة مرئي:

    - يربط `/acp spawn ... --bind here` المحادثة الحالية بجلسة ACP.
    - يربط `/acp spawn ... --thread ...` سلسلة/موضوع قناة بجلسة ACP.
    - توجه `bindings[].type="acp"` المستمرة والمكوّنة المحادثات المطابقة إلى جلسة ACP نفسها.

    تُوجّه رسائل المتابعة في المحادثة المرتبطة مباشرةً إلى
    جلسة ACP، ويُسلّم خرج ACP مرة أخرى إلى
    القناة/السلسلة/الموضوع نفسه.

    ما يرسله OpenClaw إلى الحزمة:

    - تُرسل المتابعات المرتبطة العادية كنص موجّه، مع المرفقات فقط عندما تدعمها الحزمة/الخلفية.
    - تُعترض أوامر إدارة `/acp` وأوامر Gateway المحلية قبل إرسال ACP.
    - تُجسّد أحداث الإكمال التي ينشئها runtime لكل هدف. تحصل وكلاء OpenClaw على غلاف سياق runtime الداخلي الخاص بـ OpenClaw؛ وتحصل حِزم ACP الخارجية على موجّه عادي يتضمن نتيجة الطفل والتعليمات. يجب ألا يُرسل غلاف `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` الخام أبداً إلى الحِزم الخارجية أو يُحفظ كنص في سجل مستخدم ACP.
    - تستخدم إدخالات سجل ACP نص المشغّل المرئي للمستخدم أو موجّه الإكمال العادي. تبقى بيانات تعريف الأحداث الداخلية منظمة في OpenClaw حيثما أمكن، ولا تُعامل كمحتوى دردشة من إنشاء المستخدم.

  </Accordion>
  <Accordion title="جلسات ACP لمرة واحدة مملوكة للأصل">
    جلسات ACP لمرة واحدة التي ينشئها تشغيل وكيل آخر تعمل كأطفال
    في الخلفية، شبيهة بالوكلاء الفرعيين:

    - يطلب الأصل عملاً باستخدام `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - يعمل الطفل في جلسة حزمة ACP الخاصة به.
    - تعمل أدوار الطفل على مسار الخلفية نفسه المستخدم لعمليات إنشاء الوكيل الفرعي الأصلية، لذلك لا تمنع حزمة ACP البطيئة عمل الجلسة الرئيسية غير ذي الصلة.
    - تُبلّغ الإكمالات عبر مسار إعلان إكمال المهمة. يحوّل OpenClaw بيانات تعريف الإكمال الداخلية إلى موجّه ACP عادي قبل إرسالها إلى حزمة خارجية، بحيث لا ترى الحِزم علامات سياق runtime الخاصة بـ OpenClaw فقط.
    - يعيد الأصل صياغة نتيجة الطفل بصوت المساعد العادي عندما يكون الرد الموجه للمستخدم مفيداً.

    **لا** تعامل هذا المسار كمحادثة ندية بين الأصل
    والطفل. لدى الطفل بالفعل قناة إكمال عائدة إلى
    الأصل.

  </Accordion>
  <Accordion title="sessions_send وتسليم A2A">
    يمكن لـ `sessions_send` استهداف جلسة أخرى بعد الإنشاء. بالنسبة إلى
    الجلسات الندية العادية، يستخدم OpenClaw مسار متابعة من وكيل إلى وكيل
    (A2A) بعد حقن الرسالة:

    - انتظر رد الجلسة المستهدفة.
    - اسمح اختيارياً للطالب والهدف بتبادل عدد محدود من أدوار المتابعة.
    - اطلب من الهدف إنتاج رسالة إعلان.
    - سلّم ذلك الإعلان إلى القناة أو السلسلة المرئية.

    مسار A2A هذا هو بديل احتياطي للإرسالات الندية عندما يحتاج المرسل إلى
    متابعة مرئية. يبقى مفعلاً عندما تستطيع جلسة غير ذات صلة
    رؤية هدف ACP ومراسلته، على سبيل المثال ضمن إعدادات
    `tools.sessions.visibility` الواسعة.

    يتجاوز OpenClaw متابعة A2A فقط عندما يكون الطالب هو
    أصل طفل ACP لمرة واحدة مملوك له. في تلك الحالة،
    يمكن أن يؤدي تشغيل A2A فوق إكمال المهمة إلى إيقاظ الأصل بنتيجة
    الطفل، وإعادة توجيه رد الأصل إلى الطفل، وإنشاء
    حلقة صدى أصل/طفل. تبلغ نتيجة `sessions_send`
    `delivery.status="skipped"` في حالة الطفل المملوك هذه لأن
    مسار الإكمال مسؤول بالفعل عن النتيجة.

  </Accordion>
  <Accordion title="استئناف جلسة موجودة">
    استخدم `resumeSessionId` لمتابعة جلسة ACP سابقة بدلاً من
    البدء من جديد. يعيد الوكيل تشغيل سجل محادثته عبر
    `session/load`، لذلك يستأنف بسياق كامل لما سبق.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    حالات الاستخدام الشائعة:

    - سلّم جلسة Codex من حاسوبك المحمول إلى هاتفك — أخبر وكيلك أن يستأنف من حيث توقفت.
    - تابع جلسة برمجة بدأتها تفاعلياً في CLI، والآن دون واجهة عبر وكيلك.
    - استأنف عملاً قاطعه إعادة تشغيل gateway أو مهلة الخمول.

    ملاحظات:

    - لا ينطبق `resumeSessionId` إلا عندما يكون `runtime: "acp"`؛ يتجاهل runtime الافتراضي للوكيل الفرعي هذا الحقل الخاص بـ ACP فقط.
    - لا ينطبق `streamTo` إلا عندما يكون `runtime: "acp"`؛ يتجاهل runtime الافتراضي للوكيل الفرعي هذا الحقل الخاص بـ ACP فقط.
    - `resumeSessionId` هو معرّف استئناف ACP/حزمة محلي للمضيف، وليس مفتاح جلسة قناة OpenClaw؛ لا يزال OpenClaw يتحقق من سياسة إنشاء ACP وسياسة الوكيل المستهدف قبل الإرسال، بينما تمتلك خلفية ACP أو الحزمة صلاحية تحميل ذلك المعرّف upstream.
    - يستعيد `resumeSessionId` سجل محادثة ACP upstream؛ ولا يزال `thread` و`mode` ينطبقان بشكل عادي على جلسة OpenClaw الجديدة التي تنشئها، لذلك لا يزال `mode: "session"` يتطلب `thread: true`.
    - يجب أن يدعم الوكيل المستهدف `session/load` (يدعمه Codex وClaude Code).
    - إذا لم يُعثر على معرّف الجلسة، يفشل الإنشاء بخطأ واضح — بلا رجوع صامت إلى جلسة جديدة.

  </Accordion>
  <Accordion title="اختبار دخان بعد النشر">
    بعد نشر gateway، شغّل فحصاً حياً من طرف إلى طرف بدلاً من
    الثقة باختبارات الوحدة:

    1. تحقق من إصدار gateway المنشور والالتزام على المضيف المستهدف.
    2. افتح جلسة جسر ACPX مؤقتة إلى وكيل حي.
    3. اطلب من ذلك الوكيل استدعاء `sessions_spawn` مع `runtime: "acp"` و`agentId: "codex"` و`mode: "run"` والمهمة `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. تحقق من `accepted=yes` ووجود `childSessionKey` حقيقي ومن عدم وجود خطأ تحقق.
    5. نظّف جلسة الجسر المؤقتة.

    أبقِ البوابة على `mode: "run"` وتجاوز `streamTo: "parent"` —
    فمسارات `mode: "session"` المرتبطة بسلسلة وترحيل البث هي
    اختبارات تكامل أغنى ومنفصلة.

  </Accordion>
</AccordionGroup>

## توافق Sandbox

تعمل جلسات ACP حالياً على runtime المضيف، **وليس** داخل
Sandbox الخاص بـ OpenClaw.

<Warning>
**حد الأمان:**

- يستطيع المشغّل الخارجي القراءة/الكتابة وفقًا لأذونات CLI الخاصة به و`cwd` المحدد.
- لا تغلّف سياسة وضع الحماية في OpenClaw تنفيذ مشغّل ACP.
- يظل OpenClaw يفرض بوابات ميزات ACP، والوكلاء المسموح بهم، وملكية الجلسة، وربط القنوات، وسياسة تسليم Gateway.
- استخدم `runtime: "subagent"` للعمل الأصلي في OpenClaw مع فرض وضع الحماية.

</Warning>

القيود الحالية:

- إذا كانت جلسة مقدّم الطلب في وضع الحماية، فسيتم حظر إنشاءات ACP لكل من `sessions_spawn({ runtime: "acp" })` و`/acp spawn`.
- لا يدعم `sessions_spawn` مع `runtime: "acp"` الخيار `sandbox: "require"`.

## حل هدف الجلسة

تقبل معظم إجراءات `/acp` هدف جلسة اختياريًا (`session-key` أو
`session-id` أو `session-label`).

**ترتيب الحل:**

1. وسيطة الهدف الصريحة (أو `--session` لـ `/acp steer`)
   - تجرّب المفتاح
   - ثم معرّف جلسة بشكل UUID
   - ثم التسمية
2. ربط المحادثة الحالية (إذا كانت هذه المحادثة/الموضوع مرتبطة بجلسة ACP).
3. الرجوع إلى جلسة مقدّم الطلب الحالية.

تشارك روابط المحادثة الحالية وروابط الموضوع في
الخطوة 2.

إذا لم يتم حل أي هدف، يعيد OpenClaw خطأ واضحًا
(`Unable to resolve session target: ...`).

## عناصر تحكم ACP

| الأمر                | ما يفعله                                                 | مثال                                                         |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| `/acp spawn`         | ينشئ جلسة ACP؛ مع ربط حالي أو ربط موضوع اختياري.         | `/acp spawn codex --bind here --cwd /repo`                   |
| `/acp cancel`        | يلغي الدور قيد التنفيذ لجلسة الهدف.                      | `/acp cancel agent:codex:acp:<uuid>`                         |
| `/acp steer`         | يرسل تعليمة توجيه إلى جلسة قيد التشغيل.                  | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | يغلق الجلسة ويفك ربط أهداف الموضوع.                      | `/acp close`                                                 |
| `/acp status`        | يعرض الخلفية، والوضع، والحالة، وخيارات وقت التشغيل، والإمكانات. | `/acp status`                                                |
| `/acp set-mode`      | يعيّن وضع وقت التشغيل لجلسة الهدف.                       | `/acp set-mode plan`                                         |
| `/acp set`           | يكتب خيار تكوين عام لوقت التشغيل.                        | `/acp set model openai/gpt-5.4`                              |
| `/acp cwd`           | يعيّن تجاوز دليل العمل لوقت التشغيل.                     | `/acp cwd /Users/user/Projects/repo`                         |
| `/acp permissions`   | يعيّن ملف سياسة الموافقات.                               | `/acp permissions strict`                                    |
| `/acp timeout`       | يعيّن مهلة وقت التشغيل (بالثواني).                       | `/acp timeout 120`                                           |
| `/acp model`         | يعيّن تجاوز نموذج وقت التشغيل.                           | `/acp model anthropic/claude-opus-4-6`                       |
| `/acp reset-options` | يزيل تجاوزات خيارات وقت تشغيل الجلسة.                    | `/acp reset-options`                                         |
| `/acp sessions`      | يسرد جلسات ACP الأخيرة من المخزن.                        | `/acp sessions`                                              |
| `/acp doctor`        | صحة الخلفية، والإمكانات، والإصلاحات القابلة للتنفيذ.     | `/acp doctor`                                                |
| `/acp install`       | يطبع خطوات تثبيت وتمكين حتمية.                           | `/acp install`                                               |

يعرض `/acp status` خيارات وقت التشغيل الفعّالة بالإضافة إلى معرّفات الجلسة على مستوى وقت التشغيل
وعلى مستوى الخلفية. تظهر أخطاء عناصر التحكم غير المدعومة
بوضوح عندما تفتقر الخلفية إلى إمكانية. يقرأ `/acp sessions`
المخزن للجلسة المرتبطة الحالية أو جلسة مقدّم الطلب؛ وتُحل رموز الهدف
(`session-key` أو `session-id` أو `session-label`) من خلال
اكتشاف جلسات Gateway، بما في ذلك جذور `session.store`
المخصصة لكل وكيل.

### ربط خيارات وقت التشغيل

يحتوي `/acp` على أوامر مختصرة ومحدّد عام. العمليات المكافئة:

| الأمر                        | يرتبط بـ                             | ملاحظات                                                                                                                                                                       |
| ---------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | مفتاح تكوين وقت التشغيل `model`      | بالنسبة إلى Codex ACP، يطبّع OpenClaw‏ `openai-codex/<model>` إلى معرّف نموذج المهايئ ويربط لواحق التفكير بشرطة مائلة مثل `openai-codex/gpt-5.4/high` بـ`reasoning_effort`. |
| `/acp set thinking <level>`  | مفتاح تكوين وقت التشغيل `thinking`   | بالنسبة إلى Codex ACP، يرسل OpenClaw قيمة `reasoning_effort` المقابلة حيث يدعم المهايئ ذلك.                                                                                  |
| `/acp permissions <profile>` | مفتاح تكوين وقت التشغيل `approval_policy` | —                                                                                                                                                                             |
| `/acp timeout <seconds>`     | مفتاح تكوين وقت التشغيل `timeout`    | —                                                                                                                                                                             |
| `/acp cwd <path>`            | تجاوز cwd لوقت التشغيل               | تحديث مباشر.                                                                                                                                                                  |
| `/acp set <key> <value>`     | عام                                  | يستخدم `key=cwd` مسار تجاوز cwd.                                                                                                                                             |
| `/acp reset-options`         | يمسح كل تجاوزات وقت التشغيل          | —                                                                                                                                                                             |

## مشغّل acpx، وإعداد Plugin، والأذونات

لتكوين مشغّل acpx (الأسماء المستعارة لـ Claude Code / Codex / Gemini CLI)،
وجسور MCP الخاصة بـ plugin-tools وOpenClaw-tools، وأوضاع أذونات ACP،
راجع
[وكلاء ACP — الإعداد](/ar/tools/acp-agents-setup).

## استكشاف الأخطاء وإصلاحها

| العَرَض                                                                     | السبب المحتمل                                                                                                           | الإصلاح                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin الخلفية مفقود، أو معطّل، أو محظور بواسطة `plugins.allow`.                                                       | ثبّت Plugin الخلفية وفعّله، وضمّن `acpx` في `plugins.allow` عند ضبط قائمة السماح هذه، ثم شغّل `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP معطّل عمومًا.                                                                                                 | اضبط `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | الإرسال التلقائي من رسائل السلاسل العادية معطّل.                                                               | اضبط `acp.dispatch.enabled=true` لاستئناف التوجيه التلقائي للسلاسل؛ ستظل استدعاءات `sessions_spawn({ runtime: "acp" })` الصريحة تعمل.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | الوكيل غير موجود في قائمة السماح.                                                                                                | استخدم `agentId` مسموحًا به أو حدّث `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | Plugin الخلفية مفقود، أو معطّل، أو محظور بسياسة السماح/الرفض، أو أن الملف التنفيذي المضبوط له غير متاح.        | ثبّت/فعّل Plugin الخلفية، وأعد تشغيل `/acp doctor`، وافحص خطأ تثبيت الخلفية أو السياسة إذا بقيت غير سليمة.                                           |
| أمر الحاضنة غير موجود                                                   | CLI المهايئ غير مثبتة، أو Plugin الخارجي مفقود، أو فشل جلب `npx` لأول تشغيل لمهايئ غير Codex. | شغّل `/acp doctor`، وثبّت/حضّر المهايئ على مضيف Gateway، أو اضبط أمر وكيل acpx صراحةً.                                                      |
| عدم العثور على النموذج من الحاضنة                                            | معرّف النموذج صالح لمزوّد/حاضنة أخرى ولكن ليس لهدف ACP هذا.                                                | استخدم نموذجًا مدرجًا في تلك الحاضنة، أو اضبط النموذج في الحاضنة، أو احذف التجاوز.                                                                            |
| خطأ مصادقة المورّد من الحاضنة                                          | OpenClaw سليم، لكن CLI/المزوّد الهدف لم يسجّل الدخول.                                                     | سجّل الدخول أو وفّر مفتاح المزوّد المطلوب في بيئة مضيف Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | مفتاح/معرّف/رمز تسمية غير صحيح.                                                                                                | شغّل `/acp sessions`، وانسخ المفتاح/التسمية بالضبط، ثم أعد المحاولة.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | استُخدم `--bind here` بدون محادثة نشطة قابلة للربط.                                                            | انتقل إلى الدردشة/القناة الهدف وأعد المحاولة، أو استخدم إنشاءً غير مرتبط.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | يفتقر المهايئ إلى قدرة ربط ACP بالمحادثة الحالية.                                                             | استخدم `/acp spawn ... --thread ...` حيثما كان مدعومًا، أو اضبط `bindings[]` على المستوى الأعلى، أو انتقل إلى قناة مدعومة.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | استُخدم `--thread here` خارج سياق سلسلة.                                                                         | انتقل إلى السلسلة الهدف أو استخدم `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | يملك مستخدم آخر هدف الربط النشط.                                                                           | أعد الربط بصفتك المالك أو استخدم محادثة أو سلسلة مختلفة.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | يفتقر المهايئ إلى قدرة ربط السلاسل.                                                                               | استخدم `--thread off` أو انتقل إلى مهايئ/قناة مدعومة.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | وقت تشغيل ACP موجود على جانب المضيف؛ جلسة الطالب تعمل في صندوق عزل.                                                              | استخدم `runtime="subagent"` من الجلسات المعزولة، أو شغّل إنشاء ACP من جلسة غير معزولة.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | طُلب `sandbox="require"` لوقت تشغيل ACP.                                                                         | استخدم `runtime="subagent"` للعزل المطلوب، أو استخدم ACP مع `sandbox="inherit"` من جلسة غير معزولة.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | لا تعرض الحاضنة الهدف تبديل نماذج ACP العام.                                                        | استخدم حاضنة تعلن عن ACP `models`/`session/set_model`، أو استخدم مراجع نماذج Codex ACP، أو اضبط النموذج مباشرةً في الحاضنة إذا كان لديها علم تشغيل خاص بها. |
| بيانات ACP الوصفية مفقودة للجلسة المرتبطة                                      | بيانات ACP الوصفية للجلسة قديمة/محذوفة.                                                                                    | أعد إنشاءها باستخدام `/acp spawn`، ثم أعد ربط/تركيز السلسلة.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | يحظر `permissionMode` عمليات الكتابة/التنفيذ في جلسة ACP غير التفاعلية.                                                    | اضبط `plugins.entries.acpx.config.permissionMode` على `approve-all` وأعد تشغيل Gateway. راجع [ضبط الأذونات](/ar/tools/acp-agents-setup#permission-configuration). |
| تفشل جلسة ACP مبكرًا مع مخرجات قليلة                                  | مطالبات الأذونات محظورة بواسطة `permissionMode`/`nonInteractivePermissions`.                                        | افحص سجلات Gateway بحثًا عن `AcpRuntimeError`. للأذونات الكاملة، اضبط `permissionMode=approve-all`؛ وللتدهور السلس، اضبط `nonInteractivePermissions=deny`.        |
| تتوقف جلسة ACP إلى أجل غير مسمى بعد إكمال العمل                       | انتهت عملية الحاضنة لكن جلسة ACP لم تبلّغ عن الاكتمال.                                                    | راقب باستخدام `ps aux \| grep acpx`؛ واقتل العمليات القديمة يدويًا.                                                                                                       |
| ترى الحاضنة `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | تسرّب غلاف حدث داخلي عبر حدود ACP.                                                                | حدّث OpenClaw وأعد تشغيل تدفق الإكمال؛ يجب أن تتلقى الحاضنات الخارجية مطالبات إكمال عادية فقط.                                                          |

## ذات صلة

- [وكلاء ACP — الإعداد](/ar/tools/acp-agents-setup)
- [إرسال الوكيل](/ar/tools/agent-send)
- [خلفيات CLI](/ar/gateway/cli-backends)
- [حاضنة Codex](/ar/plugins/codex-harness)
- [أدوات صندوق عزل الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (وضع الجسر)](/ar/cli/acp)
- [الوكلاء الفرعيون](/ar/tools/subagents)
