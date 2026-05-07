---
read_when:
    - تشغيل بيئات الترميز عبر ACP
    - إعداد جلسات ACP المرتبطة بالمحادثة على قنوات المراسلة
    - ربط محادثة قناة رسائل بجلسة ACP دائمة
    - استكشاف أخطاء خلفية ACP أو ربط Plugin أو تسليم الإكمال وإصلاحها
    - تشغيل أوامر /acp من الدردشة
sidebarTitle: ACP agents
summary: شغّل حاضنات البرمجة الخارجية (Claude Code، Cursor، Gemini CLI، Codex ACP الصريح، OpenClaw ACP، OpenCode) عبر الواجهة الخلفية لـ ACP
title: وكلاء ACP
x-i18n:
    generated_at: "2026-05-07T13:29:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5cdb853d2cec2c7466fff5f1e046b38bf9bac8b2b62f208ad3465a666272631
    source_path: tools/acp-agents.md
    workflow: 16
---

جلسات [بروتوكول عميل الوكيل (ACP)](https://agentclientprotocol.com/)
تتيح لـ OpenClaw تشغيل حاضنات البرمجة الخارجية (على سبيل المثال Pi وClaude Code
وCursor وCopilot وDroid وOpenClaw ACP وOpenCode وGemini CLI والحاضنات الأخرى
المدعومة من ACPX) عبر Plugin واجهة خلفية لـ ACP.

يُتتبَّع كل إنشاء لجلسة ACP بوصفه [مهمة في الخلفية](/ar/automation/tasks).

<Note>
**ACP هو مسار الحاضنات الخارجية، وليس مسار Codex الافتراضي.** يملك
Plugin خادم تطبيق Codex الأصلي عناصر التحكم `/codex ...` ووقت التشغيل
المضمَّن `agentRuntime.id: "codex"`؛ بينما يملك ACP عناصر التحكم
`/acp ...` وجلسات `sessions_spawn({ runtime: "acp" })`.

إذا كنت تريد أن يتصل Codex أو Claude Code كعميل MCP خارجي
مباشرة بمحادثات قنوات OpenClaw الموجودة، فاستخدم
[`openclaw mcp serve`](/ar/cli/mcp) بدلًا من ACP.
</Note>

## أي صفحة أريد؟

| تريد أن…                                                                                       | استخدم هذا                            | ملاحظات                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ربط Codex أو التحكم به في المحادثة الحالية                                                     | `/codex bind`, `/codex threads`       | مسار خادم تطبيق Codex الأصلي عند تفعيل Plugin `codex`؛ يتضمن ردود الدردشة المربوطة، وتمرير الصور، والنموذج/السريع/الأذونات، والإيقاف، وعناصر التحكم في التوجيه. ACP بديل صريح |
| تشغيل Claude Code أو Gemini CLI أو Codex ACP صريح أو حاضنة خارجية أخرى _عبر_ OpenClaw | هذه الصفحة                            | جلسات مربوطة بالدردشة، و`/acp spawn`، و`sessions_spawn({ runtime: "acp" })`، ومهام خلفية، وعناصر تحكم وقت التشغيل                                                                            |
| كشف جلسة OpenClaw Gateway _كـ_ خادم ACP لمحرر أو عميل                                          | [`openclaw acp`](/ar/cli/acp)            | وضع الجسر. يتحدث IDE/العميل ACP إلى OpenClaw عبر stdio/WebSocket                                                                                                                            |
| إعادة استخدام CLI ذكاء اصطناعي محلي كنموذج احتياطي نصي فقط                                    | [واجهات CLI الخلفية](/ar/gateway/cli-backends) | ليس ACP. لا توجد أدوات OpenClaw، ولا عناصر تحكم ACP، ولا وقت تشغيل للحاضنة                                                                                                                   |

## هل يعمل هذا مباشرة؟

نعم، بعد تثبيت Plugin وقت تشغيل ACP الرسمي:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

يمكن لنسخ المصدر استخدام Plugin مساحة العمل المحلي `extensions/acpx` بعد
`pnpm install`. شغّل `/acp doctor` لفحص الجاهزية.

لا يعلّم OpenClaw الوكلاء عن إنشاء ACP إلا عندما يكون ACP **قابلًا للاستخدام
فعليًا**: يجب أن يكون ACP مفعّلًا، وألا يكون الإرسال معطّلًا، وألا تكون
الجلسة الحالية محظورة بسبب sandbox، وأن تكون واجهة خلفية لوقت التشغيل
محمّلة. إذا لم تتحقق هذه الشروط، تبقى Skills الخاصة بـ Plugin ACP وإرشادات
ACP لـ `sessions_spawn` مخفية حتى لا يقترح الوكيل واجهة خلفية غير متاحة.

<AccordionGroup>
  <Accordion title="ملاحظات مهمة عند التشغيل الأول">
    - إذا كان `plugins.allow` مضبوطًا، فهو مخزون Plugin تقييدي و**يجب** أن يتضمن `acpx`؛ وإلا فسيُحظر Plugin واجهة ACP الخلفية المثبّت عمدًا، وسيبلغ `/acp doctor` عن إدخال قائمة السماح المفقود.
    - يُجهَّز محوّل Codex ACP مع Plugin `acpx` ويُشغَّل محليًا عندما يكون ذلك ممكنًا.
    - يعمل Codex ACP مع `CODEX_HOME` معزول؛ ينسخ OpenClaw فقط إدخالات المشاريع الموثوقة من إعدادات Codex على المضيف ويثق بمساحة العمل النشطة، مع إبقاء المصادقة والإشعارات والخطافات على إعدادات المضيف.
    - قد تظل محوّلات الحاضنات الهدف الأخرى تُجلَب عند الطلب باستخدام `npx` في المرة الأولى التي تستخدمها فيها.
    - يجب أن تظل مصادقة المورّد موجودة على المضيف لتلك الحاضنة.
    - إذا لم يكن لدى المضيف npm أو وصول إلى الشبكة، تفشل عمليات جلب المحوّل عند التشغيل الأول إلى أن تُحمّى الذاكرات المؤقتة مسبقًا أو يُثبَّت المحوّل بطريقة أخرى.

  </Accordion>
  <Accordion title="متطلبات وقت التشغيل">
    يطلق ACP عملية حاضنة خارجية حقيقية. يملك OpenClaw التوجيه،
    وحالة مهمة الخلفية، والتسليم، والربط، والسياسة؛ وتملك الحاضنة
    تسجيل دخول المزوّد، وكتالوج النماذج، وسلوك نظام الملفات،
    والأدوات الأصلية الخاصة بها.

    قبل لوم OpenClaw، تحقق مما يلي:

    - يبلغ `/acp doctor` عن واجهة خلفية مفعّلة وسليمة.
    - معرّف الهدف مسموح به عبر `acp.allowedAgents` عندما تكون قائمة السماح هذه مضبوطة.
    - يمكن لأمر الحاضنة البدء على مضيف Gateway.
    - مصادقة المزوّد موجودة لتلك الحاضنة (`claude`, `codex`, `gemini`, `opencode`, `droid`, إلخ).
    - النموذج المحدد موجود لتلك الحاضنة - معرّفات النماذج ليست قابلة للنقل بين الحاضنات.
    - `cwd` المطلوب موجود ويمكن الوصول إليه، أو احذف `cwd` ودع الواجهة الخلفية تستخدم الإعداد الافتراضي الخاص بها.
    - وضع الأذونات يطابق العمل. لا تستطيع الجلسات غير التفاعلية النقر على مطالبات الأذونات الأصلية، لذلك تحتاج عمليات البرمجة الكثيفة كتابةً/تنفيذًا عادةً إلى ملف أذونات ACPX يمكنه المتابعة دون واجهة.

  </Accordion>
</AccordionGroup>

لا تُعرَض أدوات Plugin الخاصة بـ OpenClaw ولا أدوات OpenClaw المدمجة
لحاضنات ACP افتراضيًا. فعّل جسور MCP الصريحة في
[وكلاء ACP - الإعداد](/ar/tools/acp-agents-setup) فقط عندما ينبغي للحاضنة
استدعاء تلك الأدوات مباشرة.

## أهداف الحاضنات المدعومة

مع واجهة `acpx` الخلفية، استخدم معرّفات الحاضنات هذه كأهداف
`/acp spawn <id>` أو `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| معرّف الحاضنة | الواجهة الخلفية النموذجية                  | ملاحظات                                                                            |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | محوّل Claude Code ACP                          | يتطلب مصادقة Claude Code على المضيف.                                               |
| `codex`    | محوّل Codex ACP                                | بديل ACP صريح فقط عندما لا يكون `/codex` الأصلي متاحًا أو عندما يُطلب ACP. |
| `copilot`  | محوّل GitHub Copilot ACP                       | يتطلب مصادقة Copilot CLI/وقت التشغيل.                                              |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | تجاوز أمر acpx إذا كان تثبيت محلي يكشف نقطة دخول ACP مختلفة.                      |
| `droid`    | Factory Droid CLI                              | يتطلب مصادقة Factory/Droid أو `FACTORY_API_KEY` في بيئة الحاضنة.                  |
| `gemini`   | محوّل Gemini CLI ACP                           | يتطلب مصادقة Gemini CLI أو إعداد مفتاح API.                                        |
| `iflow`    | iFlow CLI                                      | يعتمد توفر المحوّل والتحكم في النموذج على CLI المثبّت.                            |
| `kilocode` | Kilo Code CLI                                  | يعتمد توفر المحوّل والتحكم في النموذج على CLI المثبّت.                            |
| `kimi`     | Kimi/Moonshot CLI                              | يتطلب مصادقة Kimi/Moonshot على المضيف.                                            |
| `kiro`     | Kiro CLI                                       | يعتمد توفر المحوّل والتحكم في النموذج على CLI المثبّت.                            |
| `opencode` | محوّل OpenCode ACP                             | يتطلب مصادقة OpenCode CLI/المزوّد.                                                |
| `openclaw` | جسر OpenClaw Gateway عبر `openclaw acp`        | يتيح لحاضنة مدركة لـ ACP التحدث مجددًا إلى جلسة OpenClaw Gateway.                |
| `pi`       | وقت تشغيل Pi/OpenClaw المضمّن                 | يُستخدم لتجارب الحاضنات الأصلية لـ OpenClaw.                                      |
| `qwen`     | Qwen Code / Qwen CLI                           | يتطلب مصادقة متوافقة مع Qwen على المضيف.                                          |

يمكن تكوين أسماء مستعارة مخصصة لوكلاء acpx في acpx نفسه، لكن سياسة OpenClaw
لا تزال تتحقق من `acp.allowedAgents` وأي تعيين
`agents.list[].runtime.acp.agent` قبل الإرسال.

## دليل تشغيل المشغّل

تدفق `/acp` سريع من الدردشة:

<Steps>
  <Step title="الإنشاء">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`، أو
    `/acp spawn codex --bind here` الصريح.
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
    دون استبدال السياق: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="الإيقاف">
    `/acp cancel` (الدور الحالي) أو `/acp close` (الجلسة + عمليات الربط).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="تفاصيل دورة الحياة">
    - ينشئ Spawn جلسة وقت تشغيل ACP أو يستأنفها، ويسجل بيانات ACP الوصفية في مخزن جلسات OpenClaw، وقد ينشئ مهمة خلفية عندما يكون التشغيل مملوكًا للأصل.
    - تُعامَل جلسات ACP المملوكة للأصل كعمل في الخلفية حتى عندما تكون جلسة وقت التشغيل مستمرة؛ ويمر الإكمال والتسليم عبر الأسطح المختلفة عبر مُخطِر المهمة الأصل بدلًا من التصرف كجلسة دردشة عادية مواجهة للمستخدم.
    - تغلق صيانة المهام جلسات ACP أحادية التشغيل المملوكة للأصل إذا كانت نهائية أو يتيمة. تُحافَظ على جلسات ACP المستمرة ما دام ربط محادثة نشط باقيًا؛ وتُغلَق الجلسات المستمرة القديمة التي لا تملك ربطًا نشطًا حتى لا يمكن استئنافها بصمت بعد انتهاء المهمة المالكة أو اختفاء سجل مهمتها.
    - تنتقل رسائل المتابعة المربوطة مباشرة إلى جلسة ACP إلى أن يُغلَق الربط أو يُزال تركيزه أو يُعاد ضبطه أو تنتهي صلاحيته.
    - تبقى أوامر Gateway محلية. لا تُرسل `/acp ...` و`/status` و`/unfocus` أبدًا كنص مطالبة عادي إلى حاضنة ACP مربوطة.
    - يُجهض `cancel` الدور النشط عندما تدعم الواجهة الخلفية الإلغاء؛ ولا يحذف الربط أو بيانات الجلسة الوصفية.
    - ينهي `close` جلسة ACP من وجهة نظر OpenClaw ويزيل الربط. قد تظل الحاضنة تحتفظ بتاريخها العلوي إذا كانت تدعم الاستئناف.
    - ينظف Plugin acpx أشجار عمليات الغلاف والمحوّل المملوكة لـ OpenClaw بعد `close`، ويحصد عمليات ACPX اليتيمة القديمة المملوكة لـ OpenClaw أثناء بدء Gateway.
    - يصبح عمال وقت التشغيل الخاملون مؤهلين للتنظيف بعد `acp.runtime.ttlMinutes`؛ وتظل بيانات الجلسات الوصفية المخزنة متاحة لـ `/acp sessions`.

  </Accordion>
  <Accordion title="قواعد توجيه Codex الأصلية">
    المحفزات باللغة الطبيعية التي ينبغي توجيهها إلى **Plugin Codex
    الأصلي** عندما يكون مفعّلًا:

    - "اربط قناة Discord هذه بـ Codex."
    - "أرفق هذه الدردشة بسلسلة Codex `<id>`."
    - "اعرض سلاسل Codex، ثم اربط هذه الواحدة."

    ربط محادثة Codex الأصلي هو مسار التحكم بالدردشة الافتراضي.
    تظل أدوات OpenClaw الديناميكية تُنفَّذ عبر OpenClaw، بينما
    تُنفَّذ أدوات Codex الأصلية مثل shell/apply-patch داخل Codex.
    بالنسبة إلى أحداث أدوات Codex الأصلية، يحقن OpenClaw مُرحِّل
    خطاف أصلي لكل دورة حتى تتمكن خطافات Plugin من حظر `before_tool_call`، ومراقبة
    `after_tool_call`، وتوجيه أحداث Codex `PermissionRequest`
    عبر موافقات OpenClaw. تُرحَّل خطافات Codex `Stop` إلى
    OpenClaw `before_agent_finalize`، حيث يمكن للـ plugins طلب تمريرة
    نموذج إضافية قبل أن يُنهي Codex إجابته. يظل المُرحِّل
    محافظًا عمدًا: فهو لا يغيّر وسائط أدوات Codex الأصلية
    ولا يعيد كتابة سجلات سلاسل Codex. استخدم ACP الصريح فقط
    عندما تريد نموذج runtime/session الخاص بـ ACP. حدود دعم Codex
    المضمّن موثقة في
    [عقد دعم حاضنة Codex v1](/ar/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Model / provider / runtime selection cheat sheet">
    - `openai-codex/*` - مسار نموذج Codex القديم عبر OAuth/الاشتراك، يُصلحه doctor.
    - `openai/*` - runtime مضمّن أصلي لخادم تطبيق Codex لدورات وكيل OpenAI.
    - `/codex ...` - تحكم أصلي في محادثة Codex.
    - `/acp ...` أو `runtime: "acp"` - تحكم ACP/acpx صريح.

  </Accordion>
  <Accordion title="ACP-routing natural-language triggers">
    محفزات يجب أن تُوجَّه إلى runtime الخاص بـ ACP:

    - "شغّل هذا كجلسة Claude Code ACP لمرة واحدة ولخّص النتيجة."
    - "استخدم Gemini CLI لهذه المهمة في سلسلة، ثم أبقِ المتابعات في السلسلة نفسها."
    - "شغّل Codex عبر ACP في سلسلة خلفية."

    يختار OpenClaw القيمة `runtime: "acp"`، ويحلّ `agentId` الخاص بالحاضنة،
    ويرتبط بالمحادثة أو السلسلة الحالية عندما يكون ذلك مدعومًا، ويوجّه
    المتابعات إلى تلك الجلسة حتى الإغلاق/انتهاء الصلاحية. يتبع Codex هذا
    المسار فقط عندما يكون ACP/acpx صريحًا أو عندما يكون Plugin Codex الأصلي
    غير متاح للعملية المطلوبة.

    بالنسبة إلى `sessions_spawn`، لا يُعلَن عن `runtime: "acp"` إلا عندما يكون ACP
    مفعّلًا، ولا يكون الطالب في sandbox، ويكون runtime backend
    الخاص بـ ACP محمّلًا. يوقف `acp.dispatch.enabled=false` مؤقتًا
    إرسال سلاسل ACP تلقائيًا، لكنه لا يخفي أو يحظر استدعاءات
    `sessions_spawn({ runtime: "acp" })` الصريحة. إنه يستهدف معرّفات حاضنة ACP مثل `codex`،
    أو `claude`، أو `droid`، أو `gemini`، أو `opencode`. لا تمرر معرّف وكيل
    OpenClaw عاديًا من `agents_list` إلا إذا كان ذلك الإدخال
    مضبوطًا صراحةً باستخدام `agents.list[].runtime.type="acp"`؛
    وإلا فاستخدم runtime الافتراضي للوكيل الفرعي. عندما يكون وكيل OpenClaw
    مضبوطًا باستخدام `runtime.type="acp"`، يستخدم OpenClaw
    `runtime.acp.agent` باعتباره معرّف الحاضنة الأساسي.

  </Accordion>
</AccordionGroup>

## ACP مقابل الوكلاء الفرعيين

استخدم ACP عندما تريد runtime حاضنة خارجيًا. استخدم **خادم تطبيق Codex
الأصلي** لربط/تحكم محادثة Codex عندما يكون Plugin `codex`
مفعّلًا. استخدم **الوكلاء الفرعيين** عندما تريد تشغيلات مفوضة
أصلية من OpenClaw.

| المجال        | جلسة ACP                              | تشغيل وكيل فرعي                    |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | ACP backend plugin (مثل acpx)         | OpenClaw runtime أصلي للوكيل الفرعي |
| مفتاح الجلسة  | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| الأوامر الرئيسية | `/acp ...`                         | `/subagents ...`                   |
| أداة الإنشاء  | `sessions_spawn` مع `runtime:"acp"`   | `sessions_spawn` (runtime الافتراضي) |

راجع أيضًا [الوكلاء الفرعيون](/ar/tools/subagents).

## كيف يشغّل ACP ‏Claude Code

بالنسبة إلى Claude Code عبر ACP، تكون الحزمة:

1. مستوى تحكم جلسة OpenClaw ACP.
2. runtime plugin الرسمي `@openclaw/acpx`.
3. محول Claude ACP.
4. آليات runtime/session في جهة Claude.

ACP Claude هو **جلسة حاضنة** مع عناصر تحكم ACP، واستئناف الجلسة،
وتتبع مهام الخلفية، وربط اختياري بالمحادثة/السلسلة.

تعد CLI backends runtimes محلية احتياطية نصية فقط ومنفصلة - راجع
[CLI Backends](/ar/gateway/cli-backends).

بالنسبة إلى المشغّلين، القاعدة العملية هي:

- **تريد `/acp spawn`، أو جلسات قابلة للربط، أو عناصر تحكم runtime، أو عمل حاضنة مستمرًا؟** استخدم ACP.
- **تريد احتياطيًا نصيًا محليًا بسيطًا عبر CLI الخام؟** استخدم CLI backends.

## الجلسات المرتبطة

### النموذج الذهني

- **سطح الدردشة** - حيث يواصل الأشخاص الحديث (قناة Discord، موضوع Telegram، دردشة iMessage).
- **جلسة ACP** - حالة runtime دائمة لـ Codex/Claude/Gemini يوجّه OpenClaw إليها.
- **سلسلة/موضوع فرعي** - سطح مراسلة إضافي اختياري لا يُنشأ إلا بواسطة `--thread ...`.
- **مساحة عمل runtime** - موقع نظام الملفات (`cwd`، نسخة repo، مساحة عمل backend) حيث تعمل الحاضنة. مستقل عن سطح الدردشة.

### روابط المحادثة الحالية

يثبّت `/acp spawn <harness> --bind here` المحادثة الحالية على
جلسة ACP التي تم إنشاؤها - بلا سلسلة فرعية، وبنفس سطح الدردشة. يواصل OpenClaw
امتلاك النقل والمصادقة والسلامة والتسليم. تُوجَّه رسائل المتابعة في تلك
المحادثة إلى الجلسة نفسها؛ يعيد `/new` و`/reset` ضبط
الجلسة في مكانها؛ ويزيل `/acp close` الربط.

أمثلة:

```text
/codex bind                                              # ربط Codex أصلي، توجيه الرسائل المستقبلية هنا
/codex model gpt-5.4                                     # ضبط سلسلة Codex الأصلية المرتبطة
/codex stop                                              # التحكم في دورة Codex الأصلية النشطة
/acp spawn codex --bind here                             # احتياطي ACP صريح لـ Codex
/acp spawn codex --thread auto                           # قد ينشئ سلسلة/موضوعًا فرعيًا ويربط هناك
/acp spawn codex --bind here --cwd /workspace/repo       # ربط الدردشة نفسه، يعمل Codex في /workspace/repo
```

<AccordionGroup>
  <Accordion title="Binding rules and exclusivity">
    - `--bind here` و`--thread ...` متنافيان.
    - لا يعمل `--bind here` إلا على القنوات التي تعلن دعم ربط المحادثة الحالية؛ وإلا يعيد OpenClaw رسالة واضحة تفيد بعدم الدعم. تستمر الروابط عبر إعادة تشغيل Gateway.
    - في Discord، يتحكم `spawnSessions` في إنشاء السلاسل الفرعية لـ `--thread auto|here` - وليس `--bind here`.
    - إذا أنشأت جلسة إلى وكيل ACP مختلف دون `--cwd`، يرث OpenClaw مساحة عمل **الوكيل الهدف** افتراضيًا. تعود المسارات الموروثة المفقودة (`ENOENT`/`ENOTDIR`) إلى backend الافتراضي؛ أما أخطاء الوصول الأخرى (مثل `EACCES`) فتظهر كأخطاء إنشاء.
    - تبقى أوامر إدارة Gateway محلية في المحادثات المرتبطة - تتعامل OpenClaw مع أوامر `/acp ...` حتى عندما يُوجَّه نص المتابعة العادي إلى جلسة ACP المرتبطة؛ كما يبقى `/status` و`/unfocus` محليين كلما كان التعامل مع الأوامر مفعّلًا لذلك السطح.

  </Accordion>
  <Accordion title="Thread-bound sessions">
    عندما تكون روابط السلاسل مفعّلة لمحول قناة:

    - يربط OpenClaw سلسلة بجلسة ACP مستهدفة.
    - تُوجَّه رسائل المتابعة في تلك السلسلة إلى جلسة ACP المرتبطة.
    - يُسلَّم خرج ACP مرة أخرى إلى السلسلة نفسها.
    - يؤدي إلغاء التركيز/الإغلاق/الأرشفة/مهلة الخمول أو انتهاء الحد الأقصى للعمر إلى إزالة الربط.
    - `/acp close`، و`/acp cancel`، و`/acp status`، و`/status`، و`/unfocus` هي أوامر Gateway، وليست مطالبات إلى حاضنة ACP.

    أعلام الميزات المطلوبة لـ ACP المرتبط بالسلسلة:

    - `acp.enabled=true`
    - يكون `acp.dispatch.enabled` مفعّلًا افتراضيًا (عيّنه إلى `false` لإيقاف إرسال سلاسل ACP تلقائيًا مؤقتًا؛ تظل استدعاءات `sessions_spawn({ runtime: "acp" })` الصريحة تعمل).
    - تمكين إنشاء جلسات سلاسل محول القناة (الافتراضي: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    دعم ربط السلاسل خاص بالمحول. إذا كان محول القناة النشط
    لا يدعم روابط السلاسل، يعيد OpenClaw رسالة واضحة
    تفيد بعدم الدعم/عدم التوفر.

  </Accordion>
  <Accordion title="Thread-supporting channels">
    - أي محول قناة يعرّض قدرة ربط الجلسة/السلسلة.
    - الدعم المدمج الحالي: سلاسل/قنوات **Discord**، وموضوعات **Telegram** (موضوعات المنتدى في المجموعات/المجموعات الفائقة وموضوعات الرسائل الخاصة).
    - يمكن لقنوات Plugin إضافة الدعم عبر واجهة الربط نفسها.

  </Accordion>
</AccordionGroup>

## روابط القنوات الدائمة

بالنسبة إلى سير العمل غير العابر، اضبط روابط ACP الدائمة في
إدخالات `bindings[]` ذات المستوى الأعلى.

### نموذج الربط

<ParamField path="bindings[].type" type='"acp"'>
  يضع علامة على ربط محادثة ACP دائم.
</ParamField>
<ParamField path="bindings[].match" type="object">
  يحدد المحادثة الهدف. الأشكال حسب القناة:

- **قناة/سلسلة Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **موضوع منتدى Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **رسالة/مجموعة BlueBubbles خاصة:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. فضّل `chat_id:*` أو `chat_identifier:*` لروابط المجموعات المستقرة.
- **رسالة/مجموعة iMessage خاصة:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. فضّل `chat_id:*` لروابط المجموعات المستقرة.

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
  دليل عمل runtime اختياري.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  تجاوز backend اختياري.
</ParamField>

### الإعدادات الافتراضية للـ runtime لكل وكيل

استخدم `agents.list[].runtime` لتعريف إعدادات ACP الافتراضية مرة واحدة لكل وكيل:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (معرّف الحاضنة، مثل `codex` أو `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**أسبقية التجاوز لجلسات ACP المرتبطة:**

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

- يضمن OpenClaw وجود جلسة ACP المكوّنة قبل استخدامها.
- تُوجَّه الرسائل في تلك القناة أو ذلك الموضوع إلى جلسة ACP المكوّنة.
- في المحادثات المرتبطة، يعيد `/new` و`/reset` تعيين مفتاح جلسة ACP نفسه في مكانه.
- تظل ارتباطات وقت التشغيل المؤقتة (مثل تلك التي تُنشأ عبر تدفقات تركيز السلاسل) مطبقة حيثما وُجدت.
- بالنسبة إلى عمليات إنشاء ACP العابرة للوكلاء دون `cwd` صريح، يرث OpenClaw مساحة عمل الوكيل الهدف من إعدادات الوكيل.
- تعود مسارات مساحة العمل الموروثة المفقودة إلى `cwd` الافتراضي للخلفية؛ أما إخفاقات الوصول غير المفقودة فتظهر كأخطاء إنشاء.

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
    تكون القيمة الافتراضية لـ `runtime` هي `subagent`، لذا عيّن `runtime: "acp"` صراحةً
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

    الأعلام الرئيسية:

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
  معرّف إطار التشغيل الهدف لـ ACP. يعود إلى `acp.defaultAgent` إذا كان مضبوطًا.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  يطلب تدفق ربط سلسلة حيث يكون ذلك مدعومًا.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` لمرة واحدة؛ و`"session"` مستمرة. إذا كان `thread: true` وكان
  `mode` محذوفًا، فقد يعتمد OpenClaw سلوكًا مستمرًا افتراضيًا بحسب
  مسار وقت التشغيل. يتطلب `mode: "session"` وجود `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  دليل العمل المطلوب لوقت التشغيل (تتحقق منه سياسة الخلفية/وقت التشغيل).
  إذا حُذف، يرث إنشاء ACP مساحة عمل الوكيل الهدف
  عند تكوينها؛ وتعود المسارات الموروثة المفقودة إلى افتراضيات
  الخلفية، بينما تُعاد أخطاء الوصول الحقيقية.
</ParamField>
<ParamField path="label" type="string">
  تسمية مواجهة للمشغّل تُستخدم في نص الجلسة/اللافتة.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  يستأنف جلسة ACP موجودة بدلًا من إنشاء جلسة جديدة. يعيد
  الوكيل تشغيل سجل محادثته عبر `session/load`. يتطلب
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  يبث `"parent"` ملخصات تقدم تشغيل ACP الأولية مرة أخرى إلى
  جلسة الطالب كأحداث نظام. تتضمن الاستجابات المقبولة
  `streamLogPath` الذي يشير إلى سجل JSONL بنطاق الجلسة
  (`<sessionId>.acp-stream.jsonl`) يمكنك متابعته للاطلاع على سجل الترحيل الكامل.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  يُجهض دور ACP الفرعي بعد N ثانية. يُبقي `0` الدور على
  مسار بلا مهلة في Gateway. تُطبّق القيمة نفسها على تشغيل Gateway
  ووقت تشغيل ACP حتى لا تشغل أطر التشغيل المتوقفة/المستنفدة للحصة
  مسار الوكيل الأصل إلى أجل غير مسمى.
</ParamField>
<ParamField path="model" type="string">
  تجاوز نموذج صريح لجلسة ACP الفرعية. تطبّع عمليات إنشاء ACP في Codex
  مراجع OpenClaw Codex مثل `openai-codex/gpt-5.4` إلى إعدادات بدء Codex
  ACP قبل `session/new`؛ كما تضبط صيغ الشرطة المائلة مثل
  `openai-codex/gpt-5.4/high` جهد الاستدلال في Codex ACP.
  يجب أن تعلن أطر التشغيل الأخرى عن `models` في ACP وأن تدعم
  `session/set_model`؛ وإلا يفشل OpenClaw/acpx بوضوح بدلًا من
  الرجوع بصمت إلى الإعداد الافتراضي للوكيل الهدف.
</ParamField>
<ParamField path="thinking" type="string">
  جهد تفكير/استدلال صريح. بالنسبة إلى Codex ACP، يُطابق `minimal`
  الجهد المنخفض، وتُطابق `low`/`medium`/`high`/`xhigh` مباشرةً،
  بينما يحذف `off` تجاوز جهد الاستدلال عند بدء التشغيل.
</ParamField>

## أوضاع ربط الإنشاء والسلاسل

<Tabs>
  <Tab title="--bind here|off">
    | الوضع   | السلوك                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | اربط المحادثة النشطة الحالية في مكانها؛ وافشل إذا لم تكن هناك محادثة نشطة. |
    | `off`  | لا تنشئ ربطًا للمحادثة الحالية.                          |

    ملاحظات:

    - `--bind here` هو أبسط مسار للمشغّل من أجل "جعل هذه القناة أو الدردشة مدعومة بـ Codex."
    - لا ينشئ `--bind here` سلسلة فرعية.
    - يتوفر `--bind here` فقط على القنوات التي تكشف دعم ربط المحادثة الحالية.
    - لا يمكن دمج `--bind` و`--thread` في استدعاء `/acp spawn` نفسه.

  </Tab>
  <Tab title="--thread auto|here|off">
    | الوضع   | السلوك                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | داخل سلسلة نشطة: اربط تلك السلسلة. خارج السلسلة: أنشئ/اربط سلسلة فرعية عند دعم ذلك. |
    | `here` | يتطلب سلسلة نشطة حالية؛ ويفشل إذا لم تكن داخل واحدة.                                                  |
    | `off`  | بلا ربط. تبدأ الجلسة غير مرتبطة.                                                                 |

    ملاحظات:

    - على أسطح الربط غير السلسلية، يكون السلوك الافتراضي فعليًا `off`.
    - يتطلب إنشاء السلاسل المرتبطة دعم سياسة القناة:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - استخدم `--bind here` عندما تريد تثبيت المحادثة الحالية دون إنشاء سلسلة فرعية.

  </Tab>
</Tabs>

## نموذج التسليم

يمكن أن تكون جلسات ACP إما مساحات عمل تفاعلية أو عملًا في الخلفية
مملوكًا للأصل. يعتمد مسار التسليم على هذا الشكل.

<AccordionGroup>
  <Accordion title="جلسات ACP التفاعلية">
    تهدف الجلسات التفاعلية إلى مواصلة الحديث على سطح دردشة مرئي:

    - يربط `/acp spawn ... --bind here` المحادثة الحالية بجلسة ACP.
    - يربط `/acp spawn ... --thread ...` سلسلة/موضوع قناة بجلسة ACP.
    - توجّه ارتباطات `bindings[].type="acp"` المكوّنة والمستمرة المحادثات المطابقة إلى جلسة ACP نفسها.

    تُوجَّه رسائل المتابعة في المحادثة المرتبطة مباشرةً إلى
    جلسة ACP، ويُسلّم إخراج ACP مرة أخرى إلى
    القناة/السلسلة/الموضوع نفسه.

    ما يرسله OpenClaw إلى إطار التشغيل:

    - تُرسل المتابعات المرتبطة العادية كنص مطالبة، إضافةً إلى المرفقات فقط عندما يدعمها إطار التشغيل/الخلفية.
    - تُعترض أوامر إدارة `/acp` وأوامر Gateway المحلية قبل إرسال ACP.
    - تتحول أحداث الإكمال التي ينشئها وقت التشغيل إلى مادة بحسب كل هدف. تحصل وكلاء OpenClaw على ظرف سياق وقت التشغيل الداخلي في OpenClaw؛ وتحصل أطر ACP الخارجية على مطالبة عادية تتضمن نتيجة الفرع والتعليمات. يجب ألا يُرسل ظرف `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` الخام أبدًا إلى أطر التشغيل الخارجية أو يُحفظ كنص نسخة محادثة مستخدم في ACP.
    - تستخدم إدخالات نسخة ACP النص المرئي للمستخدم الذي أطلقها أو مطالبة الإكمال العادية. تبقى بيانات الأحداث الداخلية منظمة في OpenClaw حيثما أمكن، ولا تُعامل كمحتوى دردشة كتبه المستخدم.

  </Accordion>
  <Accordion title="جلسات ACP لمرة واحدة مملوكة للأصل">
    جلسات ACP لمرة واحدة التي ينشئها تشغيل وكيل آخر هي أبناء
    في الخلفية، على غرار الوكلاء الفرعيين:

    - يطلب الأصل العمل باستخدام `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - يعمل الفرع في جلسة إطار تشغيل ACP خاصة به.
    - تعمل أدوار الفرع على مسار الخلفية نفسه المستخدم لعمليات إنشاء الوكلاء الفرعيين الأصلية، لذا لا يحظر إطار ACP البطيء عمل الجلسة الرئيسية غير ذي الصلة.
    - تعود تقارير الإكمال عبر مسار إعلان إكمال المهمة. يحوّل OpenClaw بيانات الإكمال الداخلية إلى مطالبة ACP عادية قبل إرسالها إلى إطار تشغيل خارجي، بحيث لا ترى أطر التشغيل علامات سياق وقت التشغيل الخاصة بـ OpenClaw فقط.
    - يعيد الأصل صياغة نتيجة الفرع بصوت المساعد العادي عندما تكون الاستجابة المواجهة للمستخدم مفيدة.

    لا تعامل هذا المسار **كأنه** دردشة ندّية بين الأصل
    والفرع. لدى الفرع بالفعل قناة إكمال عائدة إلى
    الأصل.

  </Accordion>
  <Accordion title="sessions_send وتسليم A2A">
    يمكن لـ `sessions_send` استهداف جلسة أخرى بعد الإنشاء. بالنسبة إلى
    الجلسات النظيرة العادية، يستخدم OpenClaw مسار متابعة من وكيل إلى وكيل (A2A)
    بعد حقن الرسالة:

    - انتظر رد الجلسة الهدف.
    - اسمح اختياريًا للطالب والهدف بتبادل عدد محدود من أدوار المتابعة.
    - اطلب من الهدف إنتاج رسالة إعلان.
    - سلّم ذلك الإعلان إلى القناة أو السلسلة المرئية.

    مسار A2A هذا هو خيار احتياطي للإرسالات النظيرة حيث يحتاج المرسل إلى
    متابعة مرئية. يظل مفعّلًا عندما تستطيع جلسة غير ذات صلة
    رؤية هدف ACP ومراسلته، مثلًا ضمن إعدادات
    `tools.sessions.visibility` الواسعة.

    يتخطى OpenClaw متابعة A2A فقط عندما يكون الطالب هو
    أصل فرع ACP لمرة واحدة مملوك للأصل نفسه. في هذه الحالة،
    يمكن أن يؤدي تشغيل A2A فوق إكمال المهمة إلى إيقاظ الأصل بنتيجة
    الفرع، وتمرير رد الأصل مرة أخرى إلى الفرع، وإنشاء
    حلقة صدى بين الأصل والفرع. تُبلغ نتيجة `sessions_send`
    `delivery.status="skipped"` في حالة الفرع المملوك هذه لأن
    مسار الإكمال مسؤول بالفعل عن النتيجة.

  </Accordion>
  <Accordion title="استئناف جلسة موجودة">
    استخدم `resumeSessionId` لمتابعة جلسة ACP سابقة بدلًا من
    البدء من جديد. يعيد الوكيل تشغيل سجل محادثته عبر
    `session/load`، لذا يتابع بسياق كامل لما حدث سابقًا.

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
    - واصل جلسة برمجة بدأتها تفاعليًا في CLI، والآن بلا واجهة عبر وكيلك.
    - استأنف عملًا انقطع بسبب إعادة تشغيل gateway أو انتهاء مهلة الخمول.

    ملاحظات:

    - ينطبق `resumeSessionId` فقط عندما يكون `runtime: "acp"`؛ يتجاهل وقت تشغيل الوكيل الفرعي الافتراضي هذا الحقل الخاص بـ ACP فقط.
    - ينطبق `streamTo` فقط عندما يكون `runtime: "acp"`؛ يتجاهل وقت تشغيل الوكيل الفرعي الافتراضي هذا الحقل الخاص بـ ACP فقط.
    - `resumeSessionId` هو معرّف استئناف ACP/إطار تشغيل محلي للمضيف، وليس مفتاح جلسة قناة في OpenClaw؛ لا يزال OpenClaw يتحقق من سياسة إنشاء ACP وسياسة الوكيل الهدف قبل الإرسال، بينما تمتلك خلفية ACP أو إطار التشغيل صلاحية تحميل ذلك المعرّف العلوي.
    - يستعيد `resumeSessionId` سجل محادثة ACP العلوي؛ ويظل `thread` و`mode` مطبقين كالمعتاد على جلسة OpenClaw الجديدة التي تنشئها، لذا يظل `mode: "session"` يتطلب `thread: true`.
    - يجب أن يدعم الوكيل الهدف `session/load` (يدعمه Codex وClaude Code).
    - إذا لم يُعثر على معرّف الجلسة، يفشل الإنشاء بخطأ واضح - بلا رجوع صامت إلى جلسة جديدة.

  </Accordion>
  <Accordion title="اختبار دخان بعد النشر">
    بعد نشر gateway، شغّل فحصًا حيًا من طرف إلى طرف بدلًا من
    الوثوق باختبارات الوحدة:

    1. تحقّق من إصدار Gateway المنشور والالتزام على المضيف المستهدف.
    2. افتح جلسة جسر ACPX مؤقتة إلى وكيل حي.
    3. اطلب من ذلك الوكيل استدعاء `sessions_spawn` مع `runtime: "acp"` و`agentId: "codex"` و`mode: "run"` والمهمة `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. تحقّق من `accepted=yes` ووجود `childSessionKey` حقيقي ومن عدم وجود خطأ في أداة التحقق.
    5. نظّف جلسة الجسر المؤقتة.

    أبقِ البوابة على `mode: "run"` وتجاوز `streamTo: "parent"` -
    فمسارات `mode: "session"` المرتبطة بالسلاسل ومسارات ترحيل البث هي
    تمريرات تكامل أغنى ومنفصلة.

  </Accordion>
</AccordionGroup>

## توافق الصندوق المعزول

تعمل جلسات ACP حاليًا على وقت تشغيل المضيف، **وليس** داخل
الصندوق المعزول الخاص بـ OpenClaw.

<Warning>
**حدّ الأمان:**

- يمكن للحزمة الخارجية القراءة/الكتابة وفقًا لأذونات CLI الخاصة بها و`cwd` المحدد.
- سياسة الصندوق المعزول في OpenClaw **لا** تغلّف تنفيذ حزمة ACP.
- لا يزال OpenClaw يفرض بوابات ميزات ACP، والوكلاء المسموح بهم، وملكية الجلسات، وروابط القنوات، وسياسة تسليم Gateway.
- استخدم `runtime: "subagent"` للعمل الأصلي في OpenClaw والمفروض عليه الصندوق المعزول.

</Warning>

القيود الحالية:

- إذا كانت جلسة الطالب داخل صندوق معزول، تُحظر عمليات إنشاء ACP لكلٍّ من `sessions_spawn({ runtime: "acp" })` و`/acp spawn`.
- لا يدعم `sessions_spawn` مع `runtime: "acp"` الخيار `sandbox: "require"`.

## حلّ هدف الجلسة

تقبل معظم إجراءات `/acp` هدف جلسة اختياريًا (`session-key` أو
`session-id` أو `session-label`).

**ترتيب الحل:**

1. وسيطة الهدف الصريحة (أو `--session` لـ `/acp steer`)
   - تجرّب المفتاح
   - ثم معرّف جلسة على شكل UUID
   - ثم التسمية
2. ربط السلسلة الحالي (إذا كانت هذه المحادثة/السلسلة مرتبطة بجلسة ACP).
3. الرجوع إلى جلسة الطالب الحالية.

تشارك كلٌّ من روابط المحادثة الحالية وروابط السلسلة في
الخطوة 2.

إذا لم يُحل أي هدف، يعيد OpenClaw خطأ واضحًا
(`Unable to resolve session target: ...`).

## عناصر تحكم ACP

| الأمر                 | ما يفعله                                                  | مثال                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | إنشاء جلسة ACP؛ مع ربط حالي أو ربط سلسلة اختياري.        | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | إلغاء الدور الجاري لجلسة الهدف.                          | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | إرسال تعليمة توجيه إلى جلسة قيد التشغيل.                 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | إغلاق الجلسة وفك ربط أهداف السلسلة.                      | `/acp close`                                                  |
| `/acp status`        | عرض الخلفية، والوضع، والحالة، وخيارات وقت التشغيل، والإمكانات. | `/acp status`                                                 |
| `/acp set-mode`      | تعيين وضع وقت التشغيل لجلسة الهدف.                       | `/acp set-mode plan`                                          |
| `/acp set`           | كتابة خيار إعداد عام لوقت التشغيل.                       | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | تعيين تجاوز دليل العمل لوقت التشغيل.                     | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | تعيين ملف تعريف سياسة الموافقة.                          | `/acp permissions strict`                                     |
| `/acp timeout`       | تعيين مهلة وقت التشغيل (بالثواني).                       | `/acp timeout 120`                                            |
| `/acp model`         | تعيين تجاوز نموذج وقت التشغيل.                           | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | إزالة تجاوزات خيارات وقت تشغيل الجلسة.                   | `/acp reset-options`                                          |
| `/acp sessions`      | سرد جلسات ACP الحديثة من المخزن.                         | `/acp sessions`                                               |
| `/acp doctor`        | صحة الخلفية، والإمكانات، والإصلاحات القابلة للتنفيذ.     | `/acp doctor`                                                 |
| `/acp install`       | طباعة خطوات تثبيت وتمكين حتمية.                          | `/acp install`                                                |

يعرض `/acp status` خيارات وقت التشغيل الفعلية بالإضافة إلى معرّفات الجلسة
على مستوى وقت التشغيل ومستوى الخلفية. تظهر أخطاء عناصر التحكم غير المدعومة
بوضوح عندما تفتقر الخلفية إلى إمكانية. يقرأ `/acp sessions`
المخزن للجلسة المرتبطة الحالية أو جلسة الطالب؛ وتُحل رموز الهدف
(`session-key` أو `session-id` أو `session-label`) عبر
اكتشاف جلسات Gateway، بما في ذلك جذور `session.store` المخصصة لكل وكيل.

### تعيين خيارات وقت التشغيل

لدى `/acp` أوامر ملائمة ومُعيّن عام. العمليات المكافئة:

| الأمر                        | يُعيَّن إلى                            | ملاحظات                                                                                                                                                                        |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | مفتاح إعداد وقت التشغيل `model`      | بالنسبة إلى Codex ACP، يطبّع OpenClaw `openai-codex/<model>` إلى معرّف نموذج المهايئ ويعيّن لواحق التفكير بشرطة مائلة مثل `openai-codex/gpt-5.4/high` إلى `reasoning_effort`. |
| `/acp set thinking <level>`  | مفتاح إعداد وقت التشغيل `thinking`   | بالنسبة إلى Codex ACP، يرسل OpenClaw قيمة `reasoning_effort` المقابلة حيث يدعم المهايئ واحدة.                                                                                 |
| `/acp permissions <profile>` | مفتاح إعداد وقت التشغيل `approval_policy` | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | مفتاح إعداد وقت التشغيل `timeout`    | -                                                                                                                                                                              |
| `/acp cwd <path>`            | تجاوز cwd لوقت التشغيل               | تحديث مباشر.                                                                                                                                                                  |
| `/acp set <key> <value>`     | عام                                  | يستخدم `key=cwd` مسار تجاوز cwd.                                                                                                                                              |
| `/acp reset-options`         | يمسح كل تجاوزات وقت التشغيل          | -                                                                                                                                                                              |

## حزمة acpx، وإعداد Plugin، والأذونات

لإعداد حزمة acpx (الأسماء المستعارة لـ Claude Code / Codex / Gemini CLI)،
وجسور MCP الخاصة بأدوات Plugin وأدوات OpenClaw، وأوضاع أذونات ACP، راجع
[وكلاء ACP - الإعداد](/ar/tools/acp-agents-setup).

## استكشاف الأخطاء وإصلاحها

| العرض                                                                     | السبب المحتمل                                                                                                           | الإصلاح                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin الواجهة الخلفية مفقود أو معطّل أو محظور بواسطة `plugins.allow`.                                                       | ثبّت ومكّن Plugin الواجهة الخلفية، وأدرج `acpx` في `plugins.allow` عند ضبط قائمة السماح هذه، ثم شغّل `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP معطّل عموميًا.                                                                                                 | اضبط `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | الإرسال التلقائي من رسائل السلاسل العادية معطّل.                                                               | اضبط `acp.dispatch.enabled=true` لاستئناف توجيه السلاسل تلقائيًا؛ تظل استدعاءات `sessions_spawn({ runtime: "acp" })` الصريحة تعمل.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | الوكيل غير موجود في قائمة السماح.                                                                                                | استخدم `agentId` مسموحًا به أو حدّث `acp.allowedAgents`.                                                                                                                     |
| يبلّغ `/acp doctor` أن الواجهة الخلفية غير جاهزة مباشرة بعد بدء التشغيل                 | Plugin الواجهة الخلفية مفقود أو معطّل أو محظور بسياسة السماح/المنع، أو أن الملف التنفيذي المضبوط له غير متاح.        | ثبّت/مكّن Plugin الواجهة الخلفية، وأعد تشغيل `/acp doctor`، وافحص خطأ تثبيت الواجهة الخلفية أو السياسة إذا بقيت غير سليمة.                                           |
| لم يُعثر على أمر الحاضنة                                                   | لم تُثبّت CLI المهايئ، أو أن Plugin الخارجي مفقود، أو فشل جلب `npx` في التشغيل الأول لمهايئ غير Codex. | شغّل `/acp doctor`، وثبّت/حضّر المهايئ مسبقًا على مضيف Gateway، أو اضبط أمر وكيل acpx صراحةً.                                                      |
| خطأ عدم العثور على النموذج من الحاضنة                                            | معرّف النموذج صالح لمزوّد/حاضنة أخرى وليس لهدف ACP هذا.                                                | استخدم نموذجًا تسرده تلك الحاضنة، أو اضبط النموذج في الحاضنة، أو احذف التجاوز.                                                                            |
| خطأ مصادقة المورّد من الحاضنة                                          | OpenClaw سليم، لكن CLI/المزوّد الهدف لم يسجّل الدخول.                                                     | سجّل الدخول أو وفّر مفتاح المزوّد المطلوب في بيئة مضيف Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | رمز مفتاح/معرّف/تسمية غير صحيح.                                                                                                | شغّل `/acp sessions`، وانسخ المفتاح/التسمية بدقة، ثم أعد المحاولة.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | استُخدم `--bind here` بدون محادثة نشطة قابلة للربط.                                                            | انتقل إلى المحادثة/القناة الهدف وأعد المحاولة، أو استخدم إنشاءً غير مربوط.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | يفتقر المهايئ إلى قدرة ربط محادثة ACP الحالية.                                                             | استخدم `/acp spawn ... --thread ...` حيث يكون مدعومًا، أو اضبط `bindings[]` على المستوى الأعلى، أو انتقل إلى قناة مدعومة.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | استُخدم `--thread here` خارج سياق سلسلة.                                                                         | انتقل إلى السلسلة الهدف أو استخدم `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | مستخدم آخر يملك هدف الربط النشط.                                                                           | أعد الربط بصفتك المالك أو استخدم محادثة أو سلسلة مختلفة.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | يفتقر المهايئ إلى قدرة ربط السلاسل.                                                                               | استخدم `--thread off` أو انتقل إلى مهايئ/قناة مدعومة.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | تشغيل ACP يتم من جهة المضيف؛ جلسة الطالب داخل صندوق عزل.                                                              | استخدم `runtime="subagent"` من الجلسات المعزولة، أو شغّل إنشاء ACP من جلسة غير معزولة.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | طُلب `sandbox="require"` لتشغيل ACP.                                                                         | استخدم `runtime="subagent"` للعزل المطلوب، أو استخدم ACP مع `sandbox="inherit"` من جلسة غير معزولة.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | الحاضنة الهدف لا تعرض تبديل نماذج ACP العام.                                                        | استخدم حاضنة تعلن عن `models`/`session/set_model` في ACP، أو استخدم مراجع نماذج ACP في Codex، أو اضبط النموذج مباشرةً في الحاضنة إذا كان لها علم بدء تشغيل خاص بها. |
| بيانات ACP الوصفية مفقودة للجلسة المربوطة                                      | بيانات وصفية قديمة/محذوفة لجلسة ACP.                                                                                    | أعد إنشاءها باستخدام `/acp spawn`، ثم أعد ربط/تركيز السلسلة.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` يمنع الكتابة/التنفيذ في جلسة ACP غير تفاعلية.                                                    | اضبط `plugins.entries.acpx.config.permissionMode` على `approve-all` وأعد تشغيل Gateway. راجع [إعدادات الأذونات](/ar/tools/acp-agents-setup#permission-configuration). |
| تفشل جلسة ACP مبكرًا مع مخرجات قليلة                                  | مطالبات الأذونات محظورة بواسطة `permissionMode`/`nonInteractivePermissions`.                                        | تحقّق من سجلات Gateway بحثًا عن `AcpRuntimeError`. للأذونات الكاملة، اضبط `permissionMode=approve-all`؛ وللتدهور السلس، اضبط `nonInteractivePermissions=deny`.        |
| تتوقف جلسة ACP إلى أجل غير مسمى بعد إكمال العمل                       | انتهت عملية الحاضنة لكن جلسة ACP لم تبلغ عن الاكتمال.                                                    | حدّث OpenClaw؛ ينظّف acpx الحالي عمليات الغلاف والمهايئ القديمة المملوكة لـ OpenClaw عند الإغلاق وبدء تشغيل Gateway.                                             |
| ترى الحاضنة `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | تسرّب غلاف الأحداث الداخلي عبر حدود ACP.                                                                | حدّث OpenClaw وأعد تشغيل مسار الاكتمال؛ يجب أن تتلقى الحاضنات الخارجية مطالبات اكتمال عادية فقط.                                                          |

## ذو صلة

- [إعداد وكلاء ACP](/ar/tools/acp-agents-setup)
- [إرسال الوكيل](/ar/tools/agent-send)
- [واجهات CLI الخلفية](/ar/gateway/cli-backends)
- [حاضنة Codex](/ar/plugins/codex-harness)
- [أدوات صندوق عزل متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (وضع الجسر)](/ar/cli/acp)
- [الوكلاء الفرعيون](/ar/tools/subagents)
