---
read_when:
    - تشغيل بيئات البرمجة عبر ACP
    - إعداد جلسات ACP المرتبطة بالمحادثة على قنوات المراسلة
    - ربط محادثة قناة رسائل بجلسة ACP دائمة
    - استكشاف أخطاء الواجهة الخلفية لـ ACP أو ربط Plugin أو تسليم الإكمال وإصلاحها
    - تشغيل أوامر /acp من الدردشة
sidebarTitle: ACP agents
summary: شغّل أطر البرمجة الخارجية (Claude Code، Cursor، Gemini CLI، Codex ACP الصريح، OpenClaw ACP، OpenCode) عبر الواجهة الخلفية لـ ACP
title: وكلاء ACP
x-i18n:
    generated_at: "2026-05-02T07:43:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36a1c58b22d0f615e20e84fcdb15c39800825ee0bad64c966d6f14d44d3c1458
    source_path: tools/acp-agents.md
    workflow: 16
---

[بروتوكول عميل الوكيل (ACP)](https://agentclientprotocol.com/) جلسات
تتيح لـ OpenClaw تشغيل حزم ترميز خارجية (على سبيل المثال Pi وClaude Code
وCursor وCopilot وDroid وOpenClaw ACP وOpenCode وGemini CLI وحزم ACPX
الأخرى المدعومة) عبر Plugin خلفي لـ ACP.

يُتتبَّع كل إنشاء لجلسة ACP بوصفه [مهمة خلفية](/ar/automation/tasks).

<Note>
**ACP هو مسار الحزمة الخارجية، وليس مسار Codex الافتراضي.** يملك
Plugin خادم تطبيق Codex الأصلي عناصر التحكم `/codex ...` ووقت التشغيل
المضمّن `agentRuntime.id: "codex"`؛ بينما يملك ACP عناصر التحكم
`/acp ...` وجلسات `sessions_spawn({ runtime: "acp" })`.

إذا كنت تريد أن يتصل Codex أو Claude Code كعميل MCP خارجي
مباشرة بمحادثات قناة OpenClaw الحالية، فاستخدم
[`openclaw mcp serve`](/ar/cli/mcp) بدلاً من ACP.
</Note>

## أي صفحة أريد؟

| تريد أن…                                                                                       | استخدم هذا                            | ملاحظات                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ربط Codex أو التحكم به في المحادثة الحالية                                                     | `/codex bind`, `/codex threads`       | مسار خادم تطبيق Codex الأصلي عند تمكين Plugin `codex`؛ يتضمن ردود الدردشة المرتبطة، وتمرير الصور، والنموذج/السريع/الأذونات، والإيقاف، وعناصر التحكم في التوجيه. ACP احتياطي صريح |
| تشغيل Claude Code أو Gemini CLI أو Codex ACP صريح أو حزمة خارجية أخرى _عبر_ OpenClaw          | هذه الصفحة                            | جلسات مرتبطة بالدردشة، و`/acp spawn`، و`sessions_spawn({ runtime: "acp" })`، ومهام خلفية، وعناصر تحكم وقت التشغيل                                                                            |
| كشف جلسة OpenClaw Gateway _كخادم_ ACP لمحرر أو عميل                                            | [`openclaw acp`](/ar/cli/acp)            | وضع الجسر. يتحدث IDE/العميل ACP إلى OpenClaw عبر stdio/WebSocket                                                                                                                            |
| إعادة استخدام AI CLI محلي كنموذج احتياطي نصي فقط                                               | [واجهات CLI الخلفية](/ar/gateway/cli-backends) | ليس ACP. لا أدوات OpenClaw، ولا عناصر تحكم ACP، ولا وقت تشغيل للحزمة                                                                                                                        |

## هل يعمل هذا مباشرة؟

عادةً نعم. تأتي التثبيتات الجديدة مع Plugin وقت التشغيل المضمّن `acpx`
مفعلاً افتراضياً، وبثنائي `acpx` مثبت محلياً داخل Plugin يفحصه OpenClaw
ويصلحه ذاتياً فور أن يصبح مستمع HTTP الخاص بـ Gateway حياً. شغّل
`/acp doctor` لفحص الجاهزية.

لا يعلّم OpenClaw الوكلاء عن إنشاء ACP إلا عندما يكون ACP **قابلاً
للاستخدام فعلاً**: يجب أن يكون ACP مفعلاً، وألا يكون الإرسال معطلاً، وألا
تكون الجلسة الحالية محجوبة بصندوق الحماية، وأن تكون واجهة خلفية لوقت
التشغيل محملة. إذا لم تتحقق هذه الشروط، تبقى Skills الخاصة بـ ACP Plugin
وإرشادات `sessions_spawn` لـ ACP مخفية حتى لا يقترح الوكيل واجهة خلفية
غير متاحة.

<AccordionGroup>
  <Accordion title="ملاحظات التشغيل الأول">
    - إذا كان `plugins.allow` مضبوطاً، فهو مخزون Plugin تقييدي و**يجب** أن يتضمن `acpx`؛ وإلا فسيُحظر الافتراضي المضمّن عمداً ويبلغ `/acp doctor` عن إدخال قائمة السماح المفقود.
    - يُحضَّر محوّل Codex ACP المضمّن مع Plugin `acpx` ويُشغَّل محلياً عندما يكون ذلك ممكناً.
    - قد تظل محوّلات الحزم الهدف الأخرى تُجلب عند الطلب باستخدام `npx` في أول مرة تستخدمها فيها.
    - يجب أن تكون مصادقة المورّد موجودة على المضيف لتلك الحزمة.
    - إذا لم يكن لدى المضيف npm أو وصول إلى الشبكة، تفشل عمليات جلب المحوّل في التشغيل الأول حتى تُحمّى الذاكرات المؤقتة مسبقاً أو يُثبّت المحوّل بطريقة أخرى.

  </Accordion>
  <Accordion title="متطلبات وقت التشغيل">
    يطلق ACP عملية حزمة خارجية حقيقية. يملك OpenClaw التوجيه،
    وحالة المهمة الخلفية، والتسليم، والارتباطات، والسياسة؛ بينما تملك الحزمة
    تسجيل دخول المزوّد، وكتالوج النماذج، وسلوك نظام الملفات، والأدوات
    الأصلية الخاصة بها.

    قبل لوم OpenClaw، تحقق من:

    - أن `/acp doctor` يبلغ عن واجهة خلفية مفعلة وسليمة.
    - أن معرّف الهدف مسموح به عبر `acp.allowedAgents` عند ضبط قائمة السماح هذه.
    - أن أمر الحزمة يمكن أن يبدأ على مضيف Gateway.
    - أن مصادقة المزوّد موجودة لتلك الحزمة (`claude`, `codex`, `gemini`, `opencode`, `droid`, إلخ).
    - أن النموذج المحدد موجود لتلك الحزمة — معرّفات النماذج غير قابلة للنقل بين الحزم.
    - أن `cwd` المطلوب موجود ويمكن الوصول إليه، أو احذف `cwd` ودع الواجهة الخلفية تستخدم الافتراضي الخاص بها.
    - أن وضع الأذونات يطابق العمل. لا يمكن للجلسات غير التفاعلية النقر على مطالبات الأذونات الأصلية، لذلك تحتاج عمليات الترميز الثقيلة كتابةً/تنفيذاً عادةً إلى ملف تعريف أذونات ACPX يمكنه المتابعة دون واجهة.

  </Accordion>
</AccordionGroup>

لا تُعرَض أدوات OpenClaw Plugin وأدوات OpenClaw المدمجة على
حزم ACP افتراضياً. فعّل جسور MCP الصريحة في
[وكلاء ACP — الإعداد](/ar/tools/acp-agents-setup) فقط عندما ينبغي للحزمة
استدعاء تلك الأدوات مباشرة.

## أهداف الحزم المدعومة

مع الواجهة الخلفية `acpx` المضمّنة، استخدم معرّفات الحزم هذه كأهداف
`/acp spawn <id>` أو `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| معرّف الحزمة | الواجهة الخلفية المعتادة                         | ملاحظات                                                                            |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | محوّل Claude Code ACP                          | يتطلب مصادقة Claude Code على المضيف.                                               |
| `codex`    | محوّل Codex ACP                                | احتياطي ACP صريح فقط عندما يكون `/codex` الأصلي غير متاح أو عندما يُطلب ACP.       |
| `copilot`  | محوّل GitHub Copilot ACP                       | يتطلب مصادقة Copilot CLI/وقت التشغيل.                                             |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | تجاوز أمر acpx إذا كان تثبيت محلي يكشف نقطة دخول ACP مختلفة.                      |
| `droid`    | Factory Droid CLI                              | يتطلب مصادقة Factory/Droid أو `FACTORY_API_KEY` في بيئة الحزمة.                   |
| `gemini`   | محوّل Gemini CLI ACP                           | يتطلب مصادقة Gemini CLI أو إعداد مفتاح API.                                       |
| `iflow`    | iFlow CLI                                      | يعتمد توفر المحوّل والتحكم في النموذج على CLI المثبت.                             |
| `kilocode` | Kilo Code CLI                                  | يعتمد توفر المحوّل والتحكم في النموذج على CLI المثبت.                             |
| `kimi`     | Kimi/Moonshot CLI                              | يتطلب مصادقة Kimi/Moonshot على المضيف.                                            |
| `kiro`     | Kiro CLI                                       | يعتمد توفر المحوّل والتحكم في النموذج على CLI المثبت.                             |
| `opencode` | محوّل OpenCode ACP                             | يتطلب مصادقة OpenCode CLI/المزوّد.                                                |
| `openclaw` | جسر OpenClaw Gateway عبر `openclaw acp`        | يتيح لحزمة واعية بـ ACP التحدث مرة أخرى إلى جلسة OpenClaw Gateway.                |
| `pi`       | وقت تشغيل Pi/المضمّن في OpenClaw              | يُستخدم لتجارب الحزم الأصلية في OpenClaw.                                         |
| `qwen`     | Qwen Code / Qwen CLI                           | يتطلب مصادقة متوافقة مع Qwen على المضيف.                                          |

يمكن تكوين أسماء مستعارة لوكلاء acpx المخصصين في acpx نفسه، لكن سياسة
OpenClaw لا تزال تتحقق من `acp.allowedAgents` وأي ربط
`agents.list[].runtime.acp.agent` قبل الإرسال.

## دليل تشغيل المشغّل

تدفق `/acp` سريع من الدردشة:

<Steps>
  <Step title="إنشاء">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`، أو
    `/acp spawn codex --bind here` صريح.
  </Step>
  <Step title="العمل">
    تابع في المحادثة أو الخيط المرتبط (أو استهدف مفتاح الجلسة
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
    `/acp cancel` (الدور الحالي) أو `/acp close` (الجلسة + الارتباطات).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="تفاصيل دورة الحياة">
    - ينشئ الإنشاء جلسة وقت تشغيل ACP أو يستأنفها، ويسجل بيانات ACP الوصفية في مخزن جلسات OpenClaw، وقد ينشئ مهمة خلفية عندما يكون التشغيل مملوكاً للأصل.
    - تُعامل جلسات ACP المملوكة للأصل كعمل خلفي حتى عندما تكون جلسة وقت التشغيل مستمرة؛ يمر الإكمال والتسليم عبر الأسطح عبر مُخطِر المهمة الأصل بدلاً من التصرف كجلسة دردشة عادية موجهة للمستخدم.
    - تغلق صيانة المهام جلسات ACP ذات اللقطة الواحدة الطرفية أو اليتيمة المملوكة للأصل. تُحفظ جلسات ACP المستمرة ما دام ارتباط محادثة نشطاً باقياً؛ وتُغلق الجلسات المستمرة القديمة التي لا تملك ارتباطاً نشطاً حتى لا يمكن استئنافها بصمت بعد انتهاء المهمة المالكة أو اختفاء سجل مهمتها.
    - تذهب رسائل المتابعة المرتبطة مباشرة إلى جلسة ACP حتى يُغلق الارتباط أو يُزال تركيزه أو يُعاد ضبطه أو تنتهي صلاحيته.
    - تبقى أوامر Gateway محلية. لا تُرسل `/acp ...` و`/status` و`/unfocus` أبداً كنص مطالبة عادي إلى حزمة ACP مرتبطة.
    - يجهض `cancel` الدور النشط عندما تدعم الواجهة الخلفية الإلغاء؛ ولا يحذف الارتباط أو بيانات الجلسة الوصفية.
    - ينهي `close` جلسة ACP من وجهة نظر OpenClaw ويزيل الارتباط. قد تظل الحزمة تحتفظ بتاريخها الصاعد الخاص إذا كانت تدعم الاستئناف.
    - عمال وقت التشغيل الخاملون مؤهلون للتنظيف بعد `acp.runtime.ttlMinutes`؛ وتبقى بيانات الجلسة الوصفية المخزنة متاحة لـ `/acp sessions`.

  </Accordion>
  <Accordion title="قواعد توجيه Codex الأصلية">
    المشغلات باللغة الطبيعية التي ينبغي أن تُوجَّه إلى
    **Codex Plugin الأصلي** عند تمكينه:

    - "Bind this Discord channel to Codex."
    - "Attach this chat to Codex thread `<id>`."
    - "Show Codex threads, then bind this one."

    ربط محادثات Codex الأصلي هو مسار التحكم بالدردشة الافتراضي.
    لا تزال أدوات OpenClaw الديناميكية تُنفَّذ عبر OpenClaw، بينما
    تُنفَّذ أدوات Codex الأصلية مثل shell/apply-patch داخل Codex.
    بالنسبة إلى أحداث أدوات Codex الأصلية، يحقن OpenClaw مرحّل خطاف
    أصلي لكل دور كي تتمكن خطافات Plugin من حظر `before_tool_call`،
    ومراقبة `after_tool_call`، وتوجيه أحداث Codex `PermissionRequest`
    عبر موافقات OpenClaw. تُرحَّل خطافات Codex `Stop` إلى
    OpenClaw `before_agent_finalize`، حيث يمكن لـ plugins طلب مرور
    نموذجي إضافي قبل أن ينجز Codex إجابته. يبقى المرحّل محافظاً عمداً:
    فهو لا يغيّر وسائط أدوات Codex الأصلية ولا يعيد كتابة سجلات خيوط
    Codex. استخدم ACP الصريح فقط عندما تريد نموذج وقت تشغيل/جلسة ACP.
    حُدود دعم Codex المضمّن موثقة في
    [عقد دعم حزمة Codex v1](/ar/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="ورقة مرجعية لاختيار النموذج / المزوّد / وقت التشغيل">
    - `openai-codex/*` — مسار PI Codex عبر OAuth/الاشتراك.
    - `openai/*` مع `agentRuntime.id: "codex"` — وقت تشغيل Codex أصلي مضمّن في خادم التطبيق.
    - `/codex ...` — تحكم أصلي في محادثة Codex.
    - `/acp ...` أو `runtime: "acp"` — تحكم صريح في ACP/acpx.

  </Accordion>
  <Accordion title="مشغلات اللغة الطبيعية لتوجيه ACP">
    مشغلات ينبغي أن توجّه إلى وقت تشغيل ACP:

    - "شغّل هذا كجلسة Claude Code ACP لمرة واحدة ولخّص النتيجة."
    - "استخدم Gemini CLI لهذه المهمة في سلسلة، ثم أبقِ المتابعات في السلسلة نفسها."
    - "شغّل Codex عبر ACP في سلسلة خلفية."

    يختار OpenClaw `runtime: "acp"`، ويحلّ حاضنة `agentId`،
    ويرتبط بالمحادثة أو السلسلة الحالية عندما يكون ذلك مدعوماً، و
    يوجّه المتابعات إلى تلك الجلسة حتى الإغلاق/انتهاء الصلاحية. يتبع Codex هذا
    المسار فقط عندما يكون ACP/acpx صريحاً أو عندما يكون Plugin Codex الأصلي
    غير متاح للعملية المطلوبة.

    بالنسبة إلى `sessions_spawn`، لا يُعلَن عن `runtime: "acp"` إلا عندما يكون ACP
    مفعلاً، ولا يكون الطالب ضمن صندوق عزل، ويكون خلفية وقت تشغيل ACP
    محمّلة. يوقف `acp.dispatch.enabled=false` إرسال سلاسل ACP التلقائي
    مؤقتاً لكنه لا يخفي أو يحظر استدعاءات
    `sessions_spawn({ runtime: "acp" })` الصريحة. يستهدف معرّفات حاضنات ACP مثل `codex`،
    أو `claude`، أو `droid`، أو `gemini`، أو `opencode`. لا تمرّر معرّف وكيل
    عادي من إعدادات OpenClaw من `agents_list` إلا إذا كان هذا الإدخال
    مهيأً صراحةً باستخدام `agents.list[].runtime.type="acp"`؛
    وإلا فاستخدم وقت تشغيل الوكيل الفرعي الافتراضي. عندما يكون وكيل OpenClaw
    مهيأً مع `runtime.type="acp"`، يستخدم OpenClaw
    `runtime.acp.agent` كمعرّف الحاضنة الأساسي.

  </Accordion>
</AccordionGroup>

## ACP مقابل الوكلاء الفرعيين

استخدم ACP عندما تريد وقت تشغيل حاضنة خارجي. استخدم **خادم تطبيق Codex
الأصلي** لربط/التحكم في محادثة Codex عندما يكون Plugin `codex`
مفعلاً. استخدم **الوكلاء الفرعيين** عندما تريد تشغيلات مفوّضة
أصلية من OpenClaw.

| المجال        | جلسة ACP                              | تشغيل وكيل فرعي                    |
| ------------- | ------------------------------------- | ---------------------------------- |
| وقت التشغيل   | Plugin خلفية ACP (مثلاً acpx)         | وقت تشغيل وكيل فرعي أصلي من OpenClaw |
| مفتاح الجلسة  | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| الأوامر الرئيسية | `/acp ...`                         | `/subagents ...`                   |
| أداة الإنشاء  | `sessions_spawn` مع `runtime:"acp"`   | `sessions_spawn` (وقت التشغيل الافتراضي) |

راجع أيضاً [الوكلاء الفرعيين](/ar/tools/subagents).

## كيف يشغّل ACP ‏Claude Code

بالنسبة إلى Claude Code عبر ACP، يكون المكدس كالتالي:

1. مستوى التحكم في جلسة ACP في OpenClaw.
2. Plugin وقت تشغيل `acpx` المضمّن.
3. محوّل Claude ACP.
4. آليات وقت التشغيل/الجلسة من جهة Claude.

Claude عبر ACP هو **جلسة حاضنة** مزودة بعناصر تحكم ACP، واستئناف جلسة،
وتتبّع مهام خلفية، وربط اختياري بالمحادثة/السلسلة.

خلفيات CLI هي أوقات تشغيل احتياطية محلية نصية فقط منفصلة — راجع
[خلفيات CLI](/ar/gateway/cli-backends).

بالنسبة إلى المشغّلين، القاعدة العملية هي:

- **تريد `/acp spawn`، أو جلسات قابلة للربط، أو عناصر تحكم وقت التشغيل، أو عمل حاضنة مستمر؟** استخدم ACP.
- **تريد احتياطياً نصياً محلياً بسيطاً عبر CLI الخام؟** استخدم خلفيات CLI.

## الجلسات المرتبطة

### النموذج الذهني

- **سطح الدردشة** — حيث يواصل الأشخاص الحديث (قناة Discord، موضوع Telegram، دردشة iMessage).
- **جلسة ACP** — حالة وقت تشغيل Codex/Claude/Gemini المستمرة التي يوجّه OpenClaw إليها.
- **سلسلة/موضوع فرعي** — سطح مراسلة إضافي اختياري يُنشأ فقط بواسطة `--thread ...`.
- **مساحة عمل وقت التشغيل** — موقع نظام الملفات (`cwd`، نسخة المستودع، مساحة عمل الخلفية) حيث تعمل الحاضنة. مستقل عن سطح الدردشة.

### روابط المحادثة الحالية

يثبّت `/acp spawn <harness> --bind here` المحادثة الحالية على
جلسة ACP المُنشأة — بلا سلسلة فرعية، وعلى سطح الدردشة نفسه. يواصل OpenClaw
امتلاك النقل، والمصادقة، والسلامة، والتسليم. تُوجّه رسائل المتابعة في تلك
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
    - يعمل `--bind here` فقط على القنوات التي تعلن دعم ربط المحادثة الحالية؛ وإلا يعيد OpenClaw رسالة واضحة تفيد بعدم الدعم. تستمر الروابط عبر إعادة تشغيل Gateway.
    - في Discord، يتحكم `spawnSessions` في إنشاء السلاسل الفرعية لـ `--thread auto|here` — وليس `--bind here`.
    - إذا أنشأت جلسة إلى وكيل ACP مختلف دون `--cwd`، يرث OpenClaw مساحة عمل **الوكيل الهدف** افتراضياً. تعود المسارات الموروثة المفقودة (`ENOENT`/`ENOTDIR`) إلى القيمة الافتراضية للخلفية؛ وتظهر أخطاء الوصول الأخرى (مثل `EACCES`) كأخطاء إنشاء.
    - تبقى أوامر إدارة Gateway محلية في المحادثات المرتبطة — تتعامل OpenClaw مع أوامر `/acp ...` حتى عندما يوجَّه نص المتابعة العادي إلى جلسة ACP المرتبطة؛ كما يبقى `/status` و`/unfocus` محليين أيضاً كلما كان التعامل مع الأوامر مفعلاً لذلك السطح.

  </Accordion>
  <Accordion title="الجلسات المرتبطة بالسلاسل">
    عندما تكون روابط السلاسل مفعلة لمحوّل قناة:

    - يربط OpenClaw سلسلة بجلسة ACP مستهدفة.
    - تُوجّه رسائل المتابعة في تلك السلسلة إلى جلسة ACP المرتبطة.
    - يُسلَّم خرج ACP مرة أخرى إلى السلسلة نفسها.
    - يزيل إلغاء التركيز/الإغلاق/الأرشفة/مهلة الخمول أو انتهاء الحد الأقصى للعمر الربط.
    - `/acp close`، و`/acp cancel`، و`/acp status`، و`/status`، و`/unfocus` هي أوامر Gateway، وليست مطالبات لحاضنة ACP.

    أعلام الميزات المطلوبة لـ ACP المرتبط بالسلاسل:

    - `acp.enabled=true`
    - يكون `acp.dispatch.enabled` مفعلاً افتراضياً (اضبطه على `false` لإيقاف إرسال سلاسل ACP التلقائي مؤقتاً؛ تظل استدعاءات `sessions_spawn({ runtime: "acp" })` الصريحة تعمل).
    - إنشاء جلسات السلاسل في محوّل القناة مفعّل (افتراضياً: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    دعم ربط السلاسل خاص بكل محوّل. إذا كان محوّل القناة النشط
    لا يدعم روابط السلاسل، يعيد OpenClaw رسالة واضحة تفيد بعدم
    الدعم/عدم التوفر.

  </Accordion>
  <Accordion title="القنوات الداعمة للسلاسل">
    - أي محوّل قناة يكشف قدرة ربط الجلسات/السلاسل.
    - الدعم المضمّن الحالي: سلاسل/قنوات **Discord**، وموضوعات **Telegram** (موضوعات المنتدى في المجموعات/المجموعات الفائقة وموضوعات الرسائل الخاصة).
    - يمكن لقنوات Plugin إضافة الدعم عبر واجهة الربط نفسها.

  </Accordion>
</AccordionGroup>

## روابط القنوات المستمرة

بالنسبة إلى سير العمل غير العابر، هيّئ روابط ACP مستمرة في
إدخالات `bindings[]` على المستوى الأعلى.

### نموذج الربط

<ParamField path="bindings[].type" type='"acp"'>
  يحدد ربط محادثة ACP مستمراً.
</ParamField>
<ParamField path="bindings[].match" type="object">
  يحدد المحادثة الهدف. الأشكال بحسب القناة:

- **قناة/سلسلة Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **موضوع منتدى Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **رسالة خاصة/مجموعة BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. يفضّل استخدام `chat_id:*` أو `chat_identifier:*` لروابط المجموعات المستقرة.
- **رسالة خاصة/مجموعة iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. يفضّل استخدام `chat_id:*` لروابط المجموعات المستقرة.

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
- تُوجّه الرسائل في تلك القناة أو ذلك الموضوع إلى جلسة ACP المهيأة.
- في المحادثات المرتبطة، يعيد `/new` و`/reset` ضبط مفتاح جلسة ACP نفسه في مكانه.
- تظل روابط وقت التشغيل المؤقتة (مثل تلك التي تنشئها تدفقات تركيز السلاسل) مطبقة حيثما وُجدت.
- بالنسبة إلى إنشاءات ACP عبر الوكلاء دون `cwd` صريح، يرث OpenClaw مساحة عمل الوكيل الهدف من إعدادات الوكيل.
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
    القيمة الافتراضية لـ `runtime` هي `subagent`، لذا عيّن `runtime: "acp"` صراحةً
    لجلسات ACP. إذا حُذف `agentId`، يستخدم OpenClaw
    `acp.defaultAgent` عند تكوينه. يتطلب `mode: "session"`
    `thread: true` للإبقاء على محادثة مرتبطة ومستمرة.
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
  المطالبة الأولية المرسلة إلى جلسة ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  يجب أن تكون `"acp"` لجلسات ACP.
</ParamField>
<ParamField path="agentId" type="string">
  معرّف حزمة تشغيل ACP المستهدفة. يعود إلى `acp.defaultAgent` إذا كان معيّنًا.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  اطلب تدفق ربط سلسلة المحادثة حيثما يكون مدعومًا.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` لتنفيذ لمرة واحدة؛ و`"session"` جلسة مستمرة. إذا كان `thread: true` وكان
  `mode` محذوفًا، فقد يختار OpenClaw السلوك المستمر افتراضيًا حسب
  مسار بيئة التشغيل. يتطلب `mode: "session"` وجود `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  دليل العمل المطلوب لبيئة التشغيل (تتحقق منه سياسة الخلفية/بيئة التشغيل).
  إذا حُذف، يرث إنشاء ACP مساحة عمل الوكيل المستهدف
  عند تكوينها؛ وتعود المسارات الموروثة المفقودة إلى إعدادات الخلفية
  الافتراضية، بينما تُرجع أخطاء الوصول الفعلية كما هي.
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
  يبث `"parent"` ملخصات تقدم تشغيل ACP الأولية مرة أخرى إلى
  جلسة الطالب كأحداث نظام. تتضمن الاستجابات المقبولة
  `streamLogPath` الذي يشير إلى سجل JSONL مقيّد بنطاق الجلسة
  (`<sessionId>.acp-stream.jsonl`) يمكنك متابعته للاطلاع على سجل الترحيل الكامل.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  يوقف دور ACP الفرعي بعد N ثانية. تبقي القيمة `0` الدور على
  مسار Gateway بلا مهلة. تُطبّق القيمة نفسها على تشغيل Gateway
  وبيئة تشغيل ACP حتى لا تشغل حزم التشغيل المتوقفة/المستنفدة للحصة
  مسار الوكيل الأصل إلى أجل غير مسمى.
</ParamField>
<ParamField path="model" type="string">
  تجاوز صريح للنموذج لجلسة ACP الفرعية. تقوم عمليات إنشاء Codex ACP
  بتطبيع مراجع OpenClaw Codex مثل `openai-codex/gpt-5.4` إلى تكوين
  بدء Codex ACP قبل `session/new`؛ كما تضبط صيغ slash مثل
  `openai-codex/gpt-5.4/high` جهد الاستدلال في Codex ACP.
  يجب أن تعلن حزم التشغيل الأخرى عن `models` في ACP وأن تدعم
  `session/set_model`؛ وإلا يفشل OpenClaw/acpx بوضوح بدلًا من
  الرجوع بصمت إلى الإعداد الافتراضي للوكيل المستهدف.
</ParamField>
<ParamField path="thinking" type="string">
  جهد تفكير/استدلال صريح. في Codex ACP، تُطابق `minimal` الجهد
  المنخفض، وتُطابق `low`/`medium`/`high`/`xhigh` مباشرةً، أما `off`
  فيحذف تجاوز جهد الاستدلال عند بدء التشغيل.
</ParamField>

## أوضاع ربط الإنشاء وسلاسل المحادثة

<Tabs>
  <Tab title="--bind here|off">
    | الوضع   | السلوك                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | اربط المحادثة النشطة الحالية في مكانها؛ وافشل إذا لم تكن هناك محادثة نشطة. |
    | `off`  | لا تُنشئ ربطًا للمحادثة الحالية.                          |

    ملاحظات:

    - `--bind here` هو أبسط مسار للمشغّل من أجل "اجعل هذه القناة أو الدردشة مدعومة من Codex."
    - لا ينشئ `--bind here` سلسلة محادثة فرعية.
    - يتوفر `--bind here` فقط على القنوات التي تكشف دعم ربط المحادثة الحالية.
    - لا يمكن الجمع بين `--bind` و`--thread` في استدعاء `/acp spawn` نفسه.

  </Tab>
  <Tab title="--thread auto|here|off">
    | الوضع   | السلوك                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | داخل سلسلة محادثة نشطة: اربط تلك السلسلة. خارج سلسلة محادثة: أنشئ/اربط سلسلة محادثة فرعية عند الدعم. |
    | `here` | اشترط وجود سلسلة المحادثة النشطة الحالية؛ وافشل إذا لم تكن داخل واحدة.                                                  |
    | `off`  | بلا ربط. تبدأ الجلسة غير مرتبطة.                                                                 |

    ملاحظات:

    - على الأسطح التي لا تدعم ربط سلاسل المحادثة، يكون السلوك الافتراضي فعليًا `off`.
    - يتطلب الإنشاء المرتبط بسلسلة محادثة دعم سياسة القناة:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - استخدم `--bind here` عندما تريد تثبيت المحادثة الحالية دون إنشاء سلسلة محادثة فرعية.

  </Tab>
</Tabs>

## نموذج التسليم

يمكن أن تكون جلسات ACP إما مساحات عمل تفاعلية أو عملًا في الخلفية
مملوكًا للأصل. يعتمد مسار التسليم على هذا الشكل.

<AccordionGroup>
  <Accordion title="جلسات ACP التفاعلية">
    صُممت الجلسات التفاعلية لمواصلة الحديث على سطح دردشة مرئي:

    - يربط `/acp spawn ... --bind here` المحادثة الحالية بجلسة ACP.
    - يربط `/acp spawn ... --thread ...` سلسلة/موضوع قناة بجلسة ACP.
    - توجه عمليات الربط المستمرة المكونة `bindings[].type="acp"` المحادثات المطابقة إلى جلسة ACP نفسها.

    تُوجّه رسائل المتابعة في المحادثة المرتبطة مباشرةً إلى
    جلسة ACP، ويُسلّم خرج ACP مرة أخرى إلى القناة/السلسلة/الموضوع
    نفسه.

    ما يرسله OpenClaw إلى حزمة التشغيل:

    - تُرسل المتابعات المرتبطة العادية كنص مطالبة، مع المرفقات فقط عندما تدعمها حزمة التشغيل/الخلفية.
    - تُعترض أوامر إدارة `/acp` وأوامر Gateway المحلية قبل إرسال ACP.
    - تتحول أحداث الإكمال المولدة من بيئة التشغيل إلى صيغة مادية لكل هدف. تتلقى وكلاء OpenClaw غلاف سياق بيئة التشغيل الداخلي في OpenClaw؛ وتتلقى حزم تشغيل ACP الخارجية مطالبة عادية تتضمن نتيجة الفرع والتعليمة. لا ينبغي أبدًا إرسال غلاف `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` الخام إلى حزم التشغيل الخارجية أو حفظه كنص مستخدم في سجل ACP.
    - تستخدم إدخالات سجل ACP نص المشغّل المرئي للمستخدم أو مطالبة الإكمال العادية. تبقى بيانات تعريف الحدث الداخلية منظمة في OpenClaw حيثما أمكن ولا تُعامل كمحتوى دردشة كتبه المستخدم.

  </Accordion>
  <Accordion title="جلسات ACP لمرة واحدة مملوكة للأصل">
    جلسات ACP لمرة واحدة التي ينشئها تشغيل وكيل آخر هي فروع
    في الخلفية، مشابهة للوكلاء الفرعيين:

    - يطلب الأصل العمل عبر `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - يعمل الفرع داخل جلسة حزمة تشغيل ACP الخاصة به.
    - تعمل أدوار الفرع على مسار الخلفية نفسه المستخدم من قبل إنشاء الوكلاء الفرعيين الأصليين، لذلك لا تمنع حزمة تشغيل ACP البطيئة عمل الجلسة الرئيسية غير المرتبط.
    - يُعاد تقرير الإكمال عبر مسار إعلان إكمال المهمة. يحوّل OpenClaw بيانات تعريف الإكمال الداخلية إلى مطالبة ACP عادية قبل إرسالها إلى حزمة تشغيل خارجية، بحيث لا ترى حزم التشغيل علامات سياق بيئة التشغيل الخاصة بـ OpenClaw فقط.
    - يعيد الأصل صياغة نتيجة الفرع بصوت المساعد العادي عندما تكون الاستجابة الموجهة للمستخدم مفيدة.

    **لا** تعامل هذا المسار كدردشة ندية بين الأصل
    والفرع. لدى الفرع بالفعل قناة إكمال عائدة إلى
    الأصل.

  </Accordion>
  <Accordion title="sessions_send وتسليم A2A">
    يمكن لـ `sessions_send` استهداف جلسة أخرى بعد الإنشاء. بالنسبة إلى
    الجلسات الندية العادية، يستخدم OpenClaw مسار متابعة من وكيل إلى وكيل
    (A2A) بعد حقن الرسالة:

    - انتظر رد الجلسة المستهدفة.
    - اختياريًا، اسمح للطالب والهدف بتبادل عدد محدود من أدوار المتابعة.
    - اطلب من الهدف إنتاج رسالة إعلان.
    - سلّم ذلك الإعلان إلى القناة أو السلسلة المرئية.

    مسار A2A هذا هو خيار احتياطي للإرسال إلى الأقران عندما يحتاج المرسل إلى
    متابعة مرئية. يبقى مفعّلًا عندما تستطيع جلسة غير مرتبطة
    رؤية هدف ACP ومراسلته، مثلًا ضمن إعدادات
    `tools.sessions.visibility` الواسعة.

    يتخطى OpenClaw متابعة A2A فقط عندما يكون الطالب هو
    أصل فرع ACP لمرة واحدة المملوك للأصل نفسه. في هذه الحالة،
    يمكن أن يؤدي تشغيل A2A فوق إكمال المهمة إلى إيقاظ الأصل بنتيجة
    الفرع، وتمرير رد الأصل مرة أخرى إلى الفرع، وإنشاء
    حلقة صدى بين الأصل والفرع. تُبلغ نتيجة `sessions_send` عن
    `delivery.status="skipped"` في حالة الفرع المملوك هذه لأن
    مسار الإكمال مسؤول بالفعل عن النتيجة.

  </Accordion>
  <Accordion title="استئناف جلسة موجودة">
    استخدم `resumeSessionId` لمتابعة جلسة ACP سابقة بدلًا من
    البدء من جديد. يعيد الوكيل تشغيل سجل محادثته عبر
    `session/load`، لذلك يستأنف بسياق كامل لما حدث سابقًا.

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
    - تابع جلسة برمجة بدأتها تفاعليًا في CLI، والآن بلا واجهة عبر وكيلك.
    - استأنف عملًا قاطعه إعادة تشغيل Gateway أو انتهاء مهلة الخمول.

    ملاحظات:

    - ينطبق `resumeSessionId` فقط عندما يكون `runtime: "acp"`؛ وتتجاهل بيئة تشغيل الوكيل الفرعي الافتراضية هذا الحقل الخاص بـ ACP فقط.
    - ينطبق `streamTo` فقط عندما يكون `runtime: "acp"`؛ وتتجاهل بيئة تشغيل الوكيل الفرعي الافتراضية هذا الحقل الخاص بـ ACP فقط.
    - `resumeSessionId` هو معرّف استئناف ACP/حزمة تشغيل محلي للمضيف، وليس مفتاح جلسة قناة OpenClaw؛ يظل OpenClaw يتحقق من سياسة إنشاء ACP وسياسة الوكيل المستهدف قبل الإرسال، بينما تمتلك خلفية ACP أو حزمة التشغيل التفويض لتحميل ذلك المعرّف العلوي.
    - يستعيد `resumeSessionId` سجل محادثة ACP العلوي؛ ولا يزال `thread` و`mode` ينطبقان بشكل طبيعي على جلسة OpenClaw الجديدة التي تنشئها، لذلك يظل `mode: "session"` يتطلب `thread: true`.
    - يجب أن يدعم الوكيل المستهدف `session/load` (يدعمه Codex وClaude Code).
    - إذا لم يُعثر على معرّف الجلسة، يفشل الإنشاء بخطأ واضح — ولا يوجد رجوع صامت إلى جلسة جديدة.

  </Accordion>
  <Accordion title="اختبار دخان بعد النشر">
    بعد نشر Gateway، شغّل فحصًا حيًا من البداية إلى النهاية بدلًا من
    الثقة باختبارات الوحدة:

    1. تحقق من إصدار Gateway المنشور والالتزام على المضيف المستهدف.
    2. افتح جلسة جسر ACPX مؤقتة إلى وكيل حي.
    3. اطلب من ذلك الوكيل استدعاء `sessions_spawn` مع `runtime: "acp"` و`agentId: "codex"` و`mode: "run"` والمهمة `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. تحقق من `accepted=yes`، ووجود `childSessionKey` حقيقي، وعدم وجود خطأ تحقق.
    5. نظّف جلسة الجسر المؤقتة.

    أبقِ البوابة على `mode: "run"` وتخطَّ `streamTo: "parent"` —
    فمسارات `mode: "session"` المرتبطة بسلسلة المحادثة ومسارات ترحيل البث
    تمريرات تكامل أكثر ثراءً ومنفصلة.

  </Accordion>
</AccordionGroup>

## توافق Sandbox

تعمل جلسات ACP حاليًا على بيئة تشغيل المضيف، **وليس** داخل
Sandbox الخاص بـ OpenClaw.

<Warning>
**حد الأمان:**

- يمكن لأداة الاختبار الخارجية القراءة/الكتابة وفقًا لأذونات CLI الخاصة بها و`cwd` المحدد.
- سياسة صندوق العزل في OpenClaw **لا** تغلّف تنفيذ أداة ACP.
- لا يزال OpenClaw يفرض بوابات ميزات ACP، والوكلاء المسموحين، وملكية الجلسة، وارتباطات القنوات، وسياسة التسليم عبر Gateway.
- استخدم `runtime: "subagent"` للعمل الأصلي في OpenClaw الخاضع لإنفاذ صندوق العزل.

</Warning>

القيود الحالية:

- إذا كانت جلسة الطالب داخل صندوق عزل، فسيتم حظر عمليات إنشاء ACP لكل من `sessions_spawn({ runtime: "acp" })` و`/acp spawn`.
- لا يدعم `sessions_spawn` مع `runtime: "acp"` الخيار `sandbox: "require"`.

## تحديد هدف الجلسة

تقبل معظم إجراءات `/acp` هدف جلسة اختياريًا (`session-key` أو
`session-id` أو `session-label`).

**ترتيب الحل:**

1. وسيطة الهدف الصريحة (أو `--session` من أجل `/acp steer`)
   - يجرّب المفتاح
   - ثم معرّف جلسة على هيئة UUID
   - ثم التسمية
2. ارتباط سلسلة المحادثة الحالية (إذا كانت هذه المحادثة/السلسلة مرتبطة بجلسة ACP).
3. الرجوع إلى جلسة الطالب الحالية.

تشارك ارتباطات المحادثة الحالية وارتباطات السلاسل في
الخطوة 2.

إذا لم يتم حل أي هدف، يعيد OpenClaw خطأ واضحًا
(`Unable to resolve session target: ...`).

## عناصر تحكم ACP

| الأمر                | ما يفعله                                                  | مثال                                                         |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| `/acp spawn`         | ينشئ جلسة ACP؛ مع ارتباط حالي أو ارتباط سلسلة اختياري.   | `/acp spawn codex --bind here --cwd /repo`                   |
| `/acp cancel`        | يلغي الدور الجاري لجلسة الهدف.                           | `/acp cancel agent:codex:acp:<uuid>`                         |
| `/acp steer`         | يرسل تعليمة توجيه إلى جلسة قيد التشغيل.                  | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | يغلق الجلسة ويفك ارتباط أهداف السلسلة.                   | `/acp close`                                                 |
| `/acp status`        | يعرض الخلفية، والوضع، والحالة، وخيارات وقت التشغيل، والقدرات. | `/acp status`                                                |
| `/acp set-mode`      | يضبط وضع وقت التشغيل لجلسة الهدف.                        | `/acp set-mode plan`                                         |
| `/acp set`           | يكتب خيار إعداد عام لوقت التشغيل.                        | `/acp set model openai/gpt-5.4`                              |
| `/acp cwd`           | يضبط تجاوز دليل العمل لوقت التشغيل.                      | `/acp cwd /Users/user/Projects/repo`                         |
| `/acp permissions`   | يضبط ملف سياسة الموافقة.                                 | `/acp permissions strict`                                    |
| `/acp timeout`       | يضبط مهلة وقت التشغيل (بالثواني).                         | `/acp timeout 120`                                           |
| `/acp model`         | يضبط تجاوز نموذج وقت التشغيل.                            | `/acp model anthropic/claude-opus-4-6`                       |
| `/acp reset-options` | يزيل تجاوزات خيارات وقت تشغيل الجلسة.                    | `/acp reset-options`                                         |
| `/acp sessions`      | يسرد جلسات ACP الحديثة من المخزن.                        | `/acp sessions`                                              |
| `/acp doctor`        | يعرض صحة الخلفية، والقدرات، وإصلاحات قابلة للتنفيذ.      | `/acp doctor`                                                |
| `/acp install`       | يطبع خطوات التثبيت والتمكين الحتمية.                     | `/acp install`                                               |

يعرض `/acp status` خيارات وقت التشغيل الفعالة بالإضافة إلى معرّفات الجلسة على مستوى وقت التشغيل
ومستوى الخلفية. تظهر أخطاء عناصر التحكم غير المدعومة
بوضوح عندما تفتقر الخلفية إلى قدرة ما. يقرأ `/acp sessions`
المخزن للجلسة الحالية المرتبطة أو جلسة الطالب؛ ويتم حل رموز الهدف
(`session-key` أو `session-id` أو `session-label`) عبر
اكتشاف جلسات Gateway، بما في ذلك جذور `session.store`
المخصصة لكل وكيل.

### تعيين خيارات وقت التشغيل

يوفر `/acp` أوامر ملائمة ومُعيّنًا عامًا. العمليات
المكافئة:

| الأمر                        | يعيّن إلى                            | ملاحظات                                                                                                                                                                        |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | مفتاح إعداد وقت التشغيل `model`      | بالنسبة إلى Codex ACP، يطبّع OpenClaw القيمة `openai-codex/<model>` إلى معرّف نموذج المحوّل ويربط لواحق الاستدلال بشرطة مائلة مثل `openai-codex/gpt-5.4/high` بـ`reasoning_effort`. |
| `/acp set thinking <level>`  | مفتاح إعداد وقت التشغيل `thinking`   | بالنسبة إلى Codex ACP، يرسل OpenClaw قيمة `reasoning_effort` المقابلة حيث يدعم المحوّل ذلك.                                                                                  |
| `/acp permissions <profile>` | مفتاح إعداد وقت التشغيل `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | مفتاح إعداد وقت التشغيل `timeout`    | —                                                                                                                                                                              |
| `/acp cwd <path>`            | تجاوز cwd لوقت التشغيل               | تحديث مباشر.                                                                                                                                                                  |
| `/acp set <key> <value>`     | عام                                  | يستخدم `key=cwd` مسار تجاوز cwd.                                                                                                                                              |
| `/acp reset-options`         | يمسح جميع تجاوزات وقت التشغيل        | —                                                                                                                                                                              |

## أداة acpx، وإعداد Plugin، والأذونات

لإعداد أداة acpx (أسماء Claude Code / Codex / Gemini CLI
المستعارة)، وجسور plugin-tools وOpenClaw-tools MCP، وأوضاع أذونات
ACP، راجع
[وكلاء ACP — الإعداد](/ar/tools/acp-agents-setup).

## استكشاف الأخطاء وإصلاحها

| العرض                                                                     | السبب المحتمل                                                                                                           | الإصلاح                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin الواجهة الخلفية مفقود أو معطل أو محظور بواسطة `plugins.allow`.                                                       | ثبّت Plugin الواجهة الخلفية وفعّله، وأدرج `acpx` في `plugins.allow` عند ضبط قائمة السماح تلك، ثم شغّل `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP معطّل عموميًا.                                                                                                 | اضبط `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | التع dispatch التلقائي من رسائل السلسلة العادية معطّل.                                                               | اضبط `acp.dispatch.enabled=true` لاستئناف توجيه السلسلة التلقائي؛ ستظل استدعاءات `sessions_spawn({ runtime: "acp" })` الصريحة تعمل.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | الوكيل غير موجود في قائمة السماح.                                                                                                | استخدم `agentId` مسموحًا به أو حدّث `acp.allowedAgents`.                                                                                                                     |
| يبلغ `/acp doctor` أن الواجهة الخلفية غير جاهزة مباشرة بعد بدء التشغيل                 | Plugin الواجهة الخلفية مفقود أو معطّل أو محظور بسياسة السماح/الرفض، أو أن الملف التنفيذي المضبوط له غير متاح.        | ثبّت/فعّل Plugin الواجهة الخلفية، وأعد تشغيل `/acp doctor`، وافحص خطأ تثبيت الواجهة الخلفية أو السياسة إذا ظل غير سليم.                                           |
| أمر الحاضنة غير موجود                                                   | CLI المحوّل غير مثبت، أو Plugin الخارجي مفقود، أو فشل جلب `npx` في التشغيل الأول لمحوّل غير Codex. | شغّل `/acp doctor`، وثبّت/مهّد المحوّل على مضيف Gateway، أو اضبط أمر وكيل acpx صراحةً.                                                      |
| خطأ عدم العثور على النموذج من الحاضنة                                            | معرّف النموذج صالح لمزوّد/حاضنة أخرى لكن ليس لهدف ACP هذا.                                                | استخدم نموذجًا مدرجًا بواسطة تلك الحاضنة، أو اضبط النموذج في الحاضنة، أو احذف التجاوز.                                                                            |
| خطأ مصادقة المورّد من الحاضنة                                          | OpenClaw سليم، لكن CLI/المزوّد الهدف لم يسجل الدخول.                                                     | سجّل الدخول أو وفّر مفتاح المزوّد المطلوب في بيئة مضيف Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | رمز مفتاح/معرّف/تسمية غير صحيح.                                                                                                | شغّل `/acp sessions`، وانسخ المفتاح/التسمية بدقة، ثم أعد المحاولة.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | استُخدم `--bind here` من دون محادثة نشطة قابلة للربط.                                                            | انتقل إلى الدردشة/القناة الهدف وأعد المحاولة، أو استخدم إنشاءً غير مرتبط.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | يفتقر المحوّل إلى إمكانية ربط ACP بالمحادثة الحالية.                                                             | استخدم `/acp spawn ... --thread ...` حيث يكون ذلك مدعومًا، أو اضبط `bindings[]` على المستوى الأعلى، أو انتقل إلى قناة مدعومة.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | استُخدم `--thread here` خارج سياق سلسلة.                                                                         | انتقل إلى السلسلة الهدف أو استخدم `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | يملك مستخدم آخر هدف الربط النشط.                                                                           | أعد الربط بصفة المالك أو استخدم محادثة أو سلسلة مختلفة.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | يفتقر المحوّل إلى إمكانية ربط السلاسل.                                                                               | استخدم `--thread off` أو انتقل إلى محوّل/قناة مدعومين.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | وقت تشغيل ACP موجود على جانب المضيف؛ جلسة الطالب محصورة في sandbox.                                                              | استخدم `runtime="subagent"` من الجلسات المحصورة في sandbox، أو شغّل إنشاء ACP من جلسة غير محصورة في sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | طُلب `sandbox="require"` لوقت تشغيل ACP.                                                                         | استخدم `runtime="subagent"` عند الحاجة إلى sandbox إلزامي، أو استخدم ACP مع `sandbox="inherit"` من جلسة غير محصورة في sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | لا تكشف الحاضنة الهدف تبديل نماذج ACP العام.                                                        | استخدم حاضنة تعلن عن ACP `models`/`session/set_model`، أو استخدم مراجع نماذج Codex ACP، أو اضبط النموذج مباشرةً في الحاضنة إذا كان لديها علم بدء تشغيل خاص بها. |
| بيانات ACP الوصفية مفقودة للجلسة المرتبطة                                      | بيانات وصفية قديمة/محذوفة لجلسة ACP.                                                                                    | أعد إنشاءها باستخدام `/acp spawn`، ثم أعد ربط/تركيز السلسلة.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | يحظر `permissionMode` الكتابة/التنفيذ في جلسة ACP غير التفاعلية.                                                    | اضبط `plugins.entries.acpx.config.permissionMode` على `approve-all` وأعد تشغيل Gateway. راجع [إعدادات الأذونات](/ar/tools/acp-agents-setup#permission-configuration). |
| تفشل جلسة ACP مبكرًا مع مخرجات قليلة                                  | مطالبات الأذونات محظورة بواسطة `permissionMode`/`nonInteractivePermissions`.                                        | افحص سجلات Gateway بحثًا عن `AcpRuntimeError`. للأذونات الكاملة، اضبط `permissionMode=approve-all`؛ وللتدهور السلس، اضبط `nonInteractivePermissions=deny`.        |
| تتوقف جلسة ACP إلى أجل غير مسمى بعد إكمال العمل                       | انتهت عملية الحاضنة لكن جلسة ACP لم تبلّغ عن الاكتمال.                                                    | راقب باستخدام `ps aux \| grep acpx`؛ أنهِ العمليات القديمة يدويًا.                                                                                                       |
| ترى الحاضنة `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | تسرّب غلاف الحدث الداخلي عبر حد ACP.                                                                | حدّث OpenClaw وأعد تشغيل تدفق الإكمال؛ يجب أن تتلقى الحاضنات الخارجية مطالبات إكمال عادية فقط.                                                          |

## ذات صلة

- [وكلاء ACP — الإعداد](/ar/tools/acp-agents-setup)
- [إرسال الوكيل](/ar/tools/agent-send)
- [واجهات CLI الخلفية](/ar/gateway/cli-backends)
- [حاضنة Codex](/ar/plugins/codex-harness)
- [أدوات sandbox متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (وضع الجسر)](/ar/cli/acp)
- [الوكلاء الفرعيون](/ar/tools/subagents)
