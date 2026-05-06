---
read_when:
    - تشغيل أطر البرمجة عبر ACP
    - إعداد جلسات ACP المرتبطة بالمحادثة على قنوات المراسلة
    - ربط محادثة قناة مراسلة بجلسة ACP دائمة
    - استكشاف أخطاء الواجهة الخلفية لـ ACP أو ربط Plugin أو تسليم الإكمال وإصلاحها
    - تشغيل أوامر /acp من الدردشة
sidebarTitle: ACP agents
summary: تشغيل أطر البرمجة الخارجية (Claude Code، Cursor، Gemini CLI، Codex ACP الصريح، OpenClaw ACP، OpenCode) عبر واجهة ACP الخلفية
title: وكلاء ACP
x-i18n:
    generated_at: "2026-05-06T08:15:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75744690ee307bc86d9a3de268c84e52d8a281ca8a0e7d2d39c9a0cb7fbe2b39
    source_path: tools/acp-agents.md
    workflow: 16
---

[جلسات Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
تتيح لـ OpenClaw تشغيل حواضن برمجة خارجية (مثل Pi وClaude Code وCursor وCopilot وDroid وOpenClaw ACP وOpenCode وGemini CLI وغيرها من حواضن ACPX المدعومة) عبر Plugin خلفية ACP.

يُتتبَّع كل إنشاء لجلسة ACP باعتباره [مهمة خلفية](/ar/automation/tasks).

<Note>
**ACP هو مسار الحاضنة الخارجية، وليس مسار Codex الافتراضي.** يملك
Plugin خادم تطبيق Codex الأصلي عناصر التحكم `/codex ...` ووقت التشغيل المضمّن
`agentRuntime.id: "codex"`؛ أما ACP فيملك عناصر التحكم
`/acp ...` وجلسات `sessions_spawn({ runtime: "acp" })`.

إذا كنت تريد أن يتصل Codex أو Claude Code كعميل MCP خارجي مباشرةً
بمحادثات قنوات OpenClaw الموجودة، فاستخدم
[`openclaw mcp serve`](/ar/cli/mcp) بدلاً من ACP.
</Note>

## أي صفحة أريد؟

| تريد أن…                                                                                         | استخدم هذا                            | ملاحظات                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ربط Codex أو التحكم به في المحادثة الحالية                                                      | `/codex bind`, `/codex threads`       | مسار خادم تطبيق Codex الأصلي عندما يكون Plugin `codex` مفعلاً؛ يتضمن ردود الدردشة المربوطة، وتمرير الصور، والنموذج/السريع/الأذونات، والإيقاف، وعناصر التحكم في التوجيه. ACP بديل صريح |
| تشغيل Claude Code أو Gemini CLI أو Codex ACP صريح أو حاضنة خارجية أخرى _عبر_ OpenClaw          | هذه الصفحة                            | جلسات مربوطة بالدردشة، و`/acp spawn`، و`sessions_spawn({ runtime: "acp" })`، ومهام خلفية، وعناصر تحكم وقت التشغيل                                                                                       |
| عرض جلسة OpenClaw Gateway _كخادم_ ACP لمحرر أو عميل                                             | [`openclaw acp`](/ar/cli/acp)            | وضع الجسر. يتحدث IDE/العميل ACP إلى OpenClaw عبر stdio/WebSocket                                                                                                                                        |
| إعادة استخدام CLI ذكاء اصطناعي محلي كنموذج احتياطي نصي فقط                                     | [خلفيات CLI](/ar/gateway/cli-backends) | ليس ACP. لا توجد أدوات OpenClaw، ولا عناصر تحكم ACP، ولا وقت تشغيل حاضنة                                                                                                                                |

## هل يعمل هذا مباشرةً؟

نعم، بعد تثبيت Plugin وقت تشغيل ACP الرسمي:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

يمكن لمستودعات المصدر استخدام Plugin مساحة العمل المحلي `extensions/acpx` بعد
`pnpm install`. شغّل `/acp doctor` لإجراء فحص الجاهزية.

لا يعلّم OpenClaw الوكلاء عن إنشاء ACP إلا عندما يكون ACP **قابلاً للاستخدام فعلاً**:
يجب أن يكون ACP مفعلاً، وألا يكون الإرسال معطلاً، وألا تكون الجلسة الحالية
محجوبة بواسطة صندوق الرمل، وأن تكون خلفية وقت التشغيل محمّلة. إذا لم تتحقق
هذه الشروط، تبقى Skills الخاصة بـ ACP Plugin وإرشادات ACP الخاصة بـ
`sessions_spawn` مخفية حتى لا يقترح الوكيل خلفية غير متاحة.

<AccordionGroup>
  <Accordion title="مشكلات التشغيل الأول">
    - إذا كان `plugins.allow` مضبوطاً، فهو مخزون Plugins تقييدي و**يجب** أن يتضمن `acpx`؛ وإلا فستُحظر خلفية ACP المثبتة عمداً وسيبلغ `/acp doctor` عن إدخال قائمة السماح المفقود.
    - يُحضَّر محوّل Codex ACP مع Plugin `acpx` ويُشغَّل محلياً عندما يكون ذلك ممكناً.
    - قد تظل محوّلات الحواضن الهدف الأخرى تُجلب عند الطلب باستخدام `npx` في أول مرة تستخدمها.
    - يجب أن تكون مصادقة المورّد موجودة على المضيف لتلك الحاضنة.
    - إذا لم يكن لدى المضيف npm أو وصول إلى الشبكة، تفشل عمليات جلب المحوّل في التشغيل الأول إلى أن تُسخَّن الذاكرات المؤقتة مسبقاً أو يُثبَّت المحوّل بطريقة أخرى.

  </Accordion>
  <Accordion title="متطلبات وقت التشغيل">
    يُطلق ACP عملية حاضنة خارجية حقيقية. يملك OpenClaw التوجيه،
    وحالة المهمة الخلفية، والتسليم، والارتباطات، والسياسة؛ وتملك الحاضنة
    تسجيل دخول المزوّد، وفهرس النماذج، وسلوك نظام الملفات، والأدوات
    الأصلية الخاصة بها.

    قبل لوم OpenClaw، تحقق مما يلي:

    - يبلغ `/acp doctor` عن خلفية مفعّلة وسليمة.
    - معرّف الهدف مسموح به بواسطة `acp.allowedAgents` عندما تكون قائمة السماح هذه مضبوطة.
    - يمكن لأمر الحاضنة أن يبدأ على مضيف Gateway.
    - مصادقة المزوّد موجودة لتلك الحاضنة (`claude`, `codex`, `gemini`, `opencode`, `droid`, وما إلى ذلك).
    - النموذج المحدد موجود لتلك الحاضنة - معرّفات النماذج غير قابلة للنقل بين الحواضن.
    - قيمة `cwd` المطلوبة موجودة ويمكن الوصول إليها، أو احذف `cwd` ودع الخلفية تستخدم القيمة الافتراضية لديها.
    - وضع الأذونات يطابق العمل. لا يمكن للجلسات غير التفاعلية النقر على مطالبات الأذونات الأصلية، لذلك تحتاج عمليات البرمجة كثيفة الكتابة/التنفيذ عادةً إلى ملف أذونات ACPX يمكنه المتابعة دون واجهة تفاعلية.

  </Accordion>
</AccordionGroup>

لا تُعرض أدوات OpenClaw Plugin وأدوات OpenClaw المدمجة على حواضن ACP
افتراضياً. فعّل جسور MCP الصريحة في
[وكلاء ACP - الإعداد](/ar/tools/acp-agents-setup) فقط عندما يجب أن تستدعي
الحاضنة تلك الأدوات مباشرةً.

## أهداف الحواضن المدعومة

مع خلفية `acpx`، استخدم معرّفات الحواضن هذه كأهداف
`/acp spawn <id>` أو `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| معرّف الحاضنة | الخلفية المعتادة                                | ملاحظات                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | محوّل Claude Code ACP                        | يتطلب مصادقة Claude Code على المضيف.                                              |
| `codex`    | محوّل Codex ACP                              | بديل ACP صريح فقط عندما يكون `/codex` الأصلي غير متاح أو عندما يُطلب ACP. |
| `copilot`  | محوّل GitHub Copilot ACP                     | يتطلب مصادقة Copilot CLI/وقت التشغيل.                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | تجاوز أمر acpx إذا كان تثبيت محلي يعرّض نقطة دخول ACP مختلفة.    |
| `droid`    | Factory Droid CLI                              | يتطلب مصادقة Factory/Droid أو `FACTORY_API_KEY` في بيئة الحاضنة.        |
| `gemini`   | محوّل Gemini CLI ACP                         | يتطلب مصادقة Gemini CLI أو إعداد مفتاح API.                                          |
| `iflow`    | iFlow CLI                                      | يعتمد توفر المحوّل والتحكم في النموذج على CLI المثبت.                 |
| `kilocode` | Kilo Code CLI                                  | يعتمد توفر المحوّل والتحكم في النموذج على CLI المثبت.                 |
| `kimi`     | Kimi/Moonshot CLI                              | يتطلب مصادقة Kimi/Moonshot على المضيف.                                            |
| `kiro`     | Kiro CLI                                       | يعتمد توفر المحوّل والتحكم في النموذج على CLI المثبت.                 |
| `opencode` | محوّل OpenCode ACP                           | يتطلب مصادقة OpenCode CLI/المزوّد.                                                |
| `openclaw` | جسر OpenClaw Gateway عبر `openclaw acp` | يتيح لحاضنة واعية بـ ACP التحدث مرة أخرى إلى جلسة OpenClaw Gateway.                 |
| `pi`       | وقت تشغيل Pi/OpenClaw المضمّن                   | يُستخدم لتجارب حواضن OpenClaw الأصلية.                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | يتطلب مصادقة متوافقة مع Qwen على المضيف.                                          |

يمكن تكوين ألقاب وكلاء acpx المخصصة في acpx نفسه، لكن سياسة OpenClaw
ما زالت تتحقق من `acp.allowedAgents` وأي تعيين
`agents.list[].runtime.acp.agent` قبل الإرسال.

## دليل تشغيل المشغّل

تدفق `/acp` سريع من الدردشة:

<Steps>
  <Step title="إنشاء">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`، أو بشكل صريح
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="العمل">
    تابع في المحادثة أو السلسلة المربوطة (أو استهدف مفتاح الجلسة
    صراحةً).
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
    من دون استبدال السياق: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="إيقاف">
    `/acp cancel` (الدور الحالي) أو `/acp close` (الجلسة + الارتباطات).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="تفاصيل دورة الحياة">
    - يُنشئ spawn جلسة وقت تشغيل ACP أو يستأنفها، ويسجّل بيانات ACP الوصفية في مخزن جلسات OpenClaw، وقد ينشئ مهمة خلفية عندما يكون التشغيل مملوكاً للأصل.
    - تُعامل جلسات ACP المملوكة للأصل كعمل خلفي حتى عندما تكون جلسة وقت التشغيل مستمرة؛ يمر الإكمال والتسليم عبر الأسطح عبر مُخطر المهمة الأصلية بدلاً من التصرف كجلسة دردشة عادية موجهة للمستخدم.
    - تغلق صيانة المهام جلسات ACP أحادية التشغيل النهائية أو اليتيمة والمملوكة للأصل. تُحفظ جلسات ACP المستمرة ما دام ارتباط محادثة نشطاً باقياً؛ وتُغلق الجلسات المستمرة القديمة التي لا تملك ارتباطاً نشطاً حتى لا يمكن استئنافها بصمت بعد انتهاء المهمة المالكة أو اختفاء سجل مهمتها.
    - تذهب رسائل المتابعة المربوطة مباشرةً إلى جلسة ACP إلى أن يُغلق الارتباط أو يُزال تركيزه أو يُعاد ضبطه أو تنتهي صلاحيته.
    - تبقى أوامر Gateway محلية. لا تُرسل `/acp ...` و`/status` و`/unfocus` أبداً كنص مطالبة عادي إلى حاضنة ACP مربوطة.
    - يوقف `cancel` الدور النشط عندما تدعم الخلفية الإلغاء؛ ولا يحذف الارتباط أو بيانات الجلسة الوصفية.
    - ينهي `close` جلسة ACP من وجهة نظر OpenClaw ويزيل الارتباط. قد تظل الحاضنة تحتفظ بتاريخها الصاعد إذا كانت تدعم الاستئناف.
    - تصبح عُمّال وقت التشغيل الخاملة مؤهلة للتنظيف بعد `acp.runtime.ttlMinutes`؛ وتبقى بيانات الجلسة الوصفية المخزنة متاحة لـ `/acp sessions`.

  </Accordion>
  <Accordion title="قواعد توجيه Codex الأصلي">
    مشغلات اللغة الطبيعية التي يجب أن تُوجَّه إلى **Plugin Codex الأصلي**
    عندما يكون مفعلاً:

    - "اربط قناة Discord هذه بـ Codex."
    - "أرفق هذه الدردشة بسلسلة Codex `<id>`."
    - "اعرض سلاسل Codex، ثم اربط هذه."

    ربط محادثة Codex الأصلي هو مسار التحكم بالدردشة الافتراضي.
    تظل أدوات OpenClaw الديناميكية تُنفَّذ عبر OpenClaw، بينما
    تُنفَّذ أدوات Codex الأصلية مثل shell/apply-patch داخل Codex.
    لأحداث أدوات Codex الأصلية، يحقن OpenClaw مُرحِّل خطاف أصلياً لكل دور
    حتى تتمكن خطافات Plugins من حظر `before_tool_call`، ومراقبة
    `after_tool_call`، وتوجيه أحداث `PermissionRequest` في Codex
    عبر موافقات OpenClaw. تُرحَّل خطافات `Stop` في Codex إلى
    `before_agent_finalize` في OpenClaw، حيث يمكن لـ Plugins طلب مرور نموذج
    إضافي قبل أن ينهي Codex إجابته. يبقى المُرحِّل محافظاً عن قصد:
    فهو لا يغيّر وسائط أدوات Codex الأصلية ولا يعيد كتابة سجلات سلاسل Codex.
    استخدم ACP الصريح فقط عندما تريد نموذج وقت تشغيل/جلسة ACP. حدود دعم
    Codex المضمّن موثقة في
    [عقد دعم حاضنة Codex v1](/ar/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="ورقة مرجعية سريعة لاختيار النموذج / المزوّد / وقت التشغيل">
    - `openai-codex/*` - مسار OAuth/الاشتراك لـ PI Codex.
    - `openai/*` بالإضافة إلى `agentRuntime.id: "codex"` - وقت تشغيل مضمّن أصلي لخادم تطبيق Codex.
    - `/codex ...` - تحكم أصلي في محادثة Codex.
    - `/acp ...` أو `runtime: "acp"` - تحكم ACP/acpx صريح.

  </Accordion>
  <Accordion title="مشغلات اللغة الطبيعية لتوجيه ACP">
    المشغلات التي يجب توجيهها إلى وقت تشغيل ACP:

    - "شغّل هذا كجلسة Claude Code ACP لمرة واحدة ولخّص النتيجة."
    - "استخدم Gemini CLI لهذه المهمة في سلسلة محادثات، ثم أبقِ المتابعات في سلسلة المحادثات نفسها."
    - "شغّل Codex عبر ACP في سلسلة محادثات في الخلفية."

    يختار OpenClaw القيمة `runtime: "acp"`، ويحلّ `agentId` الخاص بالحاضنة،
    ويرتبط بالمحادثة أو سلسلة المحادثات الحالية عند دعمه، ثم
    يوجّه المتابعات إلى تلك الجلسة حتى الإغلاق/انتهاء الصلاحية. لا يتبع Codex
    هذا المسار إلا عندما يكون ACP/acpx صريحًا أو عندما يكون Plugin الأصلي
    لـ Codex غير متاح للعملية المطلوبة.

    بالنسبة إلى `sessions_spawn`، لا يتم الإعلان عن `runtime: "acp"` إلا عندما يكون ACP
    مفعّلًا، ولا يكون الطالب ضمن sandbox، ويكون backend لوقت تشغيل ACP
    محمّلًا. يوقف `acp.dispatch.enabled=false` الإرسال التلقائي
    لسلاسل محادثات ACP لكنه لا يخفي أو يحظر استدعاءات
    `sessions_spawn({ runtime: "acp" })` الصريحة. يستهدف ذلك معرّفات حاضنة ACP مثل `codex`،
    أو `claude`، أو `droid`، أو `gemini`، أو `opencode`. لا تمرّر معرّف وكيل
    إعداد OpenClaw عاديًا من `agents_list` إلا إذا كان ذلك الإدخال
    مضبوطًا صراحةً باستخدام `agents.list[].runtime.type="acp"`؛
    وإلا فاستخدم وقت تشغيل الوكيل الفرعي الافتراضي. عندما يكون وكيل OpenClaw
    مضبوطًا باستخدام `runtime.type="acp"`، يستخدم OpenClaw
    `runtime.acp.agent` كمعرّف الحاضنة الأساسي.

  </Accordion>
</AccordionGroup>

## ACP مقابل الوكلاء الفرعيين

استخدم ACP عندما تريد وقت تشغيل حاضنة خارجية. استخدم **خادم تطبيق Codex
الأصلي** لربط/التحكم في محادثات Codex عندما يكون Plugin `codex`
مفعّلًا. استخدم **الوكلاء الفرعيين** عندما تريد تشغيلات تفويض أصلية في OpenClaw.

| المجال          | جلسة ACP                           | تشغيل وكيل فرعي                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| وقت التشغيل       | Plugin backend لـ ACP (مثل acpx) | وقت تشغيل وكيل فرعي أصلي في OpenClaw  |
| مفتاح الجلسة   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| الأوامر الرئيسية | `/acp ...`                            | `/subagents ...`                   |
| أداة الإنشاء    | `sessions_spawn` مع `runtime:"acp"` | `sessions_spawn` (وقت التشغيل الافتراضي) |

راجع أيضًا [الوكلاء الفرعيون](/ar/tools/subagents).

## كيف يشغّل ACP‏ Claude Code

بالنسبة إلى Claude Code عبر ACP، تكون المكدّسة:

1. مستوى التحكم في جلسات ACP في OpenClaw.
2. Plugin وقت التشغيل الرسمي `@openclaw/acpx`.
3. محوّل Claude ACP.
4. آليات وقت التشغيل/الجلسة من جهة Claude.

ACP Claude هو **جلسة حاضنة** مع عناصر تحكم ACP، واستئناف الجلسة،
وتتبّع مهام الخلفية، وربط اختياري بالمحادثة/سلسلة المحادثات.

تُعد backends الخاصة بـ CLI أوقات تشغيل احتياطية محلية نصية فقط ومنفصلة - راجع
[CLI Backends](/ar/gateway/cli-backends).

بالنسبة إلى المشغّلين، القاعدة العملية هي:

- **هل تريد `/acp spawn` أو جلسات قابلة للربط أو عناصر تحكم وقت التشغيل أو عمل حاضنة مستمرًا؟** استخدم ACP.
- **هل تريد احتياطيًا نصيًا محليًا بسيطًا عبر CLI الخام؟** استخدم backends الخاصة بـ CLI.

## الجلسات المربوطة

### النموذج الذهني

- **سطح الدردشة** - المكان الذي يواصل فيه الأشخاص الحديث (قناة Discord، موضوع Telegram، دردشة iMessage).
- **جلسة ACP** - حالة وقت تشغيل Codex/Claude/Gemini الدائمة التي يوجّه إليها OpenClaw.
- **سلسلة/موضوع فرعي** - سطح مراسلة إضافي اختياري لا يُنشأ إلا بواسطة `--thread ...`.
- **مساحة عمل وقت التشغيل** - موقع نظام الملفات (`cwd` أو نسخة repo أو مساحة عمل backend) حيث تعمل الحاضنة. مستقلة عن سطح الدردشة.

### روابط المحادثة الحالية

يثبّت `/acp spawn <harness> --bind here` المحادثة الحالية إلى
جلسة ACP التي تم إنشاؤها - بلا سلسلة فرعية، وعلى سطح الدردشة نفسه. يواصل OpenClaw
امتلاك النقل، والمصادقة، والسلامة، والتسليم. تُوجّه رسائل المتابعة في تلك
المحادثة إلى الجلسة نفسها؛ يعيد `/new` و`/reset` ضبط
الجلسة في مكانها؛ ويزيل `/acp close` الربط.

أمثلة:

```text
/codex bind                                              # ربط Codex الأصلي، وتوجيه الرسائل المستقبلية هنا
/codex model gpt-5.4                                     # ضبط سلسلة Codex الأصلية المربوطة
/codex stop                                              # التحكم في دور Codex الأصلي النشط
/acp spawn codex --bind here                             # احتياطي ACP صريح لـ Codex
/acp spawn codex --thread auto                           # قد ينشئ سلسلة/موضوعًا فرعيًا ويربط هناك
/acp spawn codex --bind here --cwd /workspace/repo       # ربط الدردشة نفسه، ويعمل Codex في /workspace/repo
```

<AccordionGroup>
  <Accordion title="قواعد الربط والحصرية">
    - الخياران `--bind here` و`--thread ...` متنافيان.
    - يعمل `--bind here` فقط على القنوات التي تعلن دعم ربط المحادثة الحالية؛ وإلا يعيد OpenClaw رسالة واضحة بأن ذلك غير مدعوم. تستمر الروابط عبر عمليات إعادة تشغيل Gateway.
    - في Discord، تتحكم `spawnSessions` في إنشاء السلاسل الفرعية لـ `--thread auto|here` - وليس `--bind here`.
    - إذا أنشأت جلسة إلى وكيل ACP مختلف بدون `--cwd`، يرث OpenClaw مساحة عمل **الوكيل الهدف** افتراضيًا. المسارات الموروثة المفقودة (`ENOENT`/`ENOTDIR`) تعود إلى افتراضي backend؛ أما أخطاء الوصول الأخرى (مثل `EACCES`) فتظهر كأخطاء إنشاء.
    - تبقى أوامر إدارة Gateway محلية في المحادثات المربوطة - تتم معالجة أوامر `/acp ...` بواسطة OpenClaw حتى عندما يُوجّه نص المتابعة العادي إلى جلسة ACP المربوطة؛ كما يبقى `/status` و`/unfocus` محليين كلما كانت معالجة الأوامر مفعّلة لذلك السطح.

  </Accordion>
  <Accordion title="الجلسات المربوطة بسلسلة محادثات">
    عند تفعيل روابط السلاسل لمحوّل قناة:

    - يربط OpenClaw سلسلة محادثات بجلسة ACP هدف.
    - تُوجّه رسائل المتابعة في تلك السلسلة إلى جلسة ACP المربوطة.
    - يُسلّم خرج ACP مرة أخرى إلى السلسلة نفسها.
    - يزيل إلغاء التركيز/الإغلاق/الأرشفة/مهلة الخمول أو انتهاء الصلاحية بحسب الحد الأقصى للعمر الربط.
    - تُعد `/acp close`، و`/acp cancel`، و`/acp status`، و`/status`، و`/unfocus` أوامر Gateway، وليست مطالبات إلى حاضنة ACP.

    أعلام الميزات المطلوبة لـ ACP المربوط بسلسلة محادثات:

    - `acp.enabled=true`
    - يكون `acp.dispatch.enabled` مفعّلًا افتراضيًا (اضبطه على `false` لإيقاف إرسال سلاسل ACP التلقائي مؤقتًا؛ تظل استدعاءات `sessions_spawn({ runtime: "acp" })` الصريحة تعمل).
    - إنشاء جلسات السلاسل في محوّل القناة مفعّل (الافتراضي: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    يختلف دعم ربط السلاسل بحسب المحوّل. إذا كان محوّل القناة النشط
    لا يدعم روابط السلاسل، يعيد OpenClaw رسالة واضحة
    بأن ذلك غير مدعوم/غير متاح.

  </Accordion>
  <Accordion title="القنوات الداعمة للسلاسل">
    - أي محوّل قناة يكشف قدرة ربط الجلسات/السلاسل.
    - الدعم المضمّن الحالي: سلاسل/قنوات **Discord**، ومواضيع **Telegram** (مواضيع المنتدى في المجموعات/المجموعات الفائقة ومواضيع الرسائل المباشرة).
    - يمكن لقنوات Plugin إضافة الدعم عبر واجهة الربط نفسها.

  </Accordion>
</AccordionGroup>

## روابط القنوات الدائمة

بالنسبة إلى مسارات العمل غير المؤقتة، اضبط روابط ACP الدائمة في
إدخالات `bindings[]` ذات المستوى الأعلى.

### نموذج الربط

<ParamField path="bindings[].type" type='"acp"'>
  يحدد ربط محادثة ACP دائمًا.
</ParamField>
<ParamField path="bindings[].match" type="object">
  يحدد المحادثة الهدف. الأشكال بحسب القناة:

- **قناة/سلسلة Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **موضوع منتدى Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **رسائل BlueBubbles مباشرة/مجموعة:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. فضّل `chat_id:*` أو `chat_identifier:*` لروابط المجموعات المستقرة.
- **رسائل iMessage مباشرة/مجموعة:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. فضّل `chat_id:*` لروابط المجموعات المستقرة.

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
  دليل عمل اختياري لوقت التشغيل.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  تجاوز backend اختياري.
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

- يضمن OpenClaw وجود جلسة ACP المضبوطة قبل الاستخدام.
- تُوجّه الرسائل في تلك القناة أو الموضوع إلى جلسة ACP المضبوطة.
- في المحادثات المربوطة، يعيد `/new` و`/reset` ضبط مفتاح جلسة ACP نفسه في مكانه.
- تظل روابط وقت التشغيل المؤقتة (مثل التي تنشئها مسارات تركيز السلاسل) مطبقة حيثما وُجدت.
- بالنسبة إلى إنشاء جلسات ACP عبر الوكلاء بدون `cwd` صريح، يرث OpenClaw مساحة عمل الوكيل الهدف من إعداد الوكيل.
- تعود مسارات مساحة العمل الموروثة المفقودة إلى cwd الافتراضي في backend؛ أما إخفاقات الوصول غير المفقودة فتظهر كأخطاء إنشاء.

## بدء جلسات ACP

طريقتان لبدء جلسة ACP:

<Tabs>
  <Tab title="من sessions_spawn">
    استخدم `runtime: "acp"` لبدء جلسة ACP من دور وكيل أو
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
    `thread: true` للحفاظ على محادثة مرتبطة ومستمرة.
    </Note>

  </Tab>
  <Tab title="من أمر /acp">
    استخدم `/acp spawn` للتحكم الصريح للمشغّل من الدردشة.

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
  المطالبة الأولية المرسلة إلى جلسة ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  يجب أن تكون `"acp"` لجلسات ACP.
</ParamField>
<ParamField path="agentId" type="string">
  معرّف حزمة ACP المستهدفة. يعود إلى `acp.defaultAgent` إذا كان مضبوطًا.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  اطلب مسار ربط سلسلة المحادثة حيث يكون ذلك مدعومًا.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` تشغيل لمرة واحدة؛ و`"session"` مستمرة. إذا كان `thread: true` و
  حُذف `mode`، فقد يعتمد OpenClaw السلوك المستمر افتراضيًا حسب
  مسار وقت التشغيل. يتطلب `mode: "session"` القيمة `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  دليل العمل المطلوب لوقت التشغيل (تتحقق منه سياسة الخلفية/وقت التشغيل).
  إذا حُذف، يرث إنشاء ACP مساحة عمل الوكيل المستهدف
  عند تكوينها؛ وتعود المسارات الموروثة المفقودة إلى القيم الافتراضية
  للخلفية، بينما تُعاد أخطاء الوصول الحقيقية.
</ParamField>
<ParamField path="label" type="string">
  تسمية ظاهرة للمشغّل تُستخدم في نص الجلسة/الشعار.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  استأنف جلسة ACP موجودة بدلًا من إنشاء جلسة جديدة. يعيد
  الوكيل تشغيل سجل محادثته عبر `session/load`. يتطلب
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  تبث `"parent"` ملخصات تقدم تشغيل ACP الأولية مرة أخرى إلى
  جلسة الطالب كأحداث نظام. تشمل الاستجابات المقبولة
  `streamLogPath` الذي يشير إلى سجل JSONL scoped للجلسة
  (`<sessionId>.acp-stream.jsonl`) يمكنك متابعته للحصول على سجل الترحيل الكامل.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  يوقف دورة الطفل في ACP بعد N ثانية. تحافظ `0` على الدورة ضمن
  مسار Gateway بلا مهلة. تُطبّق القيمة نفسها على تشغيل Gateway
  ووقت تشغيل ACP بحيث لا تشغل حزم التشغيل المتوقفة/المستنفدة للحصة
  مسار الوكيل الأب إلى أجل غير مسمى.
</ParamField>
<ParamField path="model" type="string">
  تجاوز نموذج صريح لجلسة ACP الطفل. تعمل إنشاءات Codex ACP
  على تطبيع مراجع OpenClaw Codex مثل `openai-codex/gpt-5.4` إلى تكوين
  بدء Codex ACP قبل `session/new`؛ كما تضبط صيغ الشرطة المائلة مثل
  `openai-codex/gpt-5.4/high` جهد الاستدلال في Codex ACP.
  يجب أن تعلن الحزم الأخرى عن `models` في ACP وأن تدعم
  `session/set_model`؛ وإلا يفشل OpenClaw/acpx بوضوح بدلًا من
  الرجوع بصمت إلى القيمة الافتراضية للوكيل المستهدف.
</ParamField>
<ParamField path="thinking" type="string">
  جهد تفكير/استدلال صريح. بالنسبة إلى Codex ACP، تُطابق `minimal`
  الجهد المنخفض، وتُطابق `low`/`medium`/`high`/`xhigh` مباشرةً،
  وتحذف `off` تجاوز بدء جهد الاستدلال.
</ParamField>

## أوضاع ربط الإنشاء وسلاسل المحادثة

<Tabs>
  <Tab title="--bind here|off">
    | الوضع   | السلوك                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | اربط المحادثة النشطة الحالية في مكانها؛ افشل إذا لم توجد محادثة نشطة. |
    | `off`  | لا تنشئ ربطًا بالمحادثة الحالية.                          |

    ملاحظات:

    - `--bind here` هو أبسط مسار للمشغّل من أجل "اجعل هذه القناة أو الدردشة مدعومة بـ Codex."
    - لا ينشئ `--bind here` سلسلة محادثة فرعية.
    - لا يتوفر `--bind here` إلا على القنوات التي تعرض دعم ربط المحادثة الحالية.
    - لا يمكن الجمع بين `--bind` و`--thread` في استدعاء `/acp spawn` نفسه.

  </Tab>
  <Tab title="--thread auto|here|off">
    | الوضع   | السلوك                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | داخل سلسلة محادثة نشطة: اربط تلك السلسلة. خارج سلسلة محادثة: أنشئ/اربط سلسلة محادثة فرعية عند الدعم. |
    | `here` | اشترط وجود سلسلة محادثة نشطة حالية؛ افشل إذا لم تكن داخل واحدة.                                                  |
    | `off`  | لا يوجد ربط. تبدأ الجلسة غير مرتبطة.                                                                 |

    ملاحظات:

    - على أسطح الربط غير المعتمدة على سلاسل المحادثة، يكون السلوك الافتراضي فعليًا `off`.
    - يتطلب إنشاء الجلسة المرتبط بسلسلة محادثة دعمًا من سياسة القناة:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - استخدم `--bind here` عندما تريد تثبيت المحادثة الحالية دون إنشاء سلسلة محادثة فرعية.

  </Tab>
</Tabs>

## نموذج التسليم

يمكن أن تكون جلسات ACP مساحات عمل تفاعلية أو عملًا في الخلفية
مملوكًا للأب. يعتمد مسار التسليم على ذلك الشكل.

<AccordionGroup>
  <Accordion title="جلسات ACP التفاعلية">
    تهدف الجلسات التفاعلية إلى إبقاء الحديث على سطح دردشة مرئي:

    - يربط `/acp spawn ... --bind here` المحادثة الحالية بجلسة ACP.
    - يربط `/acp spawn ... --thread ...` سلسلة/موضوع قناة بجلسة ACP.
    - يوجه `bindings[].type="acp"` المستمر والمكوّن المحادثات المطابقة إلى جلسة ACP نفسها.

    تُوجَّه رسائل المتابعة في المحادثة المرتبطة مباشرةً إلى
    جلسة ACP، ويُعاد تسليم مخرجات ACP إلى
    القناة/السلسلة/الموضوع نفسه.

    ما يرسله OpenClaw إلى الحزمة:

    - تُرسل المتابعات المرتبطة العادية كنص مطالبة، مع المرفقات فقط عندما تدعمها الحزمة/الخلفية.
    - تُعترض أوامر إدارة `/acp` وأوامر Gateway المحلية قبل إرسال ACP.
    - تُجسّد أحداث الإكمال التي ينشئها وقت التشغيل لكل هدف. تحصل وكلاء OpenClaw على غلاف سياق وقت التشغيل الداخلي الخاص بـ OpenClaw؛ وتحصل حزم ACP الخارجية على مطالبة عادية تحتوي على نتيجة الطفل والتعليمة. يجب ألا يُرسل غلاف `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` الخام مطلقًا إلى الحزم الخارجية أو يُحفظ كنص سجل مستخدم في ACP.
    - تستخدم إدخالات سجل ACP نص التشغيل الظاهر للمستخدم أو مطالبة الإكمال العادية. تبقى بيانات تعريف الأحداث الداخلية منظمة في OpenClaw حيثما أمكن ولا تُعامل كمحتوى دردشة من إنشاء المستخدم.

  </Accordion>
  <Accordion title="جلسات ACP لمرة واحدة مملوكة للأب">
    جلسات ACP لمرة واحدة التي ينشئها تشغيل وكيل آخر هي أطفال
    في الخلفية، على غرار الوكلاء الفرعيين:

    - يطلب الأب العمل عبر `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - يعمل الطفل في جلسة حزمة ACP الخاصة به.
    - تعمل دورات الطفل على المسار الخلفي نفسه المستخدم لإنشاءات الوكلاء الفرعيين الأصلية، بحيث لا تمنع حزمة ACP البطيئة عمل الجلسة الرئيسية غير المرتبط.
    - تُعاد تقارير الإكمال عبر مسار إعلان إكمال المهمة. يحوّل OpenClaw بيانات تعريف الإكمال الداخلية إلى مطالبة ACP عادية قبل إرسالها إلى حزمة خارجية، بحيث لا ترى الحزم علامات سياق وقت التشغيل الخاصة بـ OpenClaw فقط.
    - يعيد الأب صياغة نتيجة الطفل بصوت المساعد العادي عندما يكون الرد الظاهر للمستخدم مفيدًا.

    لا **تعامل** هذا المسار كدردشة ندية بين الأب
    والطفل. لدى الطفل أصلًا قناة إكمال عائدة إلى
    الأب.

  </Accordion>
  <Accordion title="sessions_send وتسليم A2A">
    يمكن لـ `sessions_send` استهداف جلسة أخرى بعد الإنشاء. بالنسبة إلى
    جلسات الأقران العادية، يستخدم OpenClaw مسار متابعة من وكيل إلى وكيل (A2A)
    بعد حقن الرسالة:

    - انتظر رد الجلسة المستهدفة.
    - اسمح اختياريًا للطالب والهدف بتبادل عدد محدود من دورات المتابعة.
    - اطلب من الهدف إنتاج رسالة إعلان.
    - سلّم ذلك الإعلان إلى القناة أو سلسلة المحادثة المرئية.

    مسار A2A هذا هو رجوع احتياطي لإرسالات الأقران عندما يحتاج المرسل إلى
    متابعة مرئية. يبقى ممكّنًا عندما تستطيع جلسة غير مرتبطة
    رؤية هدف ACP ومراسلته، على سبيل المثال ضمن إعدادات
    `tools.sessions.visibility` الواسعة.

    يتخطى OpenClaw متابعة A2A فقط عندما يكون الطالب هو
    أب طفله ACP لمرة واحدة المملوك للأب. في تلك الحالة،
    يمكن أن يؤدي تشغيل A2A فوق إكمال المهمة إلى إيقاظ الأب بنتيجة
    الطفل، وتمرير رد الأب مرة أخرى إلى الطفل، وإنشاء
    حلقة صدى بين الأب/الطفل. تُبلغ نتيجة `sessions_send`
    عن `delivery.status="skipped"` في حالة الطفل المملوك تلك لأن
    مسار الإكمال مسؤول أصلًا عن النتيجة.

  </Accordion>
  <Accordion title="استئناف جلسة موجودة">
    استخدم `resumeSessionId` لمتابعة جلسة ACP سابقة بدلًا من
    البدء من جديد. يعيد الوكيل تشغيل سجل محادثته عبر
    `session/load`، لذلك يستأنف بكامل سياق ما سبق.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    حالات الاستخدام الشائعة:

    - سلّم جلسة Codex من حاسوبك المحمول إلى هاتفك - أخبر وكيلك أن يستأنف من حيث توقفت.
    - تابع جلسة برمجة بدأتها تفاعليًا في CLI، وأصبحت الآن بلا واجهة عبر وكيلك.
    - استأنف العمل الذي انقطع بسبب إعادة تشغيل Gateway أو مهلة الخمول.

    ملاحظات:

    - لا ينطبق `resumeSessionId` إلا عندما تكون `runtime: "acp"`؛ يتجاهل وقت تشغيل الوكيل الفرعي الافتراضي هذا الحقل الخاص بـ ACP فقط.
    - لا ينطبق `streamTo` إلا عندما تكون `runtime: "acp"`؛ يتجاهل وقت تشغيل الوكيل الفرعي الافتراضي هذا الحقل الخاص بـ ACP فقط.
    - `resumeSessionId` هو معرّف استئناف ACP/الحزمة محلي للمضيف، وليس مفتاح جلسة قناة OpenClaw؛ ما زال OpenClaw يتحقق من سياسة إنشاء ACP وسياسة الوكيل المستهدف قبل الإرسال، بينما تملك خلفية ACP أو الحزمة التفويض لتحميل ذلك المعرّف العلوي.
    - يستعيد `resumeSessionId` سجل محادثة ACP العلوي؛ وما زال `thread` و`mode` ينطبقان عادةً على جلسة OpenClaw الجديدة التي تنشئها، لذلك ما زال `mode: "session"` يتطلب `thread: true`.
    - يجب أن يدعم الوكيل المستهدف `session/load` (يدعمه Codex وClaude Code).
    - إذا لم يُعثر على معرّف الجلسة، يفشل الإنشاء بخطأ واضح - من دون رجوع صامت إلى جلسة جديدة.

  </Accordion>
  <Accordion title="اختبار سلامة بعد النشر">
    بعد نشر Gateway، شغّل فحصًا حيًا كاملًا من البداية إلى النهاية بدلًا من
    الثقة باختبارات الوحدة:

    1. تحقق من إصدار Gateway المنشور والالتزام على المضيف المستهدف.
    2. افتح جلسة جسر ACPX مؤقتة إلى وكيل حي.
    3. اطلب من ذلك الوكيل استدعاء `sessions_spawn` مع `runtime: "acp"`، و`agentId: "codex"`، و`mode: "run"`، والمهمة `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. تحقق من `accepted=yes`، ووجود `childSessionKey` حقيقي، وعدم وجود خطأ تحقق.
    5. نظّف جلسة الجسر المؤقتة.

    أبقِ البوابة على `mode: "run"` وتخطَّ `streamTo: "parent"` -
    فمسارات `mode: "session"` المرتبطة بسلسلة محادثة ومسارات ترحيل البث هي
    جولات تكامل أكثر ثراءً ومنفصلة.

  </Accordion>
</AccordionGroup>

## توافق Sandbox

تعمل جلسات ACP حاليًا على وقت تشغيل المضيف، **وليس** داخل
Sandbox الخاص بـ OpenClaw.

<Warning>
**حد الأمان:**

- يمكن لإطار التشغيل الخارجي القراءة/الكتابة وفقًا لأذونات CLI الخاصة به و`cwd` المحدد.
- لا تلتف سياسة العزل في OpenClaw حول تنفيذ إطار ACP.
- لا يزال OpenClaw يفرض بوابات ميزات ACP، والوكلاء المسموح بهم، وملكية الجلسات، وارتباطات القنوات، وسياسة تسليم Gateway.
- استخدم `runtime: "subagent"` للعمل الأصلي في OpenClaw الخاضع لفرض العزل.

</Warning>

القيود الحالية:

- إذا كانت جلسة مقدّم الطلب معزولة، فسيتم حظر إنشاءات ACP لكل من `sessions_spawn({ runtime: "acp" })` و`/acp spawn`.
- لا يدعم `sessions_spawn` مع `runtime: "acp"` الخيار `sandbox: "require"`.

## حل هدف الجلسة

تقبل معظم إجراءات `/acp` هدف جلسة اختياريًا (`session-key`،
`session-id`، أو `session-label`).

**ترتيب الحل:**

1. وسيطة الهدف الصريحة (أو `--session` لـ `/acp steer`)
   - يجرّب المفتاح
   - ثم معرّف جلسة على شكل UUID
   - ثم التسمية
2. ارتباط سلسلة المحادثة الحالية (إذا كانت هذه المحادثة/السلسلة مرتبطة بجلسة ACP).
3. الرجوع إلى جلسة مقدّم الطلب الحالية.

تشارك ارتباطات المحادثة الحالية وارتباطات السلسلة كلاهما في
الخطوة 2.

إذا لم يتم حل أي هدف، يعيد OpenClaw خطأ واضحًا
(`Unable to resolve session target: ...`).

## عناصر التحكم في ACP

| الأمر                | ما يفعله                                                  | مثال                                                         |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| `/acp spawn`         | إنشاء جلسة ACP؛ مع ربط حالي أو ربط سلسلة اختياري.        | `/acp spawn codex --bind here --cwd /repo`                   |
| `/acp cancel`        | إلغاء الدور الجاري لجلسة الهدف.                          | `/acp cancel agent:codex:acp:<uuid>`                         |
| `/acp steer`         | إرسال تعليمة توجيه إلى جلسة قيد التشغيل.                 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | إغلاق الجلسة وفك ارتباط أهداف السلسلة.                   | `/acp close`                                                 |
| `/acp status`        | عرض الخلفية، والوضع، والحالة، وخيارات وقت التشغيل، والقدرات. | `/acp status`                                             |
| `/acp set-mode`      | تعيين وضع وقت التشغيل لجلسة الهدف.                       | `/acp set-mode plan`                                         |
| `/acp set`           | كتابة خيار إعداد وقت تشغيل عام.                          | `/acp set model openai/gpt-5.4`                              |
| `/acp cwd`           | تعيين تجاوز دليل العمل لوقت التشغيل.                     | `/acp cwd /Users/user/Projects/repo`                         |
| `/acp permissions`   | تعيين ملف تعريف سياسة الموافقة.                          | `/acp permissions strict`                                    |
| `/acp timeout`       | تعيين مهلة وقت التشغيل (بالثواني).                       | `/acp timeout 120`                                           |
| `/acp model`         | تعيين تجاوز نموذج وقت التشغيل.                           | `/acp model anthropic/claude-opus-4-6`                       |
| `/acp reset-options` | إزالة تجاوزات خيارات وقت تشغيل الجلسة.                   | `/acp reset-options`                                         |
| `/acp sessions`      | سرد جلسات ACP الحديثة من المخزن.                         | `/acp sessions`                                              |
| `/acp doctor`        | صحة الخلفية، والقدرات، والإصلاحات القابلة للتنفيذ.       | `/acp doctor`                                                |
| `/acp install`       | طباعة خطوات التثبيت والتمكين الحتمية.                    | `/acp install`                                               |

يعرض `/acp status` خيارات وقت التشغيل الفعالة بالإضافة إلى معرّفات الجلسة على مستوى وقت التشغيل
وعلى مستوى الخلفية. تظهر أخطاء عناصر التحكم غير المدعومة
بوضوح عندما تفتقر الخلفية إلى قدرة. يقرأ `/acp sessions`
المخزن للجلسة المرتبطة الحالية أو جلسة مقدّم الطلب؛ ويتم حل رموز الهدف
(`session-key`، أو `session-id`، أو `session-label`) عبر
اكتشاف جلسات Gateway، بما في ذلك جذور `session.store`
المخصصة لكل وكيل.

### تعيين خيارات وقت التشغيل

يحتوي `/acp` على أوامر ملائمة ومُعيِّن عام. العمليات
المكافئة:

| الأمر                        | يطابق                               | ملاحظات                                                                                                                                                                      |
| ---------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | مفتاح إعداد وقت التشغيل `model`     | بالنسبة إلى Codex ACP، يطبّع OpenClaw ‏`openai-codex/<model>` إلى معرّف نموذج المحوّل، ويعيّن لواحق الاستدلال بشرطة مائلة مثل `openai-codex/gpt-5.4/high` إلى `reasoning_effort`. |
| `/acp set thinking <level>`  | مفتاح إعداد وقت التشغيل `thinking`  | بالنسبة إلى Codex ACP، يرسل OpenClaw قيمة `reasoning_effort` المقابلة حيث يدعم المحوّل ذلك.                                                                                  |
| `/acp permissions <profile>` | مفتاح إعداد وقت التشغيل `approval_policy` | -                                                                                                                                                                      |
| `/acp timeout <seconds>`     | مفتاح إعداد وقت التشغيل `timeout`   | -                                                                                                                                                                            |
| `/acp cwd <path>`            | تجاوز cwd لوقت التشغيل              | تحديث مباشر.                                                                                                                                                                |
| `/acp set <key> <value>`     | عام                                 | يستخدم `key=cwd` مسار تجاوز cwd.                                                                                                                                            |
| `/acp reset-options`         | يمسح كل تجاوزات وقت التشغيل         | -                                                                                                                                                                            |

## إطار acpx، وإعداد Plugin، والأذونات

لإعداد إطار acpx (الأسماء المستعارة لـ Claude Code / Codex / Gemini CLI)،
وجسور MCP الخاصة بأدوات Plugin وأدوات OpenClaw، وأوضاع أذونات ACP،
راجع
[وكلاء ACP - الإعداد](/ar/tools/acp-agents-setup).

## استكشاف الأخطاء وإصلاحها

| العرض                                                                     | السبب المرجح                                                                                                           | الإصلاح                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin الواجهة الخلفية مفقود أو معطل أو محظور بواسطة `plugins.allow`.                                                       | ثبّت Plugin الواجهة الخلفية وفعّله، وأدرج `acpx` في `plugins.allow` عند ضبط قائمة السماح تلك، ثم شغّل `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP معطّل عموميًا.                                                                                                 | اضبط `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | الإرسال التلقائي من رسائل السلاسل العادية معطّل.                                                               | اضبط `acp.dispatch.enabled=true` لاستئناف توجيه السلاسل التلقائي؛ ما زالت استدعاءات `sessions_spawn({ runtime: "acp" })` الصريحة تعمل.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | الوكيل غير موجود في قائمة السماح.                                                                                                | استخدم `agentId` مسموحًا به أو حدّث `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | Plugin الواجهة الخلفية مفقود أو معطّل أو محظور بسياسة السماح/الرفض، أو أن ملفه التنفيذي المضبوط غير متاح.        | ثبّت/فعّل Plugin الواجهة الخلفية، وأعد تشغيل `/acp doctor`، وافحص خطأ تثبيت الواجهة الخلفية أو السياسة إذا بقيت غير سليمة.                                           |
| Harness command not found                                                   | CLI المحوّل غير مثبّت، أو Plugin الخارجي مفقود، أو فشل جلب `npx` في التشغيل الأول لمحوّل غير Codex. | شغّل `/acp doctor`، وثبّت/حضّر المحوّل مسبقًا على مضيف Gateway، أو اضبط أمر وكيل acpx صراحة.                                                      |
| Model-not-found from the harness                                            | معرّف النموذج صالح لمزوّد/مشغّل آخر، لكنه ليس صالحًا لهدف ACP هذا.                                                | استخدم نموذجًا يدرجه ذلك المشغّل، أو اضبط النموذج في المشغّل، أو احذف التجاوز.                                                                            |
| Vendor auth error from the harness                                          | OpenClaw سليم، لكن CLI/المزوّد الهدف لم يسجّل الدخول.                                                     | سجّل الدخول أو وفّر مفتاح المزوّد المطلوب في بيئة مضيف Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | رمز مفتاح/معرّف/تسمية غير صالح.                                                                                                | شغّل `/acp sessions`، وانسخ المفتاح/التسمية بدقة، ثم أعد المحاولة.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | استُخدم `--bind here` من دون محادثة نشطة قابلة للربط.                                                            | انتقل إلى الدردشة/القناة الهدف وأعد المحاولة، أو استخدم إنشاءً غير مربوط.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | يفتقر المحوّل إلى إمكانية ربط ACP بالمحادثة الحالية.                                                             | استخدم `/acp spawn ... --thread ...` حيثما يكون مدعومًا، أو اضبط `bindings[]` على المستوى الأعلى، أو انتقل إلى قناة مدعومة.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | استُخدم `--thread here` خارج سياق سلسلة.                                                                         | انتقل إلى السلسلة الهدف أو استخدم `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | مستخدم آخر يملك هدف الربط النشط.                                                                           | أعد الربط بصفتك المالك أو استخدم محادثة أو سلسلة مختلفة.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | يفتقر المحوّل إلى إمكانية ربط السلاسل.                                                                               | استخدم `--thread off` أو انتقل إلى محوّل/قناة مدعومة.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | تشغيل ACP يتم من جهة المضيف؛ جلسة الطالب تعمل داخل صندوق عزل.                                                              | استخدم `runtime="subagent"` من الجلسات المعزولة، أو شغّل إنشاء ACP من جلسة غير معزولة.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | طُلب `sandbox="require"` لتشغيل ACP.                                                                         | استخدم `runtime="subagent"` للعزل المطلوب، أو استخدم ACP مع `sandbox="inherit"` من جلسة غير معزولة.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | المشغّل الهدف لا يعرّض تبديل نماذج ACP العام.                                                        | استخدم مشغّلًا يعلن عن ACP `models`/`session/set_model`، أو استخدم مراجع نماذج Codex ACP، أو اضبط النموذج مباشرة في المشغّل إذا كان لديه علم تشغيل خاص به. |
| Missing ACP metadata for bound session                                      | بيانات تعريف جلسة ACP قديمة/محذوفة.                                                                                    | أعد الإنشاء باستخدام `/acp spawn`، ثم أعد ربط/تركيز السلسلة.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | يمنع `permissionMode` الكتابة/التنفيذ في جلسة ACP غير تفاعلية.                                                    | اضبط `plugins.entries.acpx.config.permissionMode` على `approve-all` وأعد تشغيل Gateway. راجع [ضبط الأذونات](/ar/tools/acp-agents-setup#permission-configuration). |
| ACP session fails early with little output                                  | مطالبات الأذونات محظورة بواسطة `permissionMode`/`nonInteractivePermissions`.                                        | افحص سجلات Gateway بحثًا عن `AcpRuntimeError`. للأذونات الكاملة، اضبط `permissionMode=approve-all`؛ وللتدهور السلس، اضبط `nonInteractivePermissions=deny`.        |
| ACP session stalls indefinitely after completing work                       | اكتملت عملية المشغّل لكن جلسة ACP لم تبلّغ عن الاكتمال.                                                    | راقب باستخدام `ps aux \| grep acpx`؛ واقتل العمليات القديمة يدويًا.                                                                                                       |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | تسرّب غلاف الحدث الداخلي عبر حد ACP.                                                                | حدّث OpenClaw وأعد تشغيل مسار الإكمال؛ يجب أن تتلقى المشغّلات الخارجية مطالبات إكمال عادية فقط.                                                          |

## ذات صلة

- [إعداد وكلاء ACP](/ar/tools/acp-agents-setup)
- [إرسال الوكيل](/ar/tools/agent-send)
- [الواجهات الخلفية لـ CLI](/ar/gateway/cli-backends)
- [مشغّل Codex](/ar/plugins/codex-harness)
- [أدوات صندوق عزل الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (وضع الجسر)](/ar/cli/acp)
- [الوكلاء الفرعيون](/ar/tools/subagents)
