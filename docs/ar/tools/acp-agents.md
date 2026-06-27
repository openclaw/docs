---
read_when:
    - تشغيل حاضنات البرمجة عبر ACP
    - إعداد جلسات ACP المرتبطة بالمحادثة على قنوات المراسلة
    - ربط محادثة قناة رسائل بجلسة ACP مستمرة
    - استكشاف أخطاء الواجهة الخلفية لـ ACP أو توصيل Plugin أو تسليم الإكمال وإصلاحها
    - تشغيل أوامر /acp من الدردشة
sidebarTitle: ACP agents
summary: شغّل أحزمة البرمجة الخارجية (Claude Code، Cursor، Gemini CLI، Codex ACP الصريح، OpenClaw ACP، OpenCode) عبر الواجهة الخلفية لـ ACP
title: وكلاء ACP
x-i18n:
    generated_at: "2026-06-27T18:38:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9ad2fd3dec35062209b5e66a3ec301e8fa247d10a48787e54b938b10b314aee
    source_path: tools/acp-agents.md
    workflow: 16
---

جلسات [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
تتيح لـ OpenClaw تشغيل أحزمة الترميز الخارجية (مثل Claude Code و
Cursor و Copilot و Droid و OpenClaw ACP و OpenCode و Gemini CLI وغيرها من
أحزمة ACPX المدعومة) من خلال Plugin خلفية ACP.

يُتتبَّع كل إنشاء لجلسة ACP بصفته [مهمة خلفية](/ar/automation/tasks).

<Note>
**ACP هو مسار الحزام الخارجي، وليس مسار Codex الافتراضي.** يمتلك
Plugin خادم تطبيق Codex الأصلي عناصر التحكم `/codex ...` ووقت التشغيل
المضمّن الافتراضي `openai/gpt-*` لدورات الوكيل؛ ويمتلك ACP عناصر التحكم
`/acp ...` وجلسات `sessions_spawn({ runtime: "acp" })`.

إذا كنت تريد أن يتصل Codex أو Claude Code كعميل MCP خارجي مباشرة
بمحادثات قنوات OpenClaw الحالية، فاستخدم
[`openclaw mcp serve`](/ar/cli/mcp) بدلًا من ACP.
</Note>

## أي صفحة أريد؟

| تريد أن…                                                                                       | استخدم هذا                            | ملاحظات                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ربط Codex أو التحكم به في المحادثة الحالية                                                     | `/codex bind`, `/codex threads`       | مسار خادم تطبيق Codex الأصلي عندما يكون Plugin `codex` مفعّلًا؛ يتضمن ردود الدردشة المربوطة، وتمرير الصور، والنموذج/السريع/الأذونات، والإيقاف، وعناصر التحكم في التوجيه. ACP هو رجوع صريح |
| تشغيل Claude Code أو Gemini CLI أو Codex ACP صريح أو حزام خارجي آخر _من خلال_ OpenClaw          | هذه الصفحة                            | جلسات مربوطة بالدردشة، و`/acp spawn`، و`sessions_spawn({ runtime: "acp" })`، ومهام خلفية، وعناصر تحكم وقت التشغيل                                                                                   |
| عرض جلسة OpenClaw Gateway _كخادم_ ACP لمحرر أو عميل                                             | [`openclaw acp`](/ar/cli/acp)            | وضع الجسر. يتحدث IDE/العميل ببروتوكول ACP إلى OpenClaw عبر stdio/WebSocket                                                                                                                          |
| إعادة استخدام CLI ذكاء اصطناعي محلي كنموذج رجوع نصي فقط                                        | [خلفيات CLI](/ar/gateway/cli-backends) | ليس ACP. لا توجد أدوات OpenClaw، ولا عناصر تحكم ACP، ولا وقت تشغيل للحزام                                                                                                                           |

## هل يعمل هذا مباشرة دون إعداد إضافي؟

نعم، بعد تثبيت Plugin وقت تشغيل ACP الرسمي:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

يمكن لنسخ المصدر استخدام Plugin مساحة العمل المحلي `extensions/acpx` بعد
`pnpm install`. شغّل `/acp doctor` لفحص الجاهزية.

لا يعلّم OpenClaw الوكلاء عن إنشاء ACP إلا عندما يكون ACP **قابلًا
للاستخدام فعلًا**: يجب أن يكون ACP مفعّلًا، ويجب ألا يكون الإرسال
معطّلًا، ويجب ألا تكون الجلسة الحالية محجوبة بسبب الصندوق الرملي، ويجب
تحميل خلفية وقت تشغيل. إذا لم تتحقق هذه الشروط، تبقى Skills الخاصة بـ
Plugin ACP وإرشادات ACP لـ `sessions_spawn` مخفية حتى لا يقترح الوكيل
خلفية غير متاحة.

<AccordionGroup>
  <Accordion title="ملاحظات التشغيل الأول">
    - إذا كان `plugins.allow` مضبوطًا، فهو مخزون plugins تقييدي و**يجب** أن يتضمن `acpx`؛ وإلا فسيُحظر Plugin خلفية ACP المثبّت عمدًا، ويبلغ `/acp doctor` عن إدخال قائمة السماح المفقود.
    - يُجهَّز محوّل Codex ACP مع Plugin `acpx` ويُشغَّل محليًا عند الإمكان.
    - يعمل Codex ACP باستخدام `CODEX_HOME` معزول؛ ينسخ OpenClaw إدخالات المشاريع الموثوقة إضافة إلى إعدادات توجيه النموذج/الموفر الآمنة من إعدادات Codex المضيف، بينما تبقى المصادقة والإشعارات والخطافات على إعدادات المضيف.
    - قد تظل محوّلات الأحزمة الهدف الأخرى تُجلب عند الطلب باستخدام `npx` في أول مرة تستخدمها.
    - يجب أن تظل مصادقة المورّد موجودة على المضيف لذلك الحزام.
    - إذا لم يكن لدى المضيف npm أو وصول إلى الشبكة، فستفشل عمليات جلب المحوّلات في التشغيل الأول إلى أن تُحمّى ذاكرات التخزين المؤقت مسبقًا أو يُثبَّت المحوّل بطريقة أخرى.

  </Accordion>
  <Accordion title="متطلبات وقت التشغيل">
    يشغّل ACP عملية حزام خارجي حقيقية. يمتلك OpenClaw التوجيه،
    وحالة مهام الخلفية، والتسليم، والربط، والسياسة؛ ويمتلك الحزام
    تسجيل دخوله إلى الموفّر، وكتالوج النماذج، وسلوك نظام الملفات،
    وأدواته الأصلية.

    قبل لوم OpenClaw، تحقق من الآتي:

    - يبلغ `/acp doctor` عن خلفية مفعّلة وسليمة.
    - يكون معرّف الهدف مسموحًا به عبر `acp.allowedAgents` عند ضبط قائمة السماح هذه.
    - يمكن لأمر الحزام أن يبدأ على مضيف Gateway.
    - توجد مصادقة الموفّر لذلك الحزام (`claude`, `codex`, `gemini`, `opencode`, `droid`, إلخ).
    - النموذج المحدد موجود لذلك الحزام - معرّفات النماذج ليست قابلة للنقل بين الأحزمة.
    - المسار المطلوب `cwd` موجود ويمكن الوصول إليه، أو احذف `cwd` ودع الخلفية تستخدم افتراضيها.
    - يطابق وضع الأذونات العمل. لا تستطيع الجلسات غير التفاعلية النقر على مطالبات الأذونات الأصلية، لذلك تحتاج عمليات الترميز الكثيفة في الكتابة/التنفيذ عادة إلى ملف أذونات ACPX يمكنه المتابعة دون واجهة تفاعلية.

  </Accordion>
</AccordionGroup>

لا تُعرَض أدوات OpenClaw الخاصة بـ plugins ولا أدوات OpenClaw المدمجة
لأحزمة ACP افتراضيًا. فعّل جسور MCP الصريحة في
[وكلاء ACP - الإعداد](/ar/tools/acp-agents-setup) فقط عندما ينبغي للحزام
استدعاء تلك الأدوات مباشرة.

## أهداف الأحزمة المدعومة

مع خلفية `acpx`، استخدم معرّفات الأحزمة هذه كأهداف `/acp spawn <id>`
أو `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| معرّف الحزام | الخلفية المعتادة                               | ملاحظات                                                                            |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | محوّل Claude Code ACP                          | يتطلب مصادقة Claude Code على المضيف.                                                |
| `codex`    | محوّل Codex ACP                                | رجوع ACP صريح فقط عندما لا يكون `/codex` الأصلي متاحًا أو عند طلب ACP.             |
| `copilot`  | محوّل GitHub Copilot ACP                       | يتطلب مصادقة CLI/وقت تشغيل Copilot.                                                 |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | تجاوز أمر acpx إذا كان تثبيت محلي يعرض نقطة دخول ACP مختلفة.                       |
| `droid`    | Factory Droid CLI                              | يتطلب مصادقة Factory/Droid أو `FACTORY_API_KEY` في بيئة الحزام.                    |
| `gemini`   | محوّل Gemini CLI ACP                           | يتطلب مصادقة Gemini CLI أو إعداد مفتاح API.                                        |
| `iflow`    | iFlow CLI                                      | يعتمد توفر المحوّل والتحكم في النموذج على CLI المثبّت.                              |
| `kilocode` | Kilo Code CLI                                  | يعتمد توفر المحوّل والتحكم في النموذج على CLI المثبّت.                              |
| `kimi`     | Kimi/Moonshot CLI                              | يتطلب مصادقة Kimi/Moonshot على المضيف.                                              |
| `kiro`     | Kiro CLI                                       | يعتمد توفر المحوّل والتحكم في النموذج على CLI المثبّت.                              |
| `opencode` | محوّل OpenCode ACP                             | يتطلب مصادقة OpenCode CLI/الموفّر.                                                  |
| `openclaw` | جسر OpenClaw Gateway من خلال `openclaw acp`    | يتيح لحزام واعٍ بـ ACP التحدث مجددًا إلى جلسة OpenClaw Gateway.                    |
| `qwen`     | Qwen Code / Qwen CLI                           | يتطلب مصادقة متوافقة مع Qwen على المضيف.                                            |

يمكن تكوين أسماء مستعارة لوكلاء acpx مخصصة في acpx نفسه، لكن سياسة OpenClaw
ما زالت تتحقق من `acp.allowedAgents` وأي تعيين
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
    `/acp cancel` (الدورة الحالية) أو `/acp close` (الجلسة + الروابط).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="تفاصيل دورة الحياة">
    - ينشئ الإنشاء جلسة وقت تشغيل ACP أو يستأنفها، ويسجل بيانات ACP الوصفية في مخزن جلسات OpenClaw، وقد ينشئ مهمة خلفية عندما يكون التشغيل مملوكًا للأصل.
    - تُعامل جلسات ACP المملوكة للأصل كعمل في الخلفية حتى عندما تكون جلسة وقت التشغيل مستمرة؛ يمر الإكمال والتسليم عبر الأسطح عبر منبّه المهمة الأصل بدلًا من التصرف كجلسة دردشة عادية مواجهة للمستخدم.
    - تغلق صيانة المهام جلسات ACP أحادية التشغيل النهائية أو اليتيمة المملوكة للأصل. تُحفظ جلسات ACP المستمرة ما دام ربط محادثة نشطًا باقيًا؛ وتُغلق الجلسات المستمرة القديمة دون ربط نشط حتى لا يمكن استئنافها بصمت بعد انتهاء المهمة المالكة أو اختفاء سجل مهمتها.
    - تنتقل رسائل المتابعة المربوطة مباشرة إلى جلسة ACP إلى أن يُغلق الربط أو يُلغى تركيزه أو يُعاد ضبطه أو تنتهي صلاحيته.
    - تبقى أوامر Gateway محلية. لا تُرسل `/acp ...` و`/status` و`/unfocus` أبدًا كنص مطالبة عادي إلى حزام ACP مربوط.
    - يجهض `cancel` الدورة النشطة عندما تدعم الخلفية الإلغاء؛ ولا يحذف الربط أو بيانات الجلسة الوصفية.
    - ينهي `close` جلسة ACP من وجهة نظر OpenClaw ويزيل الربط. قد يظل الحزام يحتفظ بسجله العلوي الخاص إذا كان يدعم الاستئناف.
    - ينظف Plugin acpx أشجار عمليات الغلاف والمحوّلات المملوكة لـ OpenClaw بعد `close`، ويحصد أيتام ACPX القديمة المملوكة لـ OpenClaw أثناء بدء تشغيل Gateway.
    - يكون عمّال وقت التشغيل الخاملون مؤهلين للتنظيف بعد `acp.runtime.ttlMinutes`؛ وتبقى بيانات الجلسة الوصفية المخزنة متاحة لـ `/acp sessions`.

  </Accordion>
  <Accordion title="قواعد توجيه Codex الأصلية">
    محفزات اللغة الطبيعية التي ينبغي أن تُوجَّه إلى **Plugin Codex
    الأصلي** عندما يكون مفعّلًا:

    - "اربط قناة Discord هذه بـ Codex."
    - "أرفق هذه الدردشة بسلسلة Codex `<id>`."
    - "اعرض سلاسل Codex، ثم اربط هذه."

    ربط محادثة Codex الأصلي هو مسار التحكم في الدردشة الافتراضي.
    لا تزال أدوات OpenClaw الديناميكية تُنفَّذ عبر OpenClaw، بينما
    تُنفَّذ الأدوات الأصلية في Codex مثل shell/apply-patch داخل Codex.
    بالنسبة إلى أحداث الأدوات الأصلية في Codex، يحقن OpenClaw ترحيل
    hook أصليًا لكل دور بحيث يمكن لخطافات Plugin حظر `before_tool_call`، ومراقبة
    `after_tool_call`، وتوجيه أحداث `PermissionRequest` في Codex
    عبر موافقات OpenClaw. تُرحَّل خطافات `Stop` في Codex إلى
    `before_agent_finalize` في OpenClaw، حيث يمكن للـ plugins طلب
    تمريرة نموذج أخرى قبل أن يُنهي Codex إجابته. يبقى الترحيل
    محافظًا عمدًا: فهو لا يغيّر وسائط الأدوات الأصلية في Codex
    ولا يعيد كتابة سجلات سلاسل Codex. استخدم ACP الصريح فقط
    عندما تريد نموذج تشغيل/جلسة ACP. تم توثيق حدود دعم Codex
    المضمّن في
    [عقد دعم مشغّل Codex v1](/ar/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="ورقة مختصرة لاختيار النموذج / المزوّد / وقت التشغيل">
    - مراجع نماذج Codex القديمة - مسار نموذج OAuth/الاشتراك القديم في Codex الذي يصلحه doctor.
    - `openai/*` - وقت تشغيل خادم تطبيق Codex الأصلي المضمّن لدورات وكيل OpenAI.
    - `/codex ...` - التحكم الأصلي في محادثة Codex.
    - `/acp ...` أو `runtime: "acp"` - تحكم ACP/acpx صريح.

  </Accordion>
  <Accordion title="مشغلات اللغة الطبيعية للتوجيه عبر ACP">
    المشغلات التي يجب أن تُوجَّه إلى وقت تشغيل ACP:

    - "شغّل هذا كجلسة Claude Code ACP لمرة واحدة ولخّص النتيجة."
    - "استخدم Gemini CLI لهذه المهمة في سلسلة، ثم أبقِ المتابعات في السلسلة نفسها."
    - "شغّل Codex عبر ACP في سلسلة خلفية."

    يختار OpenClaw `runtime: "acp"`، ويحلّ `agentId` الخاص بالمشغّل،
    ويرتبط بالمحادثة أو السلسلة الحالية عند دعم ذلك، ويوجّه
    المتابعات إلى تلك الجلسة حتى الإغلاق/انتهاء الصلاحية. يتبع Codex
    هذا المسار فقط عندما يكون ACP/acpx صريحًا أو عندما لا يكون Plugin
    Codex الأصلي متاحًا للعملية المطلوبة.

    بالنسبة إلى `sessions_spawn`، يُعلَن `runtime: "acp"` فقط عندما يكون ACP
    مفعّلًا، ولا يكون الطالب داخل sandbox، ويكون backend وقت تشغيل ACP
    محمّلًا. يوقف `acp.dispatch.enabled=false` الإرسال التلقائي
    لسلاسل ACP مؤقتًا لكنه لا يخفي أو يحظر استدعاءات
    `sessions_spawn({ runtime: "acp" })` الصريحة. يستهدف معرّفات مشغّلات ACP مثل `codex`،
    `claude`، `droid`، `gemini`، أو `opencode`. لا تمرّر معرّف وكيل
    OpenClaw عاديًا من `agents_list` إلا إذا كان ذلك الإدخال
    مهيأً صراحةً باستخدام `agents.list[].runtime.type="acp"`؛
    وإلا فاستخدم وقت تشغيل الوكيل الفرعي الافتراضي. عندما يكون وكيل OpenClaw
    مهيأً باستخدام `runtime.type="acp"`، يستخدم OpenClaw
    `runtime.acp.agent` كمعرّف المشغّل الأساسي.

  </Accordion>
</AccordionGroup>

## ACP مقابل الوكلاء الفرعيين

استخدم ACP عندما تريد وقت تشغيل مشغّل خارجيًا. استخدم **خادم تطبيق Codex
الأصلي** لربط/التحكم في محادثة Codex عندما يكون Plugin `codex`
مفعّلًا. استخدم **الوكلاء الفرعيين** عندما تريد تشغيلات مفوّضة
أصلية في OpenClaw.

| المجال          | جلسة ACP                           | تشغيل وكيل فرعي                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| وقت التشغيل       | Plugin backend لـ ACP (مثل acpx) | وقت تشغيل وكيل فرعي أصلي في OpenClaw  |
| مفتاح الجلسة   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| الأوامر الرئيسية | `/acp ...`                            | `/subagents ...`                   |
| أداة الإنشاء    | `sessions_spawn` مع `runtime:"acp"` | `sessions_spawn` (وقت التشغيل الافتراضي) |

راجع أيضًا [الوكلاء الفرعيون](/ar/tools/subagents).

## كيف يشغّل ACP Claude Code

بالنسبة إلى Claude Code عبر ACP، تكون الحزمة:

1. مستوى التحكم في جلسة ACP في OpenClaw.
2. Plugin وقت التشغيل الرسمي `@openclaw/acpx`.
3. محوّل Claude ACP.
4. آليات وقت التشغيل/الجلسة في جهة Claude.

ACP Claude هو **جلسة مشغّل** مع عناصر تحكم ACP، واستئناف الجلسة،
وتتبع المهام الخلفية، وربط اختياري بالمحادثة/السلسلة.

تكون backends CLI أوقات تشغيل احتياطية محلية نصية فقط منفصلة - راجع
[CLI Backends](/ar/gateway/cli-backends).

بالنسبة إلى المشغّلين، القاعدة العملية هي:

- **هل تريد `/acp spawn`، أو جلسات قابلة للربط، أو عناصر تحكم وقت التشغيل، أو عمل مشغّل مستمرًا؟** استخدم ACP.
- **هل تريد احتياطًا نصيًا محليًا بسيطًا عبر CLI الخام؟** استخدم backends CLI.

## الجلسات المرتبطة

### النموذج الذهني

- **سطح الدردشة** - المكان الذي يواصل فيه الأشخاص الحديث (قناة Discord، موضوع Telegram، دردشة iMessage).
- **جلسة ACP** - حالة وقت تشغيل Codex/Claude/Gemini الدائمة التي يوجّه إليها OpenClaw.
- **السلسلة/الموضوع الفرعي** - سطح مراسلة إضافي اختياري يُنشأ فقط بواسطة `--thread ...`.
- **مساحة عمل وقت التشغيل** - موقع نظام الملفات (`cwd`، نسخة repo، مساحة عمل backend) حيث يعمل المشغّل. مستقل عن سطح الدردشة.

### روابط المحادثة الحالية

يثبّت `/acp spawn <harness> --bind here` المحادثة الحالية على
جلسة ACP التي تم إنشاؤها - بلا سلسلة فرعية، وعلى سطح الدردشة نفسه. يستمر OpenClaw
في امتلاك النقل، والمصادقة، والسلامة، والتسليم. تُوجَّه رسائل المتابعة في تلك
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
    - يعمل `--bind here` فقط على القنوات التي تعلن دعم ربط المحادثة الحالية؛ وإلا يعيد OpenClaw رسالة واضحة بأن ذلك غير مدعوم. تستمر الروابط عبر إعادات تشغيل Gateway.
    - في Discord، يتحكم `spawnSessions` في إنشاء السلاسل الفرعية لـ `--thread auto|here` - وليس `--bind here`.
    - إذا أنشأت جلسة إلى وكيل ACP مختلف من دون `--cwd`، يرث OpenClaw مساحة عمل **الوكيل الهدف** افتراضيًا. تعود المسارات الموروثة المفقودة (`ENOENT`/`ENOTDIR`) إلى backend الافتراضي؛ أما أخطاء الوصول الأخرى (مثل `EACCES`) فتظهر كأخطاء إنشاء.
    - تبقى أوامر إدارة Gateway محلية في المحادثات المرتبطة - تعالج OpenClaw أوامر `/acp ...` حتى عندما يُوجَّه نص المتابعة العادي إلى جلسة ACP المرتبطة؛ ويبقى `/status` و`/unfocus` محليين أيضًا كلما كان التعامل مع الأوامر مفعّلًا لذلك السطح.

  </Accordion>
  <Accordion title="الجلسات المرتبطة بالسلاسل">
    عندما تكون روابط السلاسل مفعّلة لمحوّل قناة:

    - يربط OpenClaw سلسلة بجلسة ACP هدف.
    - تُوجَّه رسائل المتابعة في تلك السلسلة إلى جلسة ACP المرتبطة.
    - يُسلَّم خرج ACP إلى السلسلة نفسها.
    - يزيل إلغاء التركيز/الإغلاق/الأرشفة/مهلة الخمول أو انتهاء الحد الأقصى للعمر الربط.
    - `/acp close` و`/acp cancel` و`/acp status` و`/status` و`/unfocus` هي أوامر Gateway، وليست مطالبات إلى مشغّل ACP.

    أعلام الميزات المطلوبة لـ ACP المرتبط بالسلاسل:

    - `acp.enabled=true`
    - يكون `acp.dispatch.enabled` مفعّلًا افتراضيًا (اضبط `false` لإيقاف الإرسال التلقائي لسلاسل ACP مؤقتًا؛ لا تزال استدعاءات `sessions_spawn({ runtime: "acp" })` الصريحة تعمل).
    - تمكين إنشاء جلسات سلاسل محوّل القناة (الافتراضي: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    دعم ربط السلاسل خاص بالمحوّل. إذا كان محوّل القناة النشط
    لا يدعم روابط السلاسل، يعيد OpenClaw رسالة واضحة
    بأن ذلك غير مدعوم/غير متاح.

  </Accordion>
  <Accordion title="القنوات الداعمة للسلاسل">
    - أي محوّل قناة يعرّض قدرة ربط الجلسة/السلسلة.
    - الدعم المضمّن الحالي: سلاسل/قنوات **Discord**، ومواضيع **Telegram** (مواضيع المنتدى في المجموعات/المجموعات الفائقة ومواضيع الرسائل الخاصة).
    - يمكن لقنوات Plugin إضافة الدعم عبر واجهة الربط نفسها.

  </Accordion>
</AccordionGroup>

## روابط القنوات المستمرة

بالنسبة إلى مسارات العمل غير المؤقتة، هيّئ روابط ACP المستمرة في
إدخالات `bindings[]` ذات المستوى الأعلى.

### نموذج الربط

<ParamField path="bindings[].type" type='"acp"'>
  يحدد ربط محادثة ACP مستمرًا.
</ParamField>
<ParamField path="bindings[].match" type="object">
  يحدد المحادثة الهدف. الأشكال حسب القناة:

- **قناة/سلسلة Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **قناة/رسالة خاصة Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. فضّل معرّفات Slack الثابتة؛ كما تطابق روابط القنوات الردود داخل سلاسل تلك القناة.
- **موضوع منتدى Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **رسالة خاصة/مجموعة WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. استخدم أرقام E.164 مثل `+15555550123` للدردشات المباشرة وJIDs مجموعات WhatsApp مثل `120363424282127706@g.us` للمجموعات.
- **رسالة خاصة/مجموعة iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. فضّل `chat_id:*` لروابط المجموعات الثابتة.

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
  تجاوز backend اختياري.
</ParamField>

### افتراضيات وقت التشغيل لكل وكيل

استخدم `agents.list[].runtime` لتعريف افتراضيات ACP مرة واحدة لكل وكيل:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (معرّف المشغّل، مثل `codex` أو `claude`)
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

- يضمن OpenClaw وجود جلسة ACP المهيأة بعد القبول الخاص بالقناة وقبل الاستخدام.
- تُوجَّه الرسائل في تلك القناة أو الموضوع أو الدردشة إلى جلسة ACP المهيأة.
- تمتلك ارتباطات ACP المهيأة مسار جلستها. ولا يستبدل توزيع البث المتشعب للقناة جلسة ACP المهيأة لارتباط مطابق.
- في المحادثات المرتبطة، يعيد `/new` و`/reset` تعيين مفتاح جلسة ACP نفسه في مكانه.
- تظل ارتباطات وقت التشغيل المؤقتة (مثل تلك التي تنشئها تدفقات تركيز السلاسل) سارية حيثما وجدت.
- عند إنشاء عمليات ACP عبر الوكلاء من دون `cwd` صريح، يرث OpenClaw مساحة عمل الوكيل الهدف من تهيئة الوكيل.
- تعود مسارات مساحة العمل الموروثة المفقودة إلى قيمة cwd الافتراضية للخلفية؛ أما حالات فشل الوصول غير المفقودة فتظهر كأخطاء إنشاء.

## بدء جلسات ACP

طريقتان لبدء جلسة ACP:

<Tabs>
  <Tab title="From sessions_spawn">
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
    `acp.defaultAgent` عند تهيئته. يتطلب `mode: "session"`
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

    الرايات الأساسية:

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
  الموجّه الأولي المُرسل إلى جلسة ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  يجب أن يكون `"acp"` لجلسات ACP.
</ParamField>
<ParamField path="agentId" type="string">
  معرّف منصة ACP الهدف. يعود إلى `acp.defaultAgent` إذا كان مضبوطًا.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  اطلب تدفق ربط السلاسل حيثما كان مدعومًا.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` تشغيل لمرة واحدة؛ و`"session"` مستمر. إذا كان `thread: true` وتم
  حذف `mode`، فقد يعتمد OpenClaw السلوك المستمر افتراضيًا حسب
  مسار وقت التشغيل. يتطلب `mode: "session"` قيمة `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  دليل عمل وقت التشغيل المطلوب (تتحقق منه سياسة الخلفية/وقت التشغيل).
  إذا حُذف، يرث إنشاء ACP مساحة عمل الوكيل الهدف
  عند تهيئتها؛ وتعود المسارات الموروثة المفقودة إلى
  افتراضيات الخلفية، بينما تُرجع أخطاء الوصول الحقيقية.
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
  `streamLogPath` الذي يشير إلى سجل JSONL مقيّد بنطاق الجلسة
  (`<sessionId>.acp-stream.jsonl`) يمكنك تتبعه للاطلاع على سجل الترحيل الكامل.
  تعرض تدفقات تقدم الأصل تعليقات المساعد وتقدم حالة ACP
  افتراضيًا ما لم تكن `streaming.progress.commentary=false`. كما يضبط Discord
  معاينات الأصل افتراضيًا على وضع التقدم عند عدم تهيئة وضع بث. لا يزال
  تقدم الحالة يحترم `acp.stream.tagVisibility`، لذلك تظل وسوم مثل `plan`
  مخفية ما لم تُفعّل صراحةً.
</ParamField>

تستخدم عمليات تشغيل `sessions_spawn` الخاصة بـ ACP
`agents.defaults.subagents.runTimeoutSeconds` بوصفها حد دورة الابن الافتراضي.
لا تقبل الأداة تجاوزات المهلة لكل استدعاء.

<ParamField path="model" type="string">
  تجاوز نموذج صريح لجلسة ACP الابنة. تقوم عمليات إنشاء Codex ACP
  بتطبيع مراجع OpenAI مثل `openai/gpt-5.4` إلى تهيئة بدء
  Codex ACP قبل `session/new`؛ كما تضبط صيغ الشرطة المائلة مثل
  `openai/gpt-5.4/high` جهد الاستدلال في Codex ACP.
  عند الحذف، يستخدم `sessions_spawn({ runtime: "acp" })` افتراضيات
  نماذج الوكلاء الفرعيين الحالية (`agents.defaults.subagents.model` أو
  `agents.list[].subagents.model`) عند تهيئتها؛ وإلا يترك
  منصة ACP تستخدم نموذجها الافتراضي الخاص.
  يجب أن تعلن المنصات الأخرى عن ACP `models` وأن تدعم
  `session/set_model`؛ وإلا يفشل OpenClaw/acpx بوضوح بدلًا من
  الرجوع بصمت إلى افتراضي الوكيل الهدف.
</ParamField>
<ParamField path="thinking" type="string">
  جهد تفكير/استدلال صريح. بالنسبة إلى Codex ACP، تُحوَّل `minimal` إلى
  جهد منخفض، وتُحوَّل `low`/`medium`/`high`/`xhigh` مباشرةً، أما `off`
  فيحذف تجاوز بدء جهد الاستدلال.
  عند الحذف، تستخدم عمليات إنشاء ACP افتراضيات التفكير الحالية للوكلاء الفرعيين
  و`agents.defaults.models["provider/model"].params.thinking`
  لكل نموذج محدد.
</ParamField>

## أوضاع ربط الإنشاء والسلاسل

<Tabs>
  <Tab title="--bind here|off">
    | الوضع   | السلوك                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | اربط المحادثة النشطة الحالية في مكانها؛ وافشل إذا لم تكن هناك محادثة نشطة. |
    | `off`  | لا تنشئ ربطًا للمحادثة الحالية.                          |

    ملاحظات:

    - `--bind here` هو أبسط مسار للمشغّل من أجل "اجعل هذه القناة أو الدردشة مدعومة بـ Codex."
    - لا ينشئ `--bind here` سلسلة فرعية.
    - لا يتوفر `--bind here` إلا على القنوات التي تكشف دعم ربط المحادثة الحالية.
    - لا يمكن الجمع بين `--bind` و`--thread` في استدعاء `/acp spawn` نفسه.

  </Tab>
  <Tab title="--thread auto|here|off">
    | الوضع   | السلوك                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | داخل سلسلة نشطة: اربط تلك السلسلة. خارج السلسلة: أنشئ/اربط سلسلة فرعية عند الدعم. |
    | `here` | اشترط وجود سلسلة نشطة حالية؛ وافشل إذا لم تكن داخل واحدة.                                                  |
    | `off`  | بلا ربط. تبدأ الجلسة غير مرتبطة.                                                                 |

    ملاحظات:

    - على أسطح الربط غير القائمة على السلاسل، يكون السلوك الافتراضي فعليًا `off`.
    - يتطلب الإنشاء المرتبط بسلسلة دعم سياسة القناة:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - استخدم `--bind here` عندما تريد تثبيت المحادثة الحالية من دون إنشاء سلسلة فرعية.

  </Tab>
</Tabs>

## نموذج التسليم

يمكن أن تكون جلسات ACP إما مساحات عمل تفاعلية أو عملًا في الخلفية
يملكه الأصل. يعتمد مسار التسليم على هذا الشكل.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    الجلسات التفاعلية مخصصة لمواصلة الحديث على سطح دردشة
    مرئي:

    - يربط `/acp spawn ... --bind here` المحادثة الحالية بجلسة ACP.
    - يربط `/acp spawn ... --thread ...` سلسلة/موضوع قناة بجلسة ACP.
    - توجه `bindings[].type="acp"` المستمرة والمهيأة المحادثات المطابقة إلى جلسة ACP نفسها.

    تُوجَّه رسائل المتابعة في المحادثة المرتبطة مباشرةً إلى
    جلسة ACP، ويُسلَّم خرج ACP مرة أخرى إلى
    القناة/السلسلة/الموضوع نفسه.

    ما يرسله OpenClaw إلى المنصة:

    - تُرسل المتابعات المرتبطة العادية كنص موجّه، مع المرفقات فقط عندما تدعمها المنصة/الخلفية.
    - تُعترض أوامر إدارة `/acp` وأوامر Gateway المحلية قبل إرسال ACP.
    - تُجسَّد أحداث الإكمال التي ينشئها وقت التشغيل لكل هدف. تحصل وكلاء OpenClaw على غلاف سياق وقت التشغيل الداخلي الخاص بـ OpenClaw؛ وتحصل منصات ACP الخارجية على موجّه عادي يتضمن نتيجة الابن والتعليمة. يجب ألا يُرسل غلاف `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` الخام مطلقًا إلى منصات خارجية أو يُحفظ كنص سجل مستخدم ACP.
    - تستخدم إدخالات سجل ACP نص التشغيل المرئي للمستخدم أو موجّه الإكمال العادي. تبقى بيانات تعريف الأحداث الداخلية منظمة في OpenClaw حيثما أمكن ولا تُعامل كمحتوى دردشة كتبه المستخدم.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    جلسات ACP لمرة واحدة التي ينشئها تشغيل وكيل آخر هي أبناء
    يعملون في الخلفية، على غرار الوكلاء الفرعيين:

    - يطلب الأصل العمل باستخدام `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - يعمل الابن في جلسة منصة ACP خاصة به.
    - تعمل دورات الابن على مسار الخلفية نفسه المستخدم لإنشاء الوكلاء الفرعيين الأصليين، لذلك لا تعطل منصة ACP البطيئة عمل الجلسة الرئيسية غير المرتبط.
    - تعود تقارير الإكمال عبر مسار إعلان إكمال المهمة. يحوّل OpenClaw بيانات تعريف الإكمال الداخلية إلى موجّه ACP عادي قبل إرسالها إلى منصة خارجية، لذلك لا ترى المنصات علامات سياق وقت التشغيل الخاصة بـ OpenClaw فقط.
    - يعيد الأصل صياغة نتيجة الابن بصوت المساعد العادي عندما يكون الرد الموجّه للمستخدم مفيدًا.

    لا تعامل هذا المسار **كأنه** دردشة نظير إلى نظير بين الأصل
    والابن. لدى الابن بالفعل قناة إكمال للعودة إلى
    الأصل.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    يمكن لـ `sessions_send` استهداف جلسة أخرى بعد الإنشاء. بالنسبة إلى
    جلسات النظراء العادية، يستخدم OpenClaw مسار متابعة من وكيل إلى وكيل
    (A2A) بعد حقن الرسالة:

    - انتظر رد الجلسة الهدف.
    - اسمح اختياريًا للطالب والهدف بتبادل عدد محدود من دورات المتابعة.
    - اطلب من الهدف إنتاج رسالة إعلان.
    - سلّم ذلك الإعلان إلى القناة أو السلسلة المرئية.

    يُعد مسار A2A ذاك بديلًا احتياطيًا لإرسال النظراء عندما يحتاج المرسل إلى
    متابعة مرئية. ويبقى مفعّلًا عندما تستطيع جلسة غير مرتبطة
    رؤية هدف ACP ومراسلته، مثلًا ضمن إعدادات
    `tools.sessions.visibility` الواسعة.

    يتجاوز OpenClaw متابعة A2A فقط عندما يكون الطالب هو
    الأصل لطفل ACP أحادي الاستخدام مملوك لأصله. في تلك الحالة،
    يمكن أن يؤدي تشغيل A2A فوق إكمال المهمة إلى إيقاظ الأصل بنتيجة
    الطفل، وتمرير رد الأصل مرة أخرى إلى الطفل، وإنشاء حلقة صدى بين الأصل/الطفل. تُبلغ نتيجة `sessions_send` عن
    `delivery.status="skipped"` لحالة الطفل المملوك تلك لأن مسار
    الإكمال مسؤول بالفعل عن النتيجة.

  </Accordion>
  <Accordion title="Resume an existing session">
    استخدم `resumeSessionId` لمتابعة جلسة ACP سابقة بدلاً من
    البدء من جديد. يعيد الوكيل تشغيل سجل محادثته عبر
    `session/load`، لذلك يتابع بسياق كامل لما سبق.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    حالات الاستخدام الشائعة:

    - سلّم جلسة Codex من حاسوبك المحمول إلى هاتفك - اطلب من وكيلك المتابعة من حيث توقفت.
    - تابع جلسة برمجة بدأتها تفاعلياً في CLI، والآن دون واجهة عبر وكيلك.
    - استأنف عملاً انقطع بسبب إعادة تشغيل Gateway أو انتهاء مهلة الخمول.

    ملاحظات:

    - ينطبق `resumeSessionId` فقط عندما تكون `runtime: "acp"`؛ يتجاهل وقت تشغيل الوكيل الفرعي الافتراضي هذا الحقل الخاص بـ ACP فقط.
    - ينطبق `streamTo` فقط عندما تكون `runtime: "acp"`؛ يتجاهل وقت تشغيل الوكيل الفرعي الافتراضي هذا الحقل الخاص بـ ACP فقط.
    - `resumeSessionId` هو معرّف استئناف ACP/الحاضنة المحلي للمضيف، وليس مفتاح جلسة قناة OpenClaw؛ ما يزال OpenClaw يتحقق من سياسة إنشاء ACP وسياسة الوكيل الهدف قبل الإرسال، بينما يمتلك خلفية ACP أو الحاضنة تفويض تحميل ذلك المعرّف upstream.
    - يستعيد `resumeSessionId` سجل محادثة ACP upstream؛ يظل `thread` و`mode` مطبقين بشكل طبيعي على جلسة OpenClaw الجديدة التي تنشئها، لذلك لا يزال `mode: "session"` يتطلب `thread: true`.
    - يجب أن يدعم الوكيل الهدف `session/load` (يدعمه Codex وClaude Code).
    - إذا لم يُعثر على معرّف الجلسة، يفشل الإنشاء بخطأ واضح - دون رجوع صامت إلى جلسة جديدة.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    بعد نشر Gateway، شغّل فحصاً مباشراً شاملاً بدلاً من
    الوثوق باختبارات الوحدة:

    1. تحقق من إصدار Gateway المنشور والالتزام على المضيف الهدف.
    2. افتح جلسة جسر ACPX مؤقتة إلى وكيل مباشر.
    3. اطلب من ذلك الوكيل استدعاء `sessions_spawn` مع `runtime: "acp"`، و`agentId: "codex"`، و`mode: "run"`، والمهمة `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. تحقق من `accepted=yes`، ووجود `childSessionKey` حقيقي، وعدم وجود خطأ مدقق.
    5. نظّف جلسة الجسر المؤقتة.

    أبقِ البوابة على `mode: "run"` وتجاوز `streamTo: "parent"` -
    فمسارات `mode: "session"` المرتبطة بالسلاسل ومسارات ترحيل البث
    هي عمليات تكامل أغنى ومنفصلة.

  </Accordion>
</AccordionGroup>

## توافق sandbox

تعمل جلسات ACP حالياً على وقت تشغيل المضيف، **وليس** داخل
sandbox الخاص بـ OpenClaw.

<Warning>
**حد الأمان:**

- يمكن للحاضنة الخارجية القراءة/الكتابة وفقاً لأذونات CLI الخاصة بها و`cwd` المحدد.
- سياسة sandbox الخاصة بـ OpenClaw **لا** تغلف تنفيذ حاضنة ACP.
- ما يزال OpenClaw يفرض بوابات ميزات ACP، والوكلاء المسموحين، وملكية الجلسات، وروابط القنوات، وسياسة تسليم Gateway.
- استخدم `runtime: "subagent"` للعمل الأصلي في OpenClaw المفروض عليه sandbox.

</Warning>

القيود الحالية:

- إذا كانت جلسة الطالب داخل sandbox، تُحظر عمليات إنشاء ACP لكل من `sessions_spawn({ runtime: "acp" })` و`/acp spawn`.
- لا يدعم `sessions_spawn` مع `runtime: "acp"` الخيار `sandbox: "require"`.

## حل هدف الجلسة

تقبل معظم إجراءات `/acp` هدف جلسة اختيارياً (`session-key`،
أو `session-id`، أو `session-label`).

**ترتيب الحل:**

1. وسيطة الهدف الصريحة (أو `--session` لـ `/acp steer`)
   - يجرّب المفتاح
   - ثم معرّف جلسة على شكل UUID
   - ثم التسمية
2. ربط السلسلة الحالية (إذا كانت هذه المحادثة/السلسلة مرتبطة بجلسة ACP).
3. الرجوع إلى جلسة الطالب الحالية.

تشارك روابط المحادثة الحالية وروابط السلسلة كلاهما في
الخطوة 2.

إذا لم يُحل أي هدف، يعيد OpenClaw خطأ واضحاً
(`Unable to resolve session target: ...`).

## عناصر تحكم ACP

| الأمر                | ما يفعله                                                  | مثال                                                         |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | إنشاء جلسة ACP؛ مع ربط حالي أو ربط سلسلة اختياري.        | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | إلغاء الدور الجاري للجلسة الهدف.                         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | إرسال تعليمة توجيه إلى جلسة قيد التشغيل.                 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | إغلاق الجلسة وإلغاء ربط أهداف السلسلة.                   | `/acp close`                                                  |
| `/acp status`        | عرض الخلفية، والوضع، والحالة، وخيارات وقت التشغيل، والقدرات. | `/acp status`                                                 |
| `/acp set-mode`      | ضبط وضع وقت التشغيل للجلسة الهدف.                        | `/acp set-mode plan`                                          |
| `/acp set`           | كتابة خيار إعداد عام لوقت التشغيل.                       | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ضبط تجاوز دليل العمل لوقت التشغيل.                       | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | ضبط ملف تعريف سياسة الموافقة.                            | `/acp permissions strict`                                     |
| `/acp timeout`       | ضبط مهلة وقت التشغيل (بالثواني).                         | `/acp timeout 120`                                            |
| `/acp model`         | ضبط تجاوز نموذج وقت التشغيل.                             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | إزالة تجاوزات خيارات وقت تشغيل الجلسة.                   | `/acp reset-options`                                          |
| `/acp sessions`      | سرد جلسات ACP الحديثة من المخزن.                         | `/acp sessions`                                               |
| `/acp doctor`        | صحة الخلفية، والقدرات، وإصلاحات قابلة للتنفيذ.           | `/acp doctor`                                                 |
| `/acp install`       | طباعة خطوات تثبيت وتمكين حتمية.                          | `/acp install`                                                |

يعرض `/acp status` خيارات وقت التشغيل الفعالة بالإضافة إلى معرّفات
الجلسات على مستوى وقت التشغيل ومستوى الخلفية. تظهر أخطاء عناصر التحكم
غير المدعومة بوضوح عندما تفتقر الخلفية إلى قدرة. يقرأ `/acp sessions`
المخزن للجلسة الحالية المرتبطة أو جلسة الطالب؛ تُحل رموز الهدف
(`session-key`، أو `session-id`، أو `session-label`) عبر
اكتشاف جلسات Gateway، بما في ذلك جذور `session.store`
المخصصة لكل وكيل.

### ربط خيارات وقت التشغيل

يحتوي `/acp` على أوامر ملائمة ومُعيّن عام. العمليات
المكافئة:

| الأمر                        | يرتبط بـ                              | ملاحظات                                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | مفتاح إعداد وقت التشغيل `model`      | بالنسبة إلى Codex ACP، يطبّع OpenClaw `openai/<model>` إلى معرّف نموذج المحوّل، ويربط لواحق الاستدلال المائلة مثل `openai/gpt-5.4/high` بـ `reasoning_effort`.                                      |
| `/acp set thinking <level>`  | الخيار القانوني `thinking`           | يرسل OpenClaw المكافئ الذي تعلنه الخلفية عند وجوده، مفضلاً `thinking`، ثم `effort`، أو `reasoning_effort`، أو `thought_level`. بالنسبة إلى Codex ACP، يربط المحوّل القيم بـ `reasoning_effort`. |
| `/acp permissions <profile>` | الخيار القانوني `permissionProfile`  | يرسل OpenClaw المكافئ الذي تعلنه الخلفية عند وجوده، مثل `approval_policy`، أو `permission_profile`، أو `permissions`، أو `permission_mode`.                                                           |
| `/acp timeout <seconds>`     | الخيار القانوني `timeoutSeconds`     | يرسل OpenClaw المكافئ الذي تعلنه الخلفية عند وجوده، مثل `timeout` أو `timeout_seconds`.                                                                                                                |
| `/acp cwd <path>`            | تجاوز cwd لوقت التشغيل               | تحديث مباشر.                                                                                                                                                                                              |
| `/acp set <key> <value>`     | عام                                  | يستخدم `key=cwd` مسار تجاوز cwd.                                                                                                                                                                          |
| `/acp reset-options`         | يمسح كل تجاوزات وقت التشغيل          | -                                                                                                                                                                                                          |

## حاضنة acpx، وإعداد Plugin، والأذونات

لإعداد حاضنة acpx (أسماء Claude Code / Codex / Gemini CLI
المستعارة)، وجسور MCP الخاصة بـ plugin-tools وOpenClaw-tools، وأوضاع
أذونات ACP، راجع
[وكلاء ACP - الإعداد](/ar/tools/acp-agents-setup).

## استكشاف الأخطاء وإصلاحها

| العَرَض                                                                     | السبب المحتمل                                                                                                           | الإصلاح                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin الخلفية مفقود، أو معطّل، أو محظور بواسطة `plugins.allow`.                                                       | ثبّت Plugin الخلفية وفعّله، وأدرج `acpx` في `plugins.allow` عند ضبط قائمة السماح هذه، ثم شغّل `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP معطّل عمومًا.                                                                                                 | اضبط `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | الإرسال التلقائي من رسائل المحادثات العادية معطّل.                                                               | اضبط `acp.dispatch.enabled=true` لاستئناف توجيه المحادثات تلقائيًا؛ تظل استدعاءات `sessions_spawn({ runtime: "acp" })` الصريحة تعمل.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | الوكيل غير موجود في قائمة السماح.                                                                                                | استخدم `agentId` مسموحًا به أو حدّث `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` يبلّغ أن الخلفية غير جاهزة مباشرة بعد بدء التشغيل                 | Plugin الخلفية مفقود، أو معطّل، أو محظور بسياسة السماح/المنع، أو ملفه التنفيذي المضبوط غير متاح.        | ثبّت/فعّل Plugin الخلفية، وأعد تشغيل `/acp doctor`، وافحص خطأ تثبيت الخلفية أو السياسة إذا بقيت غير سليمة.                                           |
| لم يتم العثور على أمر الحزمة                                                   | CLI المحوّل غير مثبت، أو Plugin الخارجي مفقود، أو فشل جلب `npx` عند التشغيل الأول لمحوّل غير Codex. | شغّل `/acp doctor`، وثبّت/حضّر المحوّل مسبقًا على مضيف Gateway، أو اضبط أمر وكيل acpx صراحةً.                                                      |
| تعذّر العثور على النموذج من الحزمة                                            | معرّف النموذج صالح لمزوّد/حزمة أخرى، لكنه ليس صالحًا لهدف ACP هذا.                                                | استخدم نموذجًا مدرجًا بواسطة تلك الحزمة، أو اضبط النموذج في الحزمة، أو احذف التجاوز.                                                                            |
| خطأ مصادقة المورّد من الحزمة                                          | OpenClaw سليم، لكن CLI/المزوّد الهدف لم يسجّل الدخول.                                                     | سجّل الدخول أو وفّر مفتاح المزوّد المطلوب في بيئة مضيف Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | رمز مفتاح/معرّف/تسمية غير صحيح.                                                                                                | شغّل `/acp sessions`، وانسخ المفتاح/التسمية بالضبط، ثم أعد المحاولة.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | استُخدم `--bind here` بدون محادثة نشطة قابلة للربط.                                                            | انتقل إلى الدردشة/القناة الهدف وأعد المحاولة، أو استخدم إنشاءً غير مربوط.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | يفتقر المحوّل إلى قدرة ربط ACP بالمحادثة الحالية.                                                             | استخدم `/acp spawn ... --thread ...` حيث يكون مدعومًا، أو اضبط `bindings[]` على المستوى الأعلى، أو انتقل إلى قناة مدعومة.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | استُخدم `--thread here` خارج سياق سلسلة محادثات.                                                                         | انتقل إلى سلسلة المحادثات الهدف أو استخدم `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | مستخدم آخر يملك هدف الربط النشط.                                                                           | أعد الربط بصفتك المالك أو استخدم محادثة أو سلسلة محادثات مختلفة.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | يفتقر المحوّل إلى قدرة ربط سلسلة المحادثات.                                                                               | استخدم `--thread off` أو انتقل إلى محوّل/قناة مدعومين.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | تشغيل ACP يكون على جانب المضيف؛ جلسة الطالب داخل صندوق حماية.                                                              | استخدم `runtime="subagent"` من الجلسات داخل صندوق الحماية، أو شغّل إنشاء ACP من جلسة غير محمية بصندوق حماية.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | طُلب `sandbox="require"` لتشغيل ACP.                                                                         | استخدم `runtime="subagent"` للصندوقية المطلوبة، أو استخدم ACP مع `sandbox="inherit"` من جلسة غير محمية بصندوق حماية.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | الحزمة الهدف لا تعرض تبديل نماذج ACP العام.                                                        | استخدم حزمة تعلن عن ACP `models`/`session/set_model`، أو استخدم مراجع نماذج ACP الخاصة بـ Codex، أو اضبط النموذج مباشرة في الحزمة إذا كان لها علم بدء تشغيل خاص بها. |
| بيانات ACP الوصفية مفقودة للجلسة المربوطة                                      | بيانات وصفية قديمة/محذوفة لجلسة ACP.                                                                                    | أعد إنشاءها باستخدام `/acp spawn`، ثم أعد ربط/تركيز سلسلة المحادثات.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | يحظر `permissionMode` عمليات الكتابة/التنفيذ في جلسة ACP غير تفاعلية.                                                    | اضبط `plugins.entries.acpx.config.permissionMode` على `approve-all` وأعد تشغيل gateway. راجع [إعدادات الأذونات](/ar/tools/acp-agents-setup#permission-configuration). |
| تفشل جلسة ACP مبكرًا مع مخرجات قليلة                                  | مطالبات الأذونات محظورة بواسطة `permissionMode`/`nonInteractivePermissions`.                                        | افحص سجلات gateway بحثًا عن `AcpRuntimeError`. للأذونات الكاملة، اضبط `permissionMode=approve-all`؛ وللتدهور السلس، اضبط `nonInteractivePermissions=deny`.        |
| تتوقف جلسة ACP إلى أجل غير مسمى بعد إكمال العمل                       | انتهت عملية الحزمة لكن جلسة ACP لم تبلّغ عن الاكتمال.                                                    | حدّث OpenClaw؛ تنظيف acpx الحالي يحصد عمليات الغلاف والمحوّل القديمة المملوكة لـ OpenClaw عند الإغلاق وبدء تشغيل Gateway.                                             |
| ترى الحزمة `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | تسرّب غلاف الأحداث الداخلي عبر حد ACP.                                                                | حدّث OpenClaw وأعد تشغيل تدفق الاكتمال؛ يجب أن تتلقى الحزم الخارجية مطالبات اكتمال عادية فقط.                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` يخص
مرحل خطاف Codex الأصلي، وليس ACP/acpx. في دردشة Codex مربوطة، ابدأ
جلسة جديدة باستخدام `/new` أو `/reset`؛ إذا نجح مرة واحدة ثم عاد في استدعاء
الأداة الأصلي التالي، فأعد تشغيل خادم تطبيق Codex أو OpenClaw Gateway بدلًا من
تكرار `/new`. راجع [استكشاف مشكلات حزمة Codex وإصلاحها](/ar/plugins/codex-harness#troubleshooting).
</Note>

## ذات صلة

- [وكلاء ACP - الإعداد](/ar/tools/acp-agents-setup)
- [إرسال الوكيل](/ar/tools/agent-send)
- [خلفيات CLI](/ar/gateway/cli-backends)
- [حزمة Codex](/ar/plugins/codex-harness)
- [تشغيل حزمة Codex](/ar/plugins/codex-harness-runtime)
- [أدوات صندوق حماية الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (وضع الجسر)](/ar/cli/acp)
- [الوكلاء الفرعيون](/ar/tools/subagents)
