---
read_when:
    - تشغيل حاضنات البرمجة عبر ACP
    - إعداد جلسات ACP المرتبطة بالمحادثة على قنوات المراسلة
    - ربط محادثة قناة رسائل بجلسة ACP دائمة
    - استكشاف أخطاء واجهة ACP الخلفية أو توصيل Plugin أو تسليم الإكمال وإصلاحها
    - تشغيل أوامر /acp من الدردشة
sidebarTitle: ACP agents
summary: تشغيل حزم التطوير البرمجية الخارجية (Claude Code وCursor وGemini CLI وCodex ACP الصريح وOpenClaw ACP وOpenCode) عبر الواجهة الخلفية لـ ACP
title: وكلاء ACP
x-i18n:
    generated_at: "2026-06-30T14:07:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61edbc3b5a8303dc88e27a1315fe996da70eeee7aa211877d5680eb150e36cb
    source_path: tools/acp-agents.md
    workflow: 16
---

[جلسات Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
تتيح لـ OpenClaw تشغيل حِزَم ترميز خارجية (مثل Claude Code وCursor وCopilot وDroid وOpenClaw ACP وOpenCode وGemini CLI وغيرها من حِزَم ACPX المدعومة) عبر Plugin خلفية ACP.

يُتتبّع كل إنشاء لجلسة ACP بوصفه [مهمة خلفية](/ar/automation/tasks).

<Note>
**ACP هو مسار الحِزمة الخارجية، وليس مسار Codex الافتراضي.** يملك Plugin خادم التطبيق الأصلي لـ Codex عناصر تحكم `/codex ...` ووقت التشغيل المضمّن الافتراضي `openai/gpt-*` لدورات الوكيل؛ بينما يملك ACP عناصر تحكم `/acp ...` وجلسات `sessions_spawn({ runtime: "acp" })`.

إذا أردت أن يتصل Codex أو Claude Code كعميل MCP خارجي مباشرةً بمحادثات قنوات OpenClaw الحالية، فاستخدم [`openclaw mcp serve`](/ar/cli/mcp) بدلاً من ACP.
</Note>

## أي صفحة أريد؟

| تريد أن…                                                                                       | استخدم هذا                            | ملاحظات                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ربط Codex أو التحكم به في المحادثة الحالية                                                     | `/codex bind`, `/codex threads`       | مسار خادم التطبيق الأصلي لـ Codex عندما يكون Plugin `codex` مفعّلاً؛ يتضمن ردود الدردشة المرتبطة، وتمرير الصور، والنموذج/السريع/الأذونات، والإيقاف، وعناصر التحكم في التوجيه. ACP بديل صريح |
| تشغيل Claude Code أو Gemini CLI أو Codex ACP صريح أو حِزمة خارجية أخرى _عبر_ OpenClaw         | هذه الصفحة                            | جلسات مرتبطة بالدردشة، و`/acp spawn`، و`sessions_spawn({ runtime: "acp" })`، ومهام خلفية، وعناصر تحكم وقت التشغيل                                                                            |
| كشف جلسة OpenClaw Gateway _كخادم_ ACP لمحرر أو عميل                                            | [`openclaw acp`](/ar/cli/acp)            | وضع الجسر. يتحدث IDE/العميل ACP إلى OpenClaw عبر stdio/WebSocket                                                                                                                             |
| إعادة استخدام CLI ذكاء اصطناعي محلي كنموذج احتياطي نصي فقط                                    | [خلفيات CLI](/ar/gateway/cli-backends)   | ليس ACP. لا أدوات OpenClaw، ولا عناصر تحكم ACP، ولا وقت تشغيل للحِزمة                                                                                                                         |

## هل يعمل هذا مباشرةً؟

نعم، بعد تثبيت Plugin وقت تشغيل ACP الرسمي:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

يمكن لنسخ المصدر استخدام Plugin مساحة العمل المحلي `extensions/acpx` بعد
`pnpm install`. شغّل `/acp doctor` لإجراء فحص جاهزية.

لا يعلّم OpenClaw الوكلاء عن إنشاء ACP إلا عندما يكون ACP **قابلاً للاستخدام فعلاً**: يجب أن يكون ACP مفعّلاً، ويجب ألا يكون الإرسال معطلاً، ويجب ألا تكون الجلسة الحالية محظورة بصندوق الرمل، ويجب تحميل خلفية وقت تشغيل. إذا لم تتحقق هذه الشروط، تبقى Skills الخاصة بـ Plugin ACP وإرشادات ACP لـ `sessions_spawn` مخفية حتى لا يقترح الوكيل خلفية غير متاحة.

<AccordionGroup>
  <Accordion title="ملاحظات التشغيل الأول">
    - إذا كان `plugins.allow` مضبوطاً، فهو مخزون plugins تقييدي و**يجب** أن يتضمن `acpx`؛ وإلا فسيُحظر backend ACP المثبّت عمداً وسيبلغ `/acp doctor` عن إدخال قائمة السماح المفقود.
    - يُجهّز محوّل Codex ACP مع Plugin `acpx` ويُشغّل محلياً عندما يكون ذلك ممكناً.
    - يعمل Codex ACP باستخدام `CODEX_HOME` معزول؛ ينسخ OpenClaw إدخالات المشاريع الموثوقة إضافةً إلى إعدادات آمنة لتوجيه النموذج/المزوّد من إعدادات Codex على المضيف، بينما تبقى المصادقة والإشعارات والخطافات على إعدادات المضيف.
    - قد يستمر جلب محوّلات الحِزَم المستهدفة الأخرى عند الطلب باستخدام `npx` في أول مرة تستخدمها.
    - يجب أن تكون مصادقة المورّد موجودة على المضيف لتلك الحِزمة.
    - إذا لم يكن لدى المضيف npm أو وصول إلى الشبكة، تفشل عمليات جلب المحوّل عند التشغيل الأول إلى أن تُمهّد الذاكرات المؤقتة مسبقاً أو يُثبّت المحوّل بطريقة أخرى.

  </Accordion>
  <Accordion title="متطلبات وقت التشغيل">
    يطلق ACP عملية حِزمة خارجية حقيقية. يملك OpenClaw التوجيه، وحالة المهام الخلفية، والتسليم، والارتباطات، والسياسة؛ بينما تملك الحِزمة تسجيل دخول المزوّد، وكتالوج النماذج، وسلوك نظام الملفات، والأدوات الأصلية.

    قبل لوم OpenClaw، تحقق مما يلي:

    - يبلغ `/acp doctor` عن backend مفعّل وسليم.
    - معرّف الهدف مسموح به عبر `acp.allowedAgents` عندما تكون قائمة السماح هذه مضبوطة.
    - يمكن لأمر الحِزمة البدء على مضيف Gateway.
    - مصادقة المزوّد موجودة لتلك الحِزمة (`claude`, `codex`, `gemini`, `opencode`, `droid`, وغيرها).
    - النموذج المحدد موجود لتلك الحِزمة - معرّفات النماذج غير قابلة للنقل بين الحِزَم.
    - المسار `cwd` المطلوب موجود ويمكن الوصول إليه، أو احذف `cwd` ودع backend يستخدم الافتراضي الخاص به.
    - وضع الأذونات يطابق العمل. لا تستطيع الجلسات غير التفاعلية النقر على مطالبات الأذونات الأصلية، لذا تحتاج عمليات الترميز الكثيفة في الكتابة/التنفيذ عادةً إلى ملف تعريف أذونات ACPX يمكنه المتابعة دون واجهة.

  </Accordion>
</AccordionGroup>

لا تُكشف أدوات OpenClaw Plugin وأدوات OpenClaw المدمجة لحِزَم ACP افتراضياً. فعّل جسور MCP الصريحة في [إعداد وكلاء ACP](/ar/tools/acp-agents-setup) فقط عندما ينبغي للحِزمة استدعاء تلك الأدوات مباشرةً.

## أهداف الحِزَم المدعومة

مع backend `acpx`، استخدم معرّفات الحِزَم هذه كأهداف `/acp spawn <id>`
أو `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| معرّف الحِزمة | backend المعتاد                              | ملاحظات                                                                            |
| ------------- | -------------------------------------------- | ---------------------------------------------------------------------------------- |
| `claude`      | محوّل Claude Code ACP                        | يتطلب مصادقة Claude Code على المضيف.                                               |
| `codex`       | محوّل Codex ACP                              | بديل ACP صريح فقط عندما يكون `/codex` الأصلي غير متاح أو عندما يُطلب ACP.         |
| `copilot`     | محوّل GitHub Copilot ACP                     | يتطلب مصادقة Copilot CLI/وقت التشغيل.                                              |
| `cursor`      | Cursor CLI ACP (`cursor-agent acp`)          | تجاوز أمر acpx إذا كان التثبيت المحلي يكشف نقطة دخول ACP مختلفة.                  |
| `droid`       | Factory Droid CLI                            | يتطلب مصادقة Factory/Droid أو `FACTORY_API_KEY` في بيئة الحِزمة.                  |
| `gemini`      | محوّل Gemini CLI ACP                         | يتطلب مصادقة Gemini CLI أو إعداد مفتاح API.                                        |
| `iflow`       | iFlow CLI                                    | يعتمد توفر المحوّل والتحكم في النموذج على CLI المثبّت.                             |
| `kilocode`    | Kilo Code CLI                                | يعتمد توفر المحوّل والتحكم في النموذج على CLI المثبّت.                             |
| `kimi`        | Kimi/Moonshot CLI                            | يتطلب مصادقة Kimi/Moonshot على المضيف.                                             |
| `kiro`        | Kiro CLI                                     | يعتمد توفر المحوّل والتحكم في النموذج على CLI المثبّت.                             |
| `opencode`    | محوّل OpenCode ACP                           | يتطلب مصادقة OpenCode CLI/المزوّد.                                                 |
| `openclaw`    | جسر OpenClaw Gateway عبر `openclaw acp`      | يتيح لحِزمة واعية بـ ACP التحدث مرة أخرى إلى جلسة OpenClaw Gateway.                |
| `qwen`        | Qwen Code / Qwen CLI                         | يتطلب مصادقة متوافقة مع Qwen على المضيف.                                           |

يمكن تكوين ألقاب وكلاء acpx مخصصة في acpx نفسه، لكن سياسة OpenClaw لا تزال تتحقق من `acp.allowedAgents` وأي ربط `agents.list[].runtime.acp.agent` قبل الإرسال.

## دليل تشغيل المشغّل

تدفق `/acp` سريع من الدردشة:

<Steps>
  <Step title="الإنشاء">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`، أو
    `/acp spawn codex --bind here` صريح.
  </Step>
  <Step title="العمل">
    تابع في المحادثة أو السلسلة المرتبطة (أو استهدف مفتاح الجلسة صراحةً).
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
    `/acp cancel` (الدورة الحالية) أو `/acp close` (الجلسة + الارتباطات).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="تفاصيل دورة الحياة">
    - ينشئ Spawn جلسة وقت تشغيل ACP أو يستأنفها، ويسجل بيانات ACP الوصفية في مخزن جلسات OpenClaw، وقد ينشئ مهمة خلفية عندما يكون التشغيل مملوكاً للأصل.
    - تُعامل جلسات ACP المملوكة للأصل كعمل خلفي حتى عندما تكون جلسة وقت التشغيل مستمرة؛ يمر الإكمال والتسليم عبر الأسطح من خلال مُخطِر المهمة الأصلية بدلاً من التصرف كجلسة دردشة عادية موجهة للمستخدم.
    - تغلق صيانة المهام جلسات ACP ذات اللقطة الواحدة الطرفية أو اليتيمة المملوكة للأصل. تُحفظ جلسات ACP المستمرة ما دام هناك ارتباط محادثة نشط؛ وتُغلق الجلسات المستمرة القديمة التي لا تملك ارتباطاً نشطاً حتى لا يمكن استئنافها بصمت بعد انتهاء المهمة المالكة أو زوال سجل مهمتها.
    - تذهب رسائل المتابعة المرتبطة مباشرةً إلى جلسة ACP إلى أن يُغلق الارتباط أو يُزال تركيزه أو يُعاد ضبطه أو تنتهي صلاحيته.
    - تبقى أوامر Gateway محلية. لا تُرسل `/acp ...` و`/status` و`/unfocus` أبداً كنص مطالبة عادي إلى حِزمة ACP مرتبطة.
    - يجهض `cancel` الدورة النشطة عندما يدعم backend الإلغاء؛ ولا يحذف الارتباط أو بيانات الجلسة الوصفية.
    - ينهي `close` جلسة ACP من وجهة نظر OpenClaw ويزيل الارتباط. قد تستمر الحِزمة في الاحتفاظ بسجلها upstream الخاص إذا كانت تدعم الاستئناف.
    - ينظّف Plugin acpx أشجار عمليات الغلاف والمحوّل المملوكة لـ OpenClaw بعد `close`، ويحصد أيتام ACPX القدماء المملوكين لـ OpenClaw أثناء بدء Gateway.
    - عمال وقت التشغيل الخاملون مؤهلون للتنظيف بعد `acp.runtime.ttlMinutes`؛ وتبقى بيانات الجلسة الوصفية المخزنة متاحة لـ `/acp sessions`.

  </Accordion>
  <Accordion title="قواعد توجيه Codex الأصلية">
    محفزات اللغة الطبيعية التي ينبغي توجيهها إلى **Plugin Codex الأصلي** عندما يكون مفعّلاً:

    - "اربط قناة Discord هذه بـ Codex."
    - "أرفق هذه الدردشة بسلسلة Codex `<id>`."
    - "اعرض سلاسل Codex، ثم اربط هذه."

    ربط محادثة Codex الأصلي هو مسار التحكم في الدردشة الافتراضي.
    لا تزال أدوات OpenClaw الديناميكية تُنفَّذ عبر OpenClaw، بينما
    تُنفَّذ أدوات Codex الأصلية مثل shell/apply-patch داخل Codex.
    بالنسبة إلى أحداث أدوات Codex الأصلية، يحقن OpenClaw مرحّل hook أصلي
    لكل دورة حتى تتمكن hooks الخاصة بالـ plugins من حظر `before_tool_call`، ومراقبة
    `after_tool_call`، وتوجيه أحداث Codex `PermissionRequest`
    عبر موافقات OpenClaw. تُرحَّل hooks الخاصة بـ Codex `Stop` إلى
    OpenClaw `before_agent_finalize`، حيث يمكن للـ plugins طلب مرور نموذج إضافي
    قبل أن ينهي Codex إجابته. يبقى المرحّل محافظًا عمدًا:
    فهو لا يغيّر وسيطات أدوات Codex الأصلية
    ولا يعيد كتابة سجلات سلاسل Codex. استخدم ACP الصريح فقط
    عندما تريد نموذج وقت تشغيل/جلسة ACP. حُدِّد حد دعم Codex
    المضمّن في
    [عقد دعم Codex harness v1](/ar/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="ورقة مختصرة لاختيار النموذج / المزوّد / وقت التشغيل">
    - مراجع نماذج Codex القديمة - مسار نموذج OAuth/الاشتراك القديم الخاص بـ Codex الذي يصلحه doctor.
    - `openai/*` - وقت تشغيل خادم تطبيق Codex الأصلي المضمّن لدورات وكيل OpenAI.
    - `/codex ...` - التحكم الأصلي في محادثة Codex.
    - `/acp ...` أو `runtime: "acp"` - تحكم ACP/acpx صريح.

  </Accordion>
  <Accordion title="مشغلات اللغة الطبيعية لتوجيه ACP">
    المشغلات التي يجب أن تُوجَّه إلى وقت تشغيل ACP:

    - "شغّل هذا كجلسة Claude Code ACP لمرة واحدة ولخّص النتيجة."
    - "استخدم Gemini CLI لهذه المهمة في سلسلة، ثم أبقِ المتابعات في السلسلة نفسها."
    - "شغّل Codex عبر ACP في سلسلة خلفية."

    يختار OpenClaw `runtime: "acp"`، ويحل harness `agentId`،
    ويرتبط بالمحادثة أو السلسلة الحالية عندما يكون ذلك مدعومًا، ثم
    يوجّه المتابعات إلى تلك الجلسة حتى الإغلاق/انتهاء الصلاحية. لا يتبع Codex
    هذا المسار إلا عندما يكون ACP/acpx صريحًا أو عندما لا يكون Plugin Codex
    الأصلي متاحًا للعملية المطلوبة.

    بالنسبة إلى `sessions_spawn`، لا يُعلَن عن `runtime: "acp"` إلا عندما يكون ACP
    مفعّلًا، ولا يكون الطالب داخل sandbox، وتكون خلفية وقت تشغيل ACP
    محمّلة. يوقف `acp.dispatch.enabled=false` الإرسال التلقائي
    لسلاسل ACP لكنه لا يخفي أو يحظر استدعاءات
    `sessions_spawn({ runtime: "acp" })` الصريحة. يستهدف معرّفات ACP harness مثل `codex`،
    أو `claude`، أو `droid`، أو `gemini`، أو `opencode`. لا تمرّر معرّف وكيل
    إعداد OpenClaw عاديًا من `agents_list` إلا إذا كان ذلك الإدخال
    مكوّنًا صراحةً باستخدام `agents.list[].runtime.type="acp"`؛
    وإلا فاستخدم وقت تشغيل الوكيل الفرعي الافتراضي. عندما يكون وكيل OpenClaw
    مكوّنًا باستخدام `runtime.type="acp"`، يستخدم OpenClaw
    `runtime.acp.agent` كمعرّف harness الأساسي.

  </Accordion>
</AccordionGroup>

## ACP مقابل الوكلاء الفرعيين

استخدم ACP عندما تريد وقت تشغيل harness خارجيًا. استخدم **خادم تطبيق Codex
الأصلي** لربط/التحكم في محادثات Codex عندما يكون Plugin `codex`
مفعّلًا. استخدم **الوكلاء الفرعيين** عندما تريد تشغيلات مفوّضة
أصلية من OpenClaw.

| المجال          | جلسة ACP                           | تشغيل وكيل فرعي                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| وقت التشغيل       | Plugin خلفية ACP (مثل acpx) | وقت تشغيل الوكيل الفرعي الأصلي في OpenClaw  |
| مفتاح الجلسة   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| الأوامر الرئيسية | `/acp ...`                            | `/subagents ...`                   |
| أداة الإنشاء    | `sessions_spawn` مع `runtime:"acp"` | `sessions_spawn` (وقت التشغيل الافتراضي) |

راجع أيضًا [الوكلاء الفرعيون](/ar/tools/subagents).

## كيف يشغّل ACP ‏Claude Code

بالنسبة إلى Claude Code عبر ACP، تكون الحزمة:

1. مستوى التحكم في جلسة OpenClaw ACP.
2. Plugin وقت التشغيل الرسمي `@openclaw/acpx`.
3. محوّل Claude ACP.
4. آليات وقت التشغيل/الجلسة من جهة Claude.

ACP Claude هو **جلسة harness** مع عناصر تحكم ACP، واستئناف الجلسة،
وتتبع المهام الخلفية، وربط اختياري للمحادثة/السلسلة.

خلفيات CLI هي أوقات تشغيل احتياطية محلية نصية فقط ومنفصلة - راجع
[خلفيات CLI](/ar/gateway/cli-backends).

بالنسبة إلى المشغّلين، القاعدة العملية هي:

- **تريد `/acp spawn`، أو جلسات قابلة للربط، أو عناصر تحكم وقت التشغيل، أو عمل harness مستمرًا؟** استخدم ACP.
- **تريد بديلًا نصيًا محليًا بسيطًا عبر CLI الخام؟** استخدم خلفيات CLI.

## الجلسات المربوطة

### النموذج الذهني

- **سطح الدردشة** - المكان الذي يواصل فيه الأشخاص الحديث (قناة Discord، موضوع Telegram، دردشة iMessage).
- **جلسة ACP** - حالة وقت تشغيل Codex/Claude/Gemini الدائمة التي يوجّه OpenClaw إليها.
- **السلسلة/الموضوع الفرعي** - سطح مراسلة إضافي اختياري يُنشأ فقط بواسطة `--thread ...`.
- **مساحة عمل وقت التشغيل** - موقع نظام الملفات (`cwd`، أو checkout للمستودع، أو مساحة عمل الخلفية) حيث يعمل harness. مستقل عن سطح الدردشة.

### ربط المحادثة الحالية

يثبّت `/acp spawn <harness> --bind here` المحادثة الحالية على
جلسة ACP المنشأة - بلا سلسلة فرعية، وبسطح الدردشة نفسه. يظل OpenClaw
مالكًا للنقل، والمصادقة، والسلامة، والتسليم. تُوجَّه رسائل المتابعة في تلك
المحادثة إلى الجلسة نفسها؛ يعيد `/new` و`/reset` ضبط
الجلسة في مكانها؛ ويزيل `/acp close` الربط.

أمثلة:

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="قواعد الربط والحصرية">
    - `--bind here` و`--thread ...` متنافيان.
    - لا يعمل `--bind here` إلا على القنوات التي تعلن دعم ربط المحادثة الحالية؛ وإلا يُرجع OpenClaw رسالة واضحة تفيد بعدم الدعم. تستمر الارتباطات عبر عمليات إعادة تشغيل Gateway.
    - على Discord، يتحكم `spawnSessions` في إنشاء السلاسل الفرعية لـ `--thread auto|here` - وليس `--bind here`.
    - إذا أنشأت جلسة إلى وكيل ACP مختلف دون `--cwd`، يرث OpenClaw مساحة عمل **الوكيل الهدف** افتراضيًا. المسارات الموروثة المفقودة (`ENOENT`/`ENOTDIR`) تعود إلى الإعداد الافتراضي للخلفية؛ وتظهر أخطاء الوصول الأخرى (مثل `EACCES`) كأخطاء إنشاء.
    - تبقى أوامر إدارة Gateway محلية في المحادثات المربوطة - تتولى OpenClaw أوامر `/acp ...` حتى عندما يُوجَّه نص المتابعة العادي إلى جلسة ACP المربوطة؛ كما يبقى `/status` و`/unfocus` محليين كلما كان التعامل مع الأوامر مفعّلًا لذلك السطح.

  </Accordion>
  <Accordion title="الجلسات المربوطة بالسلاسل">
    عندما تكون ارتباطات السلاسل مفعّلة لمحوّل قناة:

    - يربط OpenClaw سلسلة بجلسة ACP مستهدفة.
    - تُوجَّه رسائل المتابعة في تلك السلسلة إلى جلسة ACP المربوطة.
    - يُسلَّم خرج ACP إلى السلسلة نفسها.
    - يؤدي إلغاء التركيز/الإغلاق/الأرشفة/مهلة الخمول أو انتهاء الحد الأقصى للعمر إلى إزالة الربط.
    - `/acp close`، و`/acp cancel`، و`/acp status`، و`/status`، و`/unfocus` هي أوامر Gateway، وليست مطالبات إلى ACP harness.

    علامات الميزات المطلوبة لـ ACP المربوط بالسلاسل:

    - `acp.enabled=true`
    - يكون `acp.dispatch.enabled` مفعّلًا افتراضيًا (عيّن `false` لإيقاف إرسال سلاسل ACP التلقائي مؤقتًا؛ وتظل استدعاءات `sessions_spawn({ runtime: "acp" })` الصريحة تعمل).
    - إنشاء جلسات سلاسل محوّل القناة مفعّل (افتراضيًا: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    دعم ربط السلاسل خاص بالمحوّل. إذا لم يكن محوّل القناة النشط
    يدعم ارتباطات السلاسل، يُرجع OpenClaw رسالة واضحة
    تفيد بأن ذلك غير مدعوم/غير متاح.

  </Accordion>
  <Accordion title="القنوات التي تدعم السلاسل">
    - أي محوّل قناة يوفّر قدرة ربط الجلسات/السلاسل.
    - الدعم المضمّن الحالي: سلاسل/قنوات **Discord**، وموضوعات **Telegram** (موضوعات المنتدى في المجموعات/المجموعات الفائقة وموضوعات الرسائل المباشرة).
    - يمكن لقنوات Plugin إضافة الدعم عبر واجهة الربط نفسها.

  </Accordion>
</AccordionGroup>

## ارتباطات القنوات الدائمة

للمهام غير المؤقتة، كوّن ارتباطات ACP الدائمة في
إدخالات `bindings[]` ذات المستوى الأعلى.

### نموذج الربط

<ParamField path="bindings[].type" type='"acp"'>
  يحدد ربط محادثة ACP دائمًا.
</ParamField>
<ParamField path="bindings[].match" type="object">
  يحدد المحادثة الهدف. الأشكال حسب القناة:

- **قناة/سلسلة Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **قناة/رسالة مباشرة Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. فضّل معرّفات Slack الثابتة؛ كما تطابق ارتباطات القنوات الردود داخل سلاسل تلك القناة.
- **موضوع منتدى Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **رسالة مباشرة/مجموعة WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. استخدم أرقام E.164 مثل `+15555550123` للدردشات المباشرة وWhatsApp group JIDs مثل `120363424282127706@g.us` للمجموعات.
- **رسالة مباشرة/مجموعة iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. فضّل `chat_id:*` لارتباطات المجموعات الثابتة.

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
  دليل عمل اختياري لوقت التشغيل.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  تجاوز خلفية اختياري.
</ParamField>

### الإعدادات الافتراضية لوقت التشغيل لكل وكيل

استخدم `agents.list[].runtime` لتعريف إعدادات ACP الافتراضية مرة واحدة لكل وكيل:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (معرّف harness، مثل `codex` أو `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**أسبقية التجاوز لجلسات ACP المربوطة:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. إعدادات ACP العامة الافتراضية (مثل `acp.backend`)

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

- يضمن OpenClaw وجود جلسة ACP المكوّنة بعد القبول الخاص بالقناة وقبل الاستخدام.
- تُوجَّه الرسائل في تلك القناة أو الموضوع أو المحادثة إلى جلسة ACP المكوّنة.
- تملك ارتباطات ACP المكوّنة مسار جلستها. ولا يستبدل التوزيع المتشعب لبث القناة جلسة ACP المكوّنة لارتباط مطابق.
- في المحادثات المرتبطة، يعيد `/new` و`/reset` تعيين مفتاح جلسة ACP نفسه في مكانه.
- تظل ارتباطات وقت التشغيل المؤقتة، مثل تلك التي تنشئها تدفقات التركيز على السلاسل، مطبقة حيثما وُجدت.
- عند إنشاء ACP عابر للوكلاء من دون `cwd` صريح، يرث OpenClaw مساحة عمل الوكيل الهدف من إعدادات الوكيل.
- تعود مسارات مساحة العمل الموروثة المفقودة إلى cwd الافتراضي للخلفية؛ وتظهر إخفاقات الوصول غير المفقودة كأخطاء إنشاء.

## بدء جلسات ACP

طريقتان لبدء جلسة ACP:

<Tabs>
  <Tab title="From sessions_spawn">
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
    تكون القيمة الافتراضية لـ `runtime` هي `subagent`، لذا اضبط `runtime: "acp"` صراحةً
    لجلسات ACP. إذا حُذف `agentId`، يستخدم OpenClaw
    `acp.defaultAgent` عند تهيئته. يتطلب `mode: "session"`
    `thread: true` للحفاظ على محادثة مرتبطة ومستمرة.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    استخدم `/acp spawn` للتحكم الصريح من المشغّل عبر المحادثة.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    الخيارات الأساسية:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Tab>
</Tabs>

### معلمات `sessions_spawn`

<ParamField path="task" type="string" required>
  الموجّه الأولي المرسل إلى جلسة ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  يجب أن تكون `"acp"` لجلسات ACP.
</ParamField>
<ParamField path="agentId" type="string">
  معرّف إطار تشغيل ACP الهدف. يعود إلى `acp.defaultAgent` إذا كان مضبوطًا.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  اطلب تدفق ارتباط بالسلسلة حيث يكون ذلك مدعومًا.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` تشغيل لمرة واحدة؛ و`"session"` مستمرة. إذا كان `thread: true` و
  حُذف `mode`، فقد يختار OpenClaw افتراضيًا السلوك المستمر بحسب
  مسار وقت التشغيل. يتطلب `mode: "session"` وجود `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  دليل العمل المطلوب لوقت التشغيل، ويُتحقق منه وفق سياسة الخلفية/وقت التشغيل.
  إذا حُذف، يرث إنشاء ACP مساحة عمل الوكيل الهدف
  عند تهيئتها؛ وتعود المسارات الموروثة المفقودة إلى الإعدادات الافتراضية
  للخلفية، بينما تُعاد أخطاء الوصول الحقيقية.
</ParamField>
<ParamField path="label" type="string">
  تسمية موجهة للمشغّل تُستخدم في نص الجلسة/الشعار.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  استأنف جلسة ACP موجودة بدلًا من إنشاء جلسة جديدة. يعيد
  الوكيل تشغيل سجل محادثته عبر `session/load`. يتطلب
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  يبث `"parent"` ملخصات تقدم تشغيل ACP الأولية إلى
  جلسة الطالب كأحداث نظام. تتضمن الاستجابات المقبولة
  `streamLogPath` الذي يشير إلى سجل JSONL مقيّد بالجلسة
  (`<sessionId>.acp-stream.jsonl`) يمكنك تتبعه للاطلاع على سجل الترحيل الكامل.
  تعرض تدفقات تقدم الأصل تعليقات المساعد وتقدم حالة ACP
  افتراضيًا ما لم يكن `streaming.progress.commentary=false`. كما يضبط Discord افتراضيًا
  معاينات الأصل على وضع التقدم عندما لا يكون وضع البث مكوّنًا. لا يزال
  تقدم الحالة يلتزم بـ `acp.stream.tagVisibility`، لذلك تبقى وسوم مثل `plan`
  مخفية ما لم تُفعّل صراحةً.
</ParamField>

تستخدم عمليات تشغيل ACP عبر `sessions_spawn` القيمة `agents.defaults.subagents.runTimeoutSeconds`
كحد افتراضي لدور الطفل. لا تقبل الأداة تجاوزات المهلة
لكل استدعاء.

<ParamField path="model" type="string">
  تجاوز صريح للنموذج لجلسة ACP الطفل. تعمل عمليات إنشاء Codex ACP
  على تطبيع مراجع OpenAI مثل `openai/gpt-5.4` إلى إعدادات بدء
  Codex ACP قبل `session/new`؛ كما تضبط صيغ الشرطة المائلة مثل `openai/gpt-5.4/high`
  جهد الاستدلال في Codex ACP.
  عند الحذف، يستخدم `sessions_spawn({ runtime: "acp" })` الإعدادات الافتراضية
  الحالية لنموذج الوكيل الفرعي (`agents.defaults.subagents.model` أو
  `agents.list[].subagents.model`) عند تهيئتها؛ وإلا يترك
  إطار تشغيل ACP يستخدم نموذجه الافتراضي.
  يجب على أطر التشغيل الأخرى الإعلان عن ACP `models` ودعم
  `session/set_model`؛ وإلا يفشل OpenClaw/acpx بوضوح بدلًا من
  العودة بصمت إلى القيمة الافتراضية للوكيل الهدف.
</ParamField>
<ParamField path="thinking" type="string">
  جهد تفكير/استدلال صريح. بالنسبة إلى Codex ACP، تُربط `minimal` بجهد
  منخفض، وتُربط `low`/`medium`/`high`/`xhigh` مباشرةً، بينما يحذف `off`
  تجاوز بدء جهد الاستدلال.
  عند الحذف، تستخدم عمليات إنشاء ACP الإعدادات الافتراضية الحالية لتفكير الوكيل الفرعي و
  `agents.defaults.models["provider/model"].params.thinking`
  الخاصة بكل نموذج للنموذج المحدد.
</ParamField>

## أوضاع ارتباط الإنشاء والسلاسل

<Tabs>
  <Tab title="--bind here|off">
    | الوضع   | السلوك                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | اربط المحادثة النشطة الحالية في مكانها؛ وافشل إذا لم تكن هناك محادثة نشطة. |
    | `off`  | لا تنشئ ارتباطًا بالمحادثة الحالية.                          |

    ملاحظات:

    - `--bind here` هو أبسط مسار للمشغّل من أجل "جعل هذه القناة أو المحادثة مدعومة من Codex."
    - لا ينشئ `--bind here` سلسلة فرعية.
    - لا يتوفر `--bind here` إلا على القنوات التي تكشف دعم ارتباط المحادثة الحالية.
    - لا يمكن الجمع بين `--bind` و`--thread` في استدعاء `/acp spawn` نفسه.

  </Tab>
  <Tab title="--thread auto|here|off">
    | الوضع   | السلوك                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | داخل سلسلة نشطة: اربط تلك السلسلة. خارج سلسلة: أنشئ/اربط سلسلة فرعية عند الدعم. |
    | `here` | اشترط وجود سلسلة نشطة حالية؛ وافشل إذا لم تكن داخل واحدة.                                                  |
    | `off`  | لا يوجد ارتباط. تبدأ الجلسة بلا ارتباط.                                                                 |

    ملاحظات:

    - على أسطح الارتباط التي لا تستخدم السلاسل، يكون السلوك الافتراضي فعليًا `off`.
    - يتطلب الإنشاء المرتبط بسلسلة دعم سياسة القناة:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - استخدم `--bind here` عندما تريد تثبيت المحادثة الحالية من دون إنشاء سلسلة فرعية.

  </Tab>
</Tabs>

## نموذج التسليم

يمكن أن تكون جلسات ACP إما مساحات عمل تفاعلية أو عملًا خلفيًا
مملوكًا للأصل. يعتمد مسار التسليم على ذلك الشكل.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    تهدف الجلسات التفاعلية إلى إبقاء الحديث على سطح محادثة
    مرئي:

    - يربط `/acp spawn ... --bind here` المحادثة الحالية بجلسة ACP.
    - يربط `/acp spawn ... --thread ...` سلسلة/موضوع قناة بجلسة ACP.
    - توجّه `bindings[].type="acp"` المستمرة والمكوّنة المحادثات المطابقة إلى جلسة ACP نفسها.

    تُوجَّه رسائل المتابعة في المحادثة المرتبطة مباشرةً إلى
    جلسة ACP، ويُسلَّم خرج ACP مرة أخرى إلى
    القناة/السلسلة/الموضوع نفسه.

    ما يرسله OpenClaw إلى إطار التشغيل:

    - تُرسل المتابعات المرتبطة العادية كنص موجّه، مع المرفقات فقط عندما يدعمها إطار التشغيل/الخلفية.
    - تُعترض أوامر إدارة `/acp` وأوامر Gateway المحلية قبل إرسال ACP.
    - تُجسَّد أحداث الإكمال التي يولدها وقت التشغيل لكل هدف. تحصل وكلاء OpenClaw على غلاف سياق وقت التشغيل الداخلي الخاص بـ OpenClaw؛ وتحصل أطر تشغيل ACP الخارجية على موجّه عادي يتضمن نتيجة الطفل والتعليمة. يجب ألا يُرسل غلاف `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` الخام إلى أطر التشغيل الخارجية أو يُحفظ كنص نسخة محادثة لمستخدم ACP.
    - تستخدم إدخالات نسخة ACP النص المرئي للمستخدم الذي شغّلها أو موجّه الإكمال العادي. تبقى بيانات التعريف الداخلية للأحداث منظمة في OpenClaw حيثما أمكن ولا تُعامل كمحتوى محادثة كتبه المستخدم.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    جلسات ACP لمرة واحدة التي ينشئها تشغيل وكيل آخر هي أطفال خلفيون،
    شبيهة بالوكلاء الفرعيين:

    - يطلب الأصل العمل باستخدام `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - يعمل الطفل في جلسة إطار تشغيل ACP الخاصة به.
    - تعمل أدوار الطفل على المسار الخلفي نفسه المستخدم لإنشاء الوكيل الفرعي الأصلي، لذلك لا يحظر إطار تشغيل ACP البطيء عمل الجلسة الرئيسية غير ذي الصلة.
    - تعود تقارير الإكمال عبر مسار إعلان إكمال المهمة. يحوّل OpenClaw بيانات تعريف الإكمال الداخلية إلى موجّه ACP عادي قبل إرسالها إلى إطار تشغيل خارجي، حتى لا ترى أطر التشغيل علامات سياق وقت التشغيل الخاصة بـ OpenClaw فقط.
    - يعيد الأصل صياغة نتيجة الطفل بصوت المساعد العادي عندما تكون الاستجابة المرئية للمستخدم مفيدة.

    لا تتعامل مع هذا المسار كدردشة نظير إلى نظير بين الأصل
    والطفل. لدى الطفل بالفعل قناة إكمال عائدة إلى
    الأصل.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    يمكن لـ `sessions_send` استهداف جلسة أخرى بعد الإنشاء. بالنسبة إلى
    جلسات النظراء العادية، يستخدم OpenClaw مسار متابعة من وكيل إلى وكيل (A2A)
    بعد حقن الرسالة:

    - انتظر رد الجلسة الهدف.
    - اسمح اختياريًا للطالب والهدف بتبادل عدد محدود من أدوار المتابعة.
    - اطلب من الهدف إنتاج رسالة إعلان.
    - سلّم ذلك الإعلان إلى القناة أو السلسلة المرئية.

    مسار A2A هذا هو مسار احتياطي لإرسالات النظراء التي يحتاج فيها المرسل إلى
    متابعة مرئية. يبقى مفعّلًا عندما تستطيع جلسة غير ذات صلة
    رؤية هدف ACP ومراسلته، مثلًا ضمن إعدادات
    `tools.sessions.visibility` الواسعة.

    يتخطى OpenClaw متابعة A2A فقط عندما يكون الطالب هو
    والدَ طفله ACP أحادي التشغيل المملوك لوالده. في هذه الحالة،
    يمكن أن يؤدي تشغيل A2A فوق إكمال المهمة إلى إيقاظ الوالد بنتيجة
    الطفل، وتمرير رد الوالد مرة أخرى إلى الطفل، وإنشاء حلقة صدى
    بين الوالد والطفل. تُبلغ نتيجة `sessions_send` عن
    `delivery.status="skipped"` لحالة الطفل المملوك هذه لأن
    مسار الإكمال مسؤول بالفعل عن النتيجة.

  </Accordion>
  <Accordion title="استئناف جلسة موجودة">
    استخدم `resumeSessionId` لمتابعة جلسة ACP سابقة بدلاً من
    البدء من جديد. يعيد الوكيل تشغيل سجل محادثته عبر
    `session/load`، لذلك يتابع بسياق كامل لما حدث سابقاً.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    حالات الاستخدام الشائعة:

    - سلّم جلسة Codex من حاسوبك المحمول إلى هاتفك - أخبر وكيلك أن يتابع من حيث توقفت.
    - واصل جلسة برمجة بدأتها تفاعلياً في CLI، والآن بلا واجهة تفاعلية عبر وكيلك.
    - استأنف عملاً انقطع بسبب إعادة تشغيل Gateway أو انتهاء مهلة الخمول.

    ملاحظات:

    - ينطبق `resumeSessionId` فقط عندما يكون `runtime: "acp"`؛ يتجاهل وقت تشغيل الوكيل الفرعي الافتراضي هذا الحقل الخاص بـ ACP فقط.
    - ينطبق `streamTo` فقط عندما يكون `runtime: "acp"`؛ يتجاهل وقت تشغيل الوكيل الفرعي الافتراضي هذا الحقل الخاص بـ ACP فقط.
    - `resumeSessionId` هو معرّف استئناف ACP/أداة تشغيل محلي للمضيف، وليس مفتاح جلسة قناة OpenClaw؛ لا يزال OpenClaw يتحقق من سياسة إنشاء ACP وسياسة الوكيل الهدف قبل الإرسال، بينما تمتلك واجهة ACP الخلفية أو أداة التشغيل صلاحية تحميل ذلك المعرّف الصاعد.
    - يستعيد `resumeSessionId` سجل محادثة ACP الصاعد؛ لا يزال `thread` و`mode` ينطبقان بشكل طبيعي على جلسة OpenClaw الجديدة التي تنشئها، لذلك لا يزال `mode: "session"` يتطلب `thread: true`.
    - يجب أن يدعم الوكيل الهدف `session/load` (يدعمه Codex وClaude Code).
    - إذا لم يُعثر على معرّف الجلسة، يفشل الإنشاء بخطأ واضح - بدون رجوع صامت إلى جلسة جديدة.

  </Accordion>
  <Accordion title="اختبار دخان بعد النشر">
    بعد نشر Gateway، شغّل فحصاً حياً شاملاً بدلاً من
    الاعتماد على اختبارات الوحدة:

    1. تحقّق من إصدار Gateway المنشور والالتزام على المضيف الهدف.
    2. افتح جلسة جسر ACPX مؤقتة إلى وكيل حي.
    3. اطلب من ذلك الوكيل استدعاء `sessions_spawn` مع `runtime: "acp"` و`agentId: "codex"` و`mode: "run"` والمهمة `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. تحقّق من `accepted=yes` ووجود `childSessionKey` حقيقي وعدم وجود خطأ مدقّق.
    5. نظّف جلسة الجسر المؤقتة.

    أبقِ البوابة على `mode: "run"` وتخطَّ `streamTo: "parent"` -
    فمسارات `mode: "session"` المرتبطة بالخيوط ومسارات ترحيل البث
    هي جولات تكامل منفصلة وأكثر ثراءً.

  </Accordion>
</AccordionGroup>

## توافق بيئة العزل

تعمل جلسات ACP حالياً على وقت تشغيل المضيف، **وليس** داخل
بيئة عزل OpenClaw.

<Warning>
**حد الأمان:**

- يمكن لأداة التشغيل الخارجية القراءة/الكتابة وفقاً لأذونات CLI الخاصة بها و`cwd` المحدد.
- لا تغلّف سياسة العزل في OpenClaw تنفيذ أداة تشغيل ACP.
- لا يزال OpenClaw يفرض بوابات ميزات ACP، والوكلاء المسموحين، وملكية الجلسات، وربط القنوات، وسياسة تسليم Gateway.
- استخدم `runtime: "subagent"` للأعمال الأصلية في OpenClaw التي تفرضها بيئة العزل.

</Warning>

القيود الحالية:

- إذا كانت جلسة الطالب معزولة، تُحظر عمليات إنشاء ACP لكل من `sessions_spawn({ runtime: "acp" })` و`/acp spawn`.
- لا يدعم `sessions_spawn` مع `runtime: "acp"` الخيار `sandbox: "require"`.

## تحديد هدف الجلسة

تقبل معظم إجراءات `/acp` هدف جلسة اختيارياً (`session-key`،
`session-id` أو `session-label`).

**ترتيب الحل:**

1. وسيطة الهدف الصريحة (أو `--session` لـ `/acp steer`)
   - تجرّب المفتاح
   - ثم معرّف جلسة بشكل UUID
   - ثم التسمية
2. ربط الخيط الحالي (إذا كانت هذه المحادثة/الخيط مرتبطة بجلسة ACP).
3. الرجوع إلى جلسة الطالب الحالية.

تشارك روابط المحادثة الحالية وروابط الخيوط معاً في
الخطوة 2.

إذا لم يُحل أي هدف، يعيد OpenClaw خطأً واضحاً
(`Unable to resolve session target: ...`).

## عناصر تحكم ACP

| الأمر                | ما يفعله                                                  | مثال                                                         |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ينشئ جلسة ACP؛ مع ربط حالي أو ربط خيط اختياري.           | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | يلغي الدور الجاري للجلسة الهدف.                          | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | يرسل تعليمة توجيه إلى جلسة قيد التشغيل.                  | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | يغلق الجلسة ويفك ربط أهداف الخيط.                        | `/acp close`                                                  |
| `/acp status`        | يعرض الواجهة الخلفية والوضع والحالة وخيارات وقت التشغيل والإمكانات. | `/acp status`                                                 |
| `/acp set-mode`      | يضبط وضع وقت التشغيل للجلسة الهدف.                       | `/acp set-mode plan`                                          |
| `/acp set`           | يكتب خيار إعداد عام لوقت التشغيل.                        | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | يضبط تجاوز دليل العمل لوقت التشغيل.                      | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | يضبط ملف تعريف سياسة الموافقة.                           | `/acp permissions strict`                                     |
| `/acp timeout`       | يضبط مهلة وقت التشغيل (بالثواني).                        | `/acp timeout 120`                                            |
| `/acp model`         | يضبط تجاوز نموذج وقت التشغيل.                            | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | يزيل تجاوزات خيارات وقت تشغيل الجلسة.                    | `/acp reset-options`                                          |
| `/acp sessions`      | يسرد جلسات ACP الحديثة من المخزن.                        | `/acp sessions`                                               |
| `/acp doctor`        | صحة الواجهة الخلفية والإمكانات وإصلاحات قابلة للتنفيذ.   | `/acp doctor`                                                 |
| `/acp install`       | يطبع خطوات تثبيت وتمكين حتمية.                           | `/acp install`                                                |

تتطلب عناصر تحكم وقت التشغيل (`spawn` و`cancel` و`steer` و`close` و`status` و`set-mode` و
`set` و`cwd` و`permissions` و`timeout` و`model` و`reset-options`)
هوية المالك من القنوات الخارجية و`operator.admin` من عملاء Gateway
الداخليين. لا يزال بإمكان المرسلين غير المالكين المصرح لهم استخدام `sessions` و`doctor` و
`install` و`help`.

يعرض `/acp status` خيارات وقت التشغيل الفعلية بالإضافة إلى معرّفات
الجلسة على مستوى وقت التشغيل ومستوى الواجهة الخلفية. تظهر أخطاء
عناصر التحكم غير المدعومة بوضوح عندما تفتقر الواجهة الخلفية إلى
إمكانية. يقرأ `/acp sessions` المخزن للجلسة الحالية المرتبطة أو
جلسة الطالب؛ تُحل رموز الهدف (`session-key` أو `session-id` أو
`session-label`) عبر اكتشاف جلسات Gateway، بما في ذلك جذور
`session.store` المخصصة لكل وكيل.

### ربط خيارات وقت التشغيل

لدى `/acp` أوامر ملائمة ومُعيّن عام. العمليات المكافئة:

| الأمر                        | يرتبط بـ                             | ملاحظات                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | مفتاح إعداد وقت التشغيل `model`      | بالنسبة إلى Codex ACP، يطبّع OpenClaw ‏`openai/<model>` إلى معرّف نموذج المهايئ ويربط لواحق التفكير ذات الشرطة المائلة مثل `openai/gpt-5.4/high` بـ `reasoning_effort`.                                      |
| `/acp set thinking <level>`  | الخيار القانوني `thinking`           | يرسل OpenClaw المكافئ المعلن من الواجهة الخلفية عند وجوده، مفضلاً `thinking`، ثم `effort` أو `reasoning_effort` أو `thought_level`. بالنسبة إلى Codex ACP، يربط المهايئ القيم بـ `reasoning_effort`. |
| `/acp permissions <profile>` | الخيار القانوني `permissionProfile`  | يرسل OpenClaw المكافئ المعلن من الواجهة الخلفية عند وجوده، مثل `approval_policy` أو `permission_profile` أو `permissions` أو `permission_mode`.                                                       |
| `/acp timeout <seconds>`     | الخيار القانوني `timeoutSeconds`     | يرسل OpenClaw المكافئ المعلن من الواجهة الخلفية عند وجوده، مثل `timeout` أو `timeout_seconds`.                                                                                                     |
| `/acp cwd <path>`            | تجاوز cwd لوقت التشغيل               | تحديث مباشر.                                                                                                                                                                                              |
| `/acp set <key> <value>`     | عام                                  | يستخدم `key=cwd` مسار تجاوز cwd.                                                                                                                                                                          |
| `/acp reset-options`         | يمسح كل تجاوزات وقت التشغيل          | -                                                                                                                                                                                                          |

## أداة تشغيل acpx، وإعداد Plugin، والأذونات

لإعداد أداة تشغيل acpx (أسماء Claude Code / Codex / Gemini CLI
المستعارة)، وجسور MCP الخاصة بـ plugin-tools وOpenClaw-tools، وأوضاع
أذونات ACP، راجع
[وكلاء ACP - الإعداد](/ar/tools/acp-agents-setup).

## استكشاف الأخطاء وإصلاحها

| العَرَض                                                                     | السبب المحتمل                                                                                                           | الإصلاح                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin الخلفية مفقود أو معطّل أو محظور بواسطة `plugins.allow`.                                                       | ثبّت ومكّن Plugin الخلفية، وضمّن `acpx` في `plugins.allow` عند ضبط قائمة السماح هذه، ثم شغّل `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP معطّل عموميًا.                                                                                                 | اضبط `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | التوزيع التلقائي من رسائل السلاسل العادية معطّل.                                                               | اضبط `acp.dispatch.enabled=true` لاستئناف توجيه السلاسل التلقائي؛ لا تزال استدعاءات `sessions_spawn({ runtime: "acp" })` الصريحة تعمل.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | الوكيل غير موجود في قائمة السماح.                                                                                                | استخدم `agentId` مسموحًا به أو حدّث `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` يبلغ أن الخلفية غير جاهزة مباشرة بعد بدء التشغيل                 | Plugin الخلفية مفقود أو معطّل أو محظور بواسطة سياسة السماح/المنع، أو أن الملف التنفيذي المضبوط له غير متاح.        | ثبّت/مكّن Plugin الخلفية، وأعد تشغيل `/acp doctor`، وافحص خطأ تثبيت الخلفية أو السياسة إذا بقيت غير سليمة.                                           |
| لم يُعثر على أمر الحزمة                                                   | لم تُثبّت CLI المهايئ، أو أن Plugin الخارجي مفقود، أو فشل جلب `npx` عند التشغيل الأول لمهايئ غير Codex. | شغّل `/acp doctor`، وثبّت/سخّن المهايئ مسبقًا على مضيف Gateway، أو اضبط أمر وكيل acpx صراحةً.                                                      |
| لم يُعثر على النموذج من الحزمة                                            | معرّف النموذج صالح لمزوّد/حزمة آخر لكن ليس لهدف ACP هذا.                                                | استخدم نموذجًا مدرجًا بواسطة تلك الحزمة، أو اضبط النموذج في الحزمة، أو احذف التجاوز.                                                                            |
| خطأ مصادقة المورّد من الحزمة                                          | OpenClaw سليم، لكن CLI/المزوّد الهدف لم يسجّل الدخول.                                                     | سجّل الدخول أو وفّر مفتاح المزوّد المطلوب في بيئة مضيف Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | رمز مفتاح/معرّف/تسمية غير صحيح.                                                                                                | شغّل `/acp sessions`، وانسخ المفتاح/التسمية بدقة، ثم أعد المحاولة.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | استُخدم `--bind here` دون محادثة نشطة قابلة للربط.                                                            | انتقل إلى الدردشة/القناة الهدف وأعد المحاولة، أو استخدم الإنشاء غير المربوط.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | يفتقر المهايئ إلى إمكانية ربط ACP بالمحادثة الحالية.                                                             | استخدم `/acp spawn ... --thread ...` حيث يكون ذلك مدعومًا، أو اضبط `bindings[]` ذات المستوى الأعلى، أو انتقل إلى قناة مدعومة.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | استُخدم `--thread here` خارج سياق سلسلة.                                                                         | انتقل إلى السلسلة الهدف أو استخدم `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | مستخدم آخر يملك هدف الربط النشط.                                                                           | أعد الربط بصفتك المالك أو استخدم محادثة أو سلسلة مختلفة.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | يفتقر المهايئ إلى إمكانية ربط السلاسل.                                                                               | استخدم `--thread off` أو انتقل إلى مهايئ/قناة مدعومة.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | وقت تشغيل ACP يعمل على جانب المضيف؛ جلسة الطالب معزولة.                                                              | استخدم `runtime="subagent"` من الجلسات المعزولة، أو شغّل إنشاء ACP من جلسة غير معزولة.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | طُلب `sandbox="require"` لوقت تشغيل ACP.                                                                         | استخدم `runtime="subagent"` للعزل المطلوب، أو استخدم ACP مع `sandbox="inherit"` من جلسة غير معزولة.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | الحزمة الهدف لا تكشف تبديل نماذج ACP العام.                                                        | استخدم حزمة تعلن عن `models`/`session/set_model` في ACP، أو استخدم مراجع نماذج ACP في Codex، أو اضبط النموذج مباشرةً في الحزمة إذا كان لديها علم بدء تشغيل خاص بها. |
| بيانات ACP الوصفية مفقودة للجلسة المربوطة                                      | بيانات ACP الوصفية للجلسة قديمة/محذوفة.                                                                                    | أعد إنشاءها باستخدام `/acp spawn`، ثم أعد ربط/تركيز السلسلة.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` يمنع الكتابة/التنفيذ في جلسة ACP غير تفاعلية.                                                    | اضبط `plugins.entries.acpx.config.permissionMode` على `approve-all` وأعد تشغيل Gateway. راجع [إعدادات الأذونات](/ar/tools/acp-agents-setup#permission-configuration). |
| تفشل جلسة ACP مبكرًا مع مخرجات قليلة                                  | مطالبات الأذونات محظورة بواسطة `permissionMode`/`nonInteractivePermissions`.                                        | تحقّق من سجلات Gateway بحثًا عن `AcpRuntimeError`. للأذونات الكاملة، اضبط `permissionMode=approve-all`؛ وللتدهور السلس، اضبط `nonInteractivePermissions=deny`.        |
| تتوقف جلسة ACP إلى أجل غير مسمى بعد إكمال العمل                       | انتهت عملية الحزمة لكن جلسة ACP لم تبلغ عن الاكتمال.                                                    | حدّث OpenClaw؛ تنظيف acpx الحالي يحصد عمليات الغلاف والمهايئ القديمة المملوكة لـ OpenClaw عند الإغلاق وبدء تشغيل Gateway.                                             |
| ترى الحزمة `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | تسرّب غلاف الحدث الداخلي عبر حدود ACP.                                                                | حدّث OpenClaw وأعد تشغيل تدفق الإكمال؛ يجب أن تتلقى الحزم الخارجية مطالبات إكمال عادية فقط.                                                          |

<Note>
ينتمي `Command blocked by PreToolUse hook: Native hook relay unavailable` إلى
مرحل خطاف Codex الأصلي، وليس إلى ACP/acpx. في دردشة Codex مربوطة، ابدأ
جلسة جديدة باستخدام `/new` أو `/reset`؛ إذا عملت مرة واحدة ثم عاد الخطأ عند استدعاء
الأداة الأصلية التالي، فأعد تشغيل خادم تطبيق Codex أو OpenClaw Gateway بدلًا من
تكرار `/new`. راجع [استكشاف مشكلات حزمة Codex وإصلاحها](/ar/plugins/codex-harness#troubleshooting).
</Note>

## ذات صلة

- [وكلاء ACP - الإعداد](/ar/tools/acp-agents-setup)
- [إرسال الوكيل](/ar/tools/agent-send)
- [خلفيات CLI](/ar/gateway/cli-backends)
- [حزمة Codex](/ar/plugins/codex-harness)
- [وقت تشغيل حزمة Codex](/ar/plugins/codex-harness-runtime)
- [أدوات عزل الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (وضع الجسر)](/ar/cli/acp)
- [الوكلاء الفرعيون](/ar/tools/subagents)
