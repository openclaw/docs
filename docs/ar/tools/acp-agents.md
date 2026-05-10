---
read_when:
    - تشغيل حاضنات البرمجة عبر ACP
    - إعداد جلسات ACP المرتبطة بالمحادثة على قنوات المراسلة
    - ربط محادثة قناة رسائل بجلسة ACP دائمة
    - استكشاف مشكلات الواجهة الخلفية لـ ACP أو ربط Plugin أو تسليم الإكمال وإصلاحها
    - تشغيل أوامر /acp من الدردشة
sidebarTitle: ACP agents
summary: شغّل بيئات تشغيل البرمجة الخارجية (Claude Code وCursor وGemini CLI وCodex ACP الصريح وOpenClaw ACP وOpenCode) عبر الواجهة الخلفية لـ ACP
title: وكلاء ACP
x-i18n:
    generated_at: "2026-05-10T20:03:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f4beb509c00c965bc2b202648f1b6567d1f3a633f2f9926882adafc5144e06
    source_path: tools/acp-agents.md
    workflow: 16
---

[جلسات Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
تتيح لـ OpenClaw تشغيل أطر تشغيل الترميز الخارجية (مثل Pi، وClaude Code،
وCursor، وCopilot، وDroid، وOpenClaw ACP، وOpenCode، وGemini CLI، وأطر تشغيل
ACPX المدعومة الأخرى) عبر Plugin خلفية ACP.

يُتتبَّع كل إنشاء لجلسة ACP بوصفه [مهمة خلفية](/ar/automation/tasks).

<Note>
**ACP هو مسار أطر التشغيل الخارجية، وليس مسار Codex الافتراضي.** يملك
Plugin خادم تطبيق Codex الأصلي عناصر التحكم `/codex ...` ووقت التشغيل المضمّن الافتراضي
`openai/gpt-*` لدورات الوكيل؛ أما ACP فيملك عناصر التحكم
`/acp ...` وجلسات `sessions_spawn({ runtime: "acp" })`.

إذا أردت أن يتصل Codex أو Claude Code كعميل MCP خارجي
مباشرة بمحادثات قنوات OpenClaw الحالية، فاستخدم
[`openclaw mcp serve`](/ar/cli/mcp) بدلا من ACP.
</Note>

## أي صفحة أحتاج؟

| تريد أن…                                                                                    | استخدم هذا                              | ملاحظات                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ربط Codex أو التحكم به في المحادثة الحالية                                               | `/codex bind`, `/codex threads`       | مسار خادم تطبيق Codex الأصلي عند تمكين Plugin `codex`؛ يتضمن ردود الدردشة المرتبطة، وتمرير الصور، وعناصر التحكم في النموذج/السرعة/الأذونات، والإيقاف، والتوجيه. ACP بديل صريح |
| تشغيل Claude Code أو Gemini CLI أو Codex ACP الصريح أو إطار تشغيل خارجي آخر _عبر_ OpenClaw | هذه الصفحة                             | جلسات مرتبطة بالدردشة، و`/acp spawn`، و`sessions_spawn({ runtime: "acp" })`، ومهام خلفية، وعناصر تحكم وقت التشغيل                                                                                   |
| عرض جلسة OpenClaw Gateway _كـ_ خادم ACP لمحرر أو عميل                   | [`openclaw acp`](/ar/cli/acp)            | وضع الجسر. يتحدث IDE/العميل ACP إلى OpenClaw عبر stdio/WebSocket                                                                                                                            |
| إعادة استخدام CLI ذكاء اصطناعي محلي كنموذج احتياطي نصي فقط                                              | [خلفيات CLI](/ar/gateway/cli-backends) | ليس ACP. لا أدوات OpenClaw، ولا عناصر تحكم ACP، ولا وقت تشغيل إطار تشغيل                                                                                                                               |

## هل يعمل هذا مباشرة؟

نعم، بعد تثبيت Plugin وقت تشغيل ACP الرسمي:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

يمكن لعمليات السحب المصدرية استخدام Plugin مساحة العمل المحلية `extensions/acpx` بعد
`pnpm install`. شغّل `/acp doctor` لإجراء فحص الجاهزية.

لا يعلّم OpenClaw الوكلاء عن إنشاء ACP إلا عندما يكون ACP **قابلا للاستخدام
فعلا**: يجب تمكين ACP، ويجب ألا يكون الإرسال معطلا، ويجب ألا تكون الجلسة
الحالية محظورة بسبب sandbox، ويجب تحميل خلفية وقت تشغيل. إذا لم تتحقق
هذه الشروط، تبقى Skills الخاصة بـ Plugin ACP وإرشادات
`sessions_spawn` لـ ACP مخفية حتى لا يقترح الوكيل خلفية غير متاحة.

<AccordionGroup>
  <Accordion title="مشكلات التشغيل الأول">
    - إذا كان `plugins.allow` مضبوطا، فهو مخزون Plugin تقييدي و**يجب** أن يتضمن `acpx`؛ وإلا فسيتم حظر خلفية ACP المثبتة عمدا، وسيبلغ `/acp doctor` عن إدخال allowlist المفقود.
    - يتم تجهيز محول Codex ACP مع Plugin `acpx` وتشغيله محليا عندما يكون ذلك ممكنا.
    - يعمل Codex ACP باستخدام `CODEX_HOME` معزول؛ ينسخ OpenClaw فقط إدخالات المشاريع الموثوقة من إعدادات Codex على المضيف، ويثق بمساحة العمل النشطة، مع ترك المصادقة، والإشعارات، والخطافات في إعدادات المضيف.
    - قد تظل محولات أطر التشغيل المستهدفة الأخرى تُجلب عند الطلب باستخدام `npx` في أول مرة تستخدمها فيها.
    - يجب أن تظل مصادقة المورّد موجودة على المضيف لذلك إطار التشغيل.
    - إذا لم يكن لدى المضيف npm أو وصول إلى الشبكة، فستفشل عمليات جلب المحول في التشغيل الأول حتى تُسخَّن الذاكرات المؤقتة مسبقا أو يُثبَّت المحول بطريقة أخرى.

  </Accordion>
  <Accordion title="متطلبات وقت التشغيل">
    يشغّل ACP عملية إطار تشغيل خارجية حقيقية. يملك OpenClaw التوجيه،
    وحالة مهمة الخلفية، والتسليم، والارتباطات، والسياسة؛ ويملك إطار التشغيل
    تسجيل الدخول إلى المورّد، وكتالوغ النماذج، وسلوك نظام الملفات، والأدوات
    الأصلية.

    قبل إلقاء اللوم على OpenClaw، تحقق من الآتي:

    - يبلغ `/acp doctor` عن خلفية ممكنة وسليمة.
    - يكون معرّف الهدف مسموحا به بواسطة `acp.allowedAgents` عند ضبط قائمة السماح تلك.
    - يمكن لأمر إطار التشغيل البدء على مضيف Gateway.
    - مصادقة المورّد موجودة لإطار التشغيل ذاك (`claude`, `codex`, `gemini`, `opencode`, `droid`, إلخ).
    - النموذج المحدد موجود لذلك إطار التشغيل - معرّفات النماذج غير قابلة للنقل بين أطر التشغيل.
    - المسار `cwd` المطلوب موجود ويمكن الوصول إليه، أو احذف `cwd` ودع الخلفية تستخدم الإعداد الافتراضي الخاص بها.
    - يطابق وضع الأذونات العمل. لا يمكن للجلسات غير التفاعلية النقر على مطالبات الأذونات الأصلية، لذلك تحتاج عمليات الترميز كثيفة الكتابة/التنفيذ عادة إلى ملف تعريف أذونات ACPX يمكنه المتابعة دون واجهة تفاعلية.

  </Accordion>
</AccordionGroup>

لا تُعرَض أدوات OpenClaw Plugin وأدوات OpenClaw المضمّنة على
أطر تشغيل ACP افتراضيا. مكّن جسور MCP الصريحة في
[إعداد وكلاء ACP](/ar/tools/acp-agents-setup) فقط عندما ينبغي لإطار التشغيل
استدعاء تلك الأدوات مباشرة.

## أهداف أطر التشغيل المدعومة

مع خلفية `acpx`، استخدم معرّفات أطر التشغيل هذه كأهداف
`/acp spawn <id>` أو `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| معرّف إطار التشغيل | الخلفية المعتادة                                | ملاحظات                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | محول Claude Code ACP                        | يتطلب مصادقة Claude Code على المضيف.                                              |
| `codex`    | محول Codex ACP                              | بديل ACP صريح فقط عندما يكون `/codex` الأصلي غير متاح أو عندما يُطلب ACP. |
| `copilot`  | محول GitHub Copilot ACP                     | يتطلب مصادقة Copilot CLI/وقت التشغيل.                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | تجاوز أمر acpx إذا كان تثبيت محلي يعرض نقطة دخول ACP مختلفة.    |
| `droid`    | Factory Droid CLI                              | يتطلب مصادقة Factory/Droid أو `FACTORY_API_KEY` في بيئة إطار التشغيل.        |
| `gemini`   | محول Gemini CLI ACP                         | يتطلب مصادقة Gemini CLI أو إعداد مفتاح API.                                          |
| `iflow`    | iFlow CLI                                      | يعتمد توفر المحول والتحكم في النموذج على CLI المثبت.                 |
| `kilocode` | Kilo Code CLI                                  | يعتمد توفر المحول والتحكم في النموذج على CLI المثبت.                 |
| `kimi`     | Kimi/Moonshot CLI                              | يتطلب مصادقة Kimi/Moonshot على المضيف.                                            |
| `kiro`     | Kiro CLI                                       | يعتمد توفر المحول والتحكم في النموذج على CLI المثبت.                 |
| `opencode` | محول OpenCode ACP                           | يتطلب مصادقة OpenCode CLI/المورّد.                                                |
| `openclaw` | جسر OpenClaw Gateway عبر `openclaw acp` | يتيح لإطار تشغيل واع بـ ACP التحدث مجددا إلى جلسة OpenClaw Gateway.                 |
| `pi`       | وقت تشغيل Pi/OpenClaw المضمّن                   | يُستخدم لتجارب أطر التشغيل الأصلية لـ OpenClaw.                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | يتطلب مصادقة متوافقة مع Qwen على المضيف.                                          |

يمكن تكوين أسماء مستعارة مخصصة لوكلاء acpx داخل acpx نفسه، لكن سياسة OpenClaw
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
    من دون استبدال السياق: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="الإيقاف">
    `/acp cancel` (الدورة الحالية) أو `/acp close` (الجلسة + الارتباطات).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="تفاصيل دورة الحياة">
    - ينشئ الإنشاء جلسة وقت تشغيل ACP أو يستأنفها، ويسجل بيانات ACP الوصفية في مخزن جلسات OpenClaw، وقد ينشئ مهمة خلفية عندما يكون التشغيل مملوكا للأصل.
    - تُعامل جلسات ACP المملوكة للأصل كعمل خلفي حتى عندما تكون جلسة وقت التشغيل مستمرة؛ يمر الإكمال والتسليم عبر الأسطح من خلال مُشعِر المهمة الأصل بدلا من التصرف كجلسة دردشة عادية موجهة للمستخدم.
    - تغلق صيانة المهام جلسات ACP الطرفية أو اليتيمة ذات اللقطة الواحدة والمملوكة للأصل. تُحفظ جلسات ACP المستمرة ما دام ارتباط محادثة نشط باقيا؛ وتُغلق الجلسات المستمرة القديمة التي لا تملك ارتباطا نشطا حتى لا يمكن استئنافها بصمت بعد انتهاء المهمة المالكة أو اختفاء سجل مهمتها.
    - تذهب رسائل المتابعة المرتبطة مباشرة إلى جلسة ACP حتى يُغلق الارتباط أو يُلغى تركيزه أو يُعاد ضبطه أو تنتهي صلاحيته.
    - تبقى أوامر Gateway محلية. لا تُرسل `/acp ...` و`/status` و`/unfocus` أبدا كنص مطالبة عادي إلى إطار تشغيل ACP مرتبط.
    - يلغي `cancel` الدورة النشطة عندما تدعم الخلفية الإلغاء؛ ولا يحذف الارتباط أو بيانات الجلسة الوصفية.
    - ينهي `close` جلسة ACP من وجهة نظر OpenClaw ويزيل الارتباط. قد يحتفظ إطار التشغيل بسجله upstream الخاص إذا كان يدعم الاستئناف.
    - ينظف Plugin acpx أشجار عمليات المغلفات والمحوّلات المملوكة لـ OpenClaw بعد `close`، ويحصد عمليات ACPX اليتيمة القديمة المملوكة لـ OpenClaw أثناء بدء تشغيل Gateway.
    - يكون عمال وقت التشغيل الخاملون مؤهلين للتنظيف بعد `acp.runtime.ttlMinutes`؛ وتبقى بيانات الجلسات الوصفية المخزنة متاحة لـ `/acp sessions`.

  </Accordion>
  <Accordion title="قواعد توجيه Codex الأصلي">
    محفزات اللغة الطبيعية التي يجب أن تُوجَّه إلى **Plugin Codex
    الأصلي** عندما يكون ممكنا:

    - "اربط قناة Discord هذه بـ Codex."
    - "أرفق هذه الدردشة بسلسلة Codex `<id>`."
    - "اعرض سلاسل Codex، ثم اربط هذه السلسلة."

    ربط محادثة Codex الأصلي هو مسار التحكم الافتراضي في الدردشة.
    تظل أدوات OpenClaw الديناميكية تُنفَّذ عبر OpenClaw، بينما
    تُنفَّذ أدوات Codex الأصلية مثل shell/apply-patch داخل Codex.
    بالنسبة إلى أحداث أدوات Codex الأصلية، يحقن OpenClaw مُرحِّل خطاف
    أصليًا لكل دور لكي تتمكن خطافات Plugin من حظر `before_tool_call`، ومراقبة
    `after_tool_call`، وتوجيه أحداث Codex `PermissionRequest`
    عبر موافقات OpenClaw. تُرحَّل خطافات Codex `Stop` إلى
    OpenClaw `before_agent_finalize`، حيث يمكن للـ plugins طلب تمريرة
    نموذج إضافية واحدة قبل أن يُنهي Codex إجابته. يبقى المُرحِّل
    محافظًا عمدًا: فهو لا يغيّر وسيطات أدوات Codex الأصلية
    ولا يعيد كتابة سجلات سلسلة Codex. استخدم ACP الصريح فقط
    عندما تريد نموذج تشغيل/جلسة ACP. حُدِّد حد دعم Codex
    المضمّن في
    [عقد دعم حاضنة Codex v1](/ar/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="ورقة اختيار النموذج / المزوّد / بيئة التشغيل">
    - `openai-codex/*` - مسار نموذج Codex OAuth/الاشتراك القديم الذي يصلحه doctor.
    - `openai/*` - بيئة تشغيل خادم تطبيق Codex الأصلية والمضمّنة لأدوار وكيل OpenAI.
    - `/codex ...` - تحكم محادثة Codex الأصلي.
    - `/acp ...` أو `runtime: "acp"` - تحكم ACP/acpx صريح.

  </Accordion>
  <Accordion title="مشغّلات اللغة الطبيعية لتوجيه ACP">
    المشغّلات التي ينبغي أن تُوجَّه إلى بيئة تشغيل ACP:

    - "شغّل هذا كجلسة Claude Code ACP لمرة واحدة ولخّص النتيجة."
    - "استخدم Gemini CLI لهذه المهمة في سلسلة، ثم أبقِ المتابعات في السلسلة نفسها."
    - "شغّل Codex عبر ACP في سلسلة خلفية."

    يختار OpenClaw `runtime: "acp"`، ويحلّ `agentId` للحاضنة،
    ويرتبط بالمحادثة أو السلسلة الحالية عند دعم ذلك، ويوجّه
    المتابعات إلى تلك الجلسة حتى الإغلاق/انتهاء الصلاحية. لا يتبع Codex
    هذا المسار إلا عندما يكون ACP/acpx صريحًا أو عندما يكون Plugin
    Codex الأصلي غير متاح للعملية المطلوبة.

    بالنسبة إلى `sessions_spawn`، لا يُعلن `runtime: "acp"` إلا عندما يكون ACP
    مفعّلًا، ولا يكون الطالب داخل sandbox، وتكون خلفية بيئة تشغيل ACP
    محمّلة. يؤدي `acp.dispatch.enabled=false` إلى إيقاف الإرسال التلقائي
    لسلاسل ACP مؤقتًا لكنه لا يخفي أو يحظر استدعاءات
    `sessions_spawn({ runtime: "acp" })` الصريحة. يستهدف معرّفات حاضنة ACP مثل `codex`،
    أو `claude`، أو `droid`، أو `gemini`، أو `opencode`. لا تمرّر معرّف
    وكيل إعدادات OpenClaw عاديًا من `agents_list` إلا إذا كان ذلك الإدخال
    مهيأً صراحةً باستخدام `agents.list[].runtime.type="acp"`؛
    وإلا فاستخدم بيئة تشغيل الوكيل الفرعي الافتراضية. عندما يكون وكيل OpenClaw
    مهيأً باستخدام `runtime.type="acp"`، يستخدم OpenClaw
    `runtime.acp.agent` بوصفه معرّف الحاضنة الأساسي.

  </Accordion>
</AccordionGroup>

## ACP مقابل الوكلاء الفرعيين

استخدم ACP عندما تريد بيئة تشغيل حاضنة خارجية. استخدم **خادم تطبيق Codex
الأصلي** لربط/تحكم محادثة Codex عندما يكون Plugin `codex`
مفعّلًا. استخدم **الوكلاء الفرعيين** عندما تريد تشغيلات مفوّضة
أصلية من OpenClaw.

| المجال          | جلسة ACP                           | تشغيل وكيل فرعي                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| بيئة التشغيل       | Plugin خلفية ACP (مثل acpx) | بيئة تشغيل الوكيل الفرعي الأصلية من OpenClaw  |
| مفتاح الجلسة   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| الأوامر الرئيسية | `/acp ...`                            | `/subagents ...`                   |
| أداة الإنشاء    | `sessions_spawn` مع `runtime:"acp"` | `sessions_spawn` (بيئة التشغيل الافتراضية) |

انظر أيضًا [الوكلاء الفرعيين](/ar/tools/subagents).

## كيف يشغّل ACP ‏Claude Code

بالنسبة إلى Claude Code عبر ACP، تكون الحزمة:

1. مستوى التحكم بجلسة OpenClaw ACP.
2. Plugin بيئة التشغيل الرسمي `@openclaw/acpx`.
3. مهايئ Claude ACP.
4. آليات بيئة التشغيل/الجلسة من جانب Claude.

ACP Claude هو **جلسة حاضنة** مع عناصر تحكم ACP، واستئناف الجلسة،
وتتبّع المهام الخلفية، وربط اختياري بالمحادثة/السلسلة.

خلفيات CLI هي بيئات تشغيل احتياطية محلية نصية فقط ومنفصلة - راجع
[خلفيات CLI](/ar/gateway/cli-backends).

بالنسبة إلى المشغّلين، القاعدة العملية هي:

- **هل تريد `/acp spawn`، أو جلسات قابلة للربط، أو عناصر تحكم بيئة التشغيل، أو عمل حاضنة مستمر؟** استخدم ACP.
- **هل تريد احتياطًا نصيًا محليًا بسيطًا عبر CLI الخام؟** استخدم خلفيات CLI.

## الجلسات المرتبطة

### النموذج الذهني

- **سطح الدردشة** - المكان الذي يواصل فيه الأشخاص الحديث (قناة Discord، موضوع Telegram، دردشة iMessage).
- **جلسة ACP** - حالة بيئة تشغيل Codex/Claude/Gemini الدائمة التي يوجّه إليها OpenClaw.
- **سلسلة/موضوع فرعي** - سطح مراسلة إضافي اختياري يُنشأ فقط بواسطة `--thread ...`.
- **مساحة عمل بيئة التشغيل** - موقع نظام الملفات (`cwd`، نسخة المستودع، مساحة عمل الخلفية) حيث تعمل الحاضنة. مستقل عن سطح الدردشة.

### روابط المحادثة الحالية

يثبّت `/acp spawn <harness> --bind here` المحادثة الحالية على
جلسة ACP المنشأة - بلا سلسلة فرعية، ونفس سطح الدردشة. يظل OpenClaw
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
    - لا يعمل `--bind here` إلا على القنوات التي تعلن دعم ربط المحادثة الحالية؛ ويعيد OpenClaw رسالة واضحة تفيد بعدم الدعم خلاف ذلك. تستمر الروابط عبر إعادة تشغيل Gateway.
    - في Discord، يتحكم `spawnSessions` في إنشاء السلاسل الفرعية لـ `--thread auto|here` - وليس `--bind here`.
    - إذا أنشأت وكيل ACP مختلفًا دون `--cwd`، يرث OpenClaw مساحة عمل **الوكيل الهدف** افتراضيًا. تعود المسارات الموروثة المفقودة (`ENOENT`/`ENOTDIR`) إلى القيمة الافتراضية للخلفية؛ أما أخطاء الوصول الأخرى (مثل `EACCES`) فتظهر كأخطاء إنشاء.
    - تبقى أوامر إدارة Gateway محلية في المحادثات المرتبطة - تعالج OpenClaw أوامر `/acp ...` حتى عندما يُوجَّه نص المتابعة العادي إلى جلسة ACP المرتبطة؛ كما يبقى `/status` و`/unfocus` محليين كلما كان التعامل مع الأوامر مفعّلًا لذلك السطح.

  </Accordion>
  <Accordion title="الجلسات المرتبطة بالسلاسل">
    عندما تكون روابط السلاسل مفعّلة لمهايئ قناة:

    - يربط OpenClaw سلسلة بجلسة ACP مستهدفة.
    - تُوجَّه رسائل المتابعة في تلك السلسلة إلى جلسة ACP المرتبطة.
    - يُسلَّم خرج ACP مرة أخرى إلى السلسلة نفسها.
    - يؤدي إلغاء التركيز/الإغلاق/الأرشفة/مهلة الخمول أو انتهاء الحد الأقصى للعمر إلى إزالة الربط.
    - `/acp close` و`/acp cancel` و`/acp status` و`/status` و`/unfocus` هي أوامر Gateway، وليست مطالبات إلى حاضنة ACP.

    أعلام الميزات المطلوبة لـ ACP المرتبط بالسلاسل:

    - `acp.enabled=true`
    - يكون `acp.dispatch.enabled` مفعّلًا افتراضيًا (عيّنه إلى `false` لإيقاف إرسال سلاسل ACP التلقائي مؤقتًا؛ ستظل استدعاءات `sessions_spawn({ runtime: "acp" })` الصريحة تعمل).
    - إنشاء جلسات سلاسل مهايئ القناة مفعّل (افتراضيًا: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    دعم ربط السلاسل خاص بكل مهايئ. إذا كان مهايئ القناة النشط
    لا يدعم روابط السلاسل، يعيد OpenClaw رسالة واضحة
    تفيد بعدم الدعم/عدم التوفر.

  </Accordion>
  <Accordion title="القنوات التي تدعم السلاسل">
    - أي مهايئ قناة يعرّض قدرة ربط الجلسات/السلاسل.
    - الدعم المضمّن الحالي: سلاسل/قنوات **Discord**، ومواضيع **Telegram** (مواضيع المنتدى في المجموعات/المجموعات الفائقة ومواضيع الرسائل المباشرة).
    - يمكن لقنوات Plugin إضافة الدعم عبر واجهة الربط نفسها.

  </Accordion>
</AccordionGroup>

## روابط القنوات الدائمة

بالنسبة إلى سير العمل غير العابر، هيّئ روابط ACP الدائمة في
إدخالات `bindings[]` ذات المستوى الأعلى.

### نموذج الربط

<ParamField path="bindings[].type" type='"acp"'>
  يضع علامة على ربط محادثة ACP دائم.
</ParamField>
<ParamField path="bindings[].match" type="object">
  يحدد المحادثة الهدف. الأشكال حسب القناة:

- **قناة/سلسلة Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **قناة/رسالة مباشرة Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. فضّل معرّفات Slack الثابتة؛ تطابق روابط القنوات أيضًا الردود داخل سلاسل تلك القناة.
- **موضوع منتدى Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **رسالة مباشرة/مجموعة iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. فضّل `chat_id:*` لروابط المجموعات الثابتة.

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
  دليل عمل بيئة التشغيل الاختياري.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  تجاوز الخلفية الاختياري.
</ParamField>

### افتراضيات بيئة التشغيل لكل وكيل

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

- يضمن OpenClaw وجود جلسة ACP المُهيأة قبل استخدامها.
- تُوجَّه الرسائل في تلك القناة أو ذلك الموضوع إلى جلسة ACP المُهيأة.
- في المحادثات المرتبطة، يعيد `/new` و`/reset` تعيين مفتاح جلسة ACP نفسه في مكانه.
- تظل ارتباطات وقت التشغيل المؤقتة (مثل التي تُنشأ عبر تدفقات تركيز السلسلة) سارية حيثما وُجدت.
- عند إنشاء جلسات ACP عبر الوكلاء دون `cwd` صريح، يرث OpenClaw مساحة عمل الوكيل الهدف من إعدادات الوكيل.
- مسارات مساحة العمل الموروثة المفقودة تعود إلى cwd الافتراضي للخلفية؛ أما إخفاقات الوصول غير المفقودة فتظهر كأخطاء إنشاء.

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
    القيمة الافتراضية لـ `runtime` هي `subagent`، لذا عيّن `runtime: "acp"` صراحةً
    لجلسات ACP. إذا حُذف `agentId`، يستخدم OpenClaw
    `acp.defaultAgent` عند تهيئته. يتطلب `mode: "session"`
    وجود `thread: true` للحفاظ على محادثة مرتبطة مستمرة.
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

    الأعلام الرئيسية:

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
  الموجّه الأولي المُرسل إلى جلسة ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  يجب أن يكون `"acp"` لجلسات ACP.
</ParamField>
<ParamField path="agentId" type="string">
  معرّف حزمة تشغيل ACP الهدف. يعود إلى `acp.defaultAgent` إذا كان مضبوطًا.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  اطلب تدفق ربط السلسلة حيث يكون مدعومًا.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` تشغيل لمرة واحدة؛ أما `"session"` فهو مستمر. إذا كان `thread: true` و
  حُذف `mode`، فقد يجعل OpenClaw السلوك الافتراضي مستمرًا حسب
  مسار وقت التشغيل. يتطلب `mode: "session"` وجود `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  دليل عمل وقت التشغيل المطلوب (تتحقق منه سياسة الخلفية/وقت التشغيل).
  إذا حُذف، يرث إنشاء ACP مساحة عمل الوكيل الهدف
  عند تهيئتها؛ وتعود المسارات الموروثة المفقودة إلى
  إعدادات الخلفية الافتراضية، بينما تُعاد أخطاء الوصول الحقيقية.
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
  جلسة الطالب كأحداث نظام. تشمل الاستجابات المقبولة
  `streamLogPath` الذي يشير إلى سجل JSONL محدود بنطاق الجلسة
  (`<sessionId>.acp-stream.jsonl`) يمكنك تتبعه للحصول على سجل الترحيل الكامل.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  يُجهض دور ACP الفرعي بعد N ثانية. تُبقي `0` الدور على
  مسار عدم انتهاء المهلة الخاص بـ Gateway. تُطبَّق القيمة نفسها على تشغيل Gateway
  ووقت تشغيل ACP حتى لا تشغل حزم التشغيل المتوقفة/المستنفدة للحصة
  مسار الوكيل الأب إلى أجل غير مسمى.
</ParamField>
<ParamField path="model" type="string">
  تجاوز نموذج صريح لجلسة ACP الفرعية. تعمل عمليات إنشاء Codex ACP
  على تطبيع مراجع OpenClaw Codex مثل `openai-codex/gpt-5.4` إلى إعدادات بدء Codex
  ACP قبل `session/new`؛ كما تضبط صيغ Slash مثل
  `openai-codex/gpt-5.4/high` جهد الاستدلال في Codex ACP.
  يجب أن تعلن حزم التشغيل الأخرى عن `models` في ACP وأن تدعم
  `session/set_model`؛ وإلا يفشل OpenClaw/acpx بوضوح بدلًا من
  الرجوع بصمت إلى الإعداد الافتراضي للوكيل الهدف.
</ParamField>
<ParamField path="thinking" type="string">
  جهد تفكير/استدلال صريح. بالنسبة إلى Codex ACP، تُطابق `minimal`
  الجهد المنخفض، وتُطابق `low`/`medium`/`high`/`xhigh` مباشرةً، أما `off`
  فيحذف تجاوز جهد الاستدلال عند البدء.
</ParamField>

## أوضاع ربط الإنشاء والسلسلة

<Tabs>
  <Tab title="--bind here|off">
    | الوضع   | السلوك                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | اربط المحادثة النشطة الحالية في مكانها؛ وافشل إذا لم تكن هناك محادثة نشطة. |
    | `off`  | لا تُنشئ ربطًا للمحادثة الحالية.                          |

    ملاحظات:

    - `--bind here` هو أبسط مسار للمشغّل من أجل "اجعل هذه القناة أو الدردشة مدعومة بـ Codex."
    - لا يُنشئ `--bind here` سلسلة فرعية.
    - لا يتوفر `--bind here` إلا على القنوات التي تعرض دعم ربط المحادثة الحالية.
    - لا يمكن الجمع بين `--bind` و`--thread` في استدعاء `/acp spawn` نفسه.

  </Tab>
  <Tab title="--thread auto|here|off">
    | الوضع   | السلوك                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | داخل سلسلة نشطة: اربط تلك السلسلة. خارج سلسلة: أنشئ/اربط سلسلة فرعية عندما يكون ذلك مدعومًا. |
    | `here` | اشترط وجود سلسلة نشطة حالية؛ وافشل إذا لم تكن داخل واحدة.                                                  |
    | `off`  | بلا ربط. تبدأ الجلسة غير مرتبطة.                                                                 |

    ملاحظات:

    - على أسطح الربط غير المعتمدة على السلاسل، يكون السلوك الافتراضي فعليًا `off`.
    - يتطلب الإنشاء المرتبط بسلسلة دعمًا من سياسة القناة:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - استخدم `--bind here` عندما تريد تثبيت المحادثة الحالية دون إنشاء سلسلة فرعية.

  </Tab>
</Tabs>

## نموذج التسليم

يمكن أن تكون جلسات ACP إما مساحات عمل تفاعلية أو عملًا خلفيًا
مملوكًا للأب. يعتمد مسار التسليم على هذا الشكل.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    الغرض من الجلسات التفاعلية هو متابعة الحديث على سطح دردشة
    مرئي:

    - يربط `/acp spawn ... --bind here` المحادثة الحالية بجلسة ACP.
    - يربط `/acp spawn ... --thread ...` سلسلة/موضوع قناة بجلسة ACP.
    - تُوجّه ارتباطات `bindings[].type="acp"` المستمرة والمهيأة المحادثات المطابقة إلى جلسة ACP نفسها.

    تُوجَّه رسائل المتابعة في المحادثة المرتبطة مباشرةً إلى
    جلسة ACP، ويُسلَّم خرج ACP مرة أخرى إلى
    القناة/السلسلة/الموضوع نفسه.

    ما يرسله OpenClaw إلى حزمة التشغيل:

    - تُرسل المتابعات المرتبطة العادية كنص موجّه، مع المرفقات فقط عندما تدعمها حزمة التشغيل/الخلفية.
    - تُعترض أوامر إدارة `/acp` وأوامر Gateway المحلية قبل إرسال ACP.
    - تُجسَّد أحداث الإكمال التي ينشئها وقت التشغيل لكل هدف. تحصل وكلاء OpenClaw على غلاف سياق وقت التشغيل الداخلي في OpenClaw؛ وتحصل حزم تشغيل ACP الخارجية على موجّه عادي يتضمن نتيجة الابن والتعليمة. يجب ألا يُرسل غلاف `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` الخام إلى حزم التشغيل الخارجية أو يُحفظ كنص محضر مستخدم ACP.
    - تستخدم إدخالات محضر ACP نص المشغّل المرئي للمستخدم أو موجّه الإكمال العادي. تبقى بيانات الأحداث الوصفية الداخلية منظمة في OpenClaw حيثما أمكن ولا تُعامل كمحتوى دردشة كتبه المستخدم.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    جلسات ACP لمرة واحدة التي ينشئها تشغيل وكيل آخر هي أبناء
    في الخلفية، شبيهة بالوكلاء الفرعيين:

    - يطلب الأب عملًا باستخدام `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - يعمل الابن في جلسة حزمة تشغيل ACP الخاصة به.
    - تعمل أدوار الابن على مسار الخلفية نفسه المستخدم لعمليات إنشاء الوكلاء الفرعيين الأصلية، لذا لا تمنع حزمة تشغيل ACP البطيئة عمل الجلسة الرئيسية غير ذي الصلة.
    - تُرسل تقارير الإكمال عبر مسار إعلان إكمال المهمة. يحوّل OpenClaw بيانات الإكمال الوصفية الداخلية إلى موجّه ACP عادي قبل إرسالها إلى حزمة تشغيل خارجية، حتى لا ترى حزم التشغيل علامات سياق وقت التشغيل الخاصة بـ OpenClaw فقط.
    - يعيد الأب صياغة نتيجة الابن بصوت المساعد المعتاد عندما يكون الرد المرئي للمستخدم مفيدًا.

    **لا** تعامل هذا المسار كمحادثة ندية بين الأب
    والابن. لدى الابن بالفعل قناة إكمال عائدة إلى
    الأب.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    يمكن أن يستهدف `sessions_send` جلسة أخرى بعد الإنشاء. بالنسبة إلى
    الجلسات الندية العادية، يستخدم OpenClaw مسار متابعة من وكيل إلى وكيل (A2A)
    بعد حقن الرسالة:

    - انتظر رد الجلسة الهدف.
    - اختياريًا، اسمح للطالب والهدف بتبادل عدد محدود من أدوار المتابعة.
    - اطلب من الهدف إنتاج رسالة إعلان.
    - سلّم ذلك الإعلان إلى القناة أو السلسلة المرئية.

    يُعد مسار A2A هذا بديلًا احتياطيًا لعمليات الإرسال الندية عندما يحتاج المرسل إلى
    متابعة مرئية. يبقى مفعّلًا عندما تستطيع جلسة غير ذات صلة
    رؤية هدف ACP ومراسلته، على سبيل المثال ضمن إعدادات
    `tools.sessions.visibility` الواسعة.

    يتخطى OpenClaw متابعة A2A فقط عندما يكون الطالب هو
    أب ابنه ACP لمرة واحدة المملوك للأب نفسه. في هذه الحالة،
    قد يؤدي تشغيل A2A فوق إكمال المهمة إلى إيقاظ الأب بنتيجة
    الابن، وتمرير رد الأب مرة أخرى إلى الابن، وإنشاء
    حلقة صدى بين الأب والابن. تُبلغ نتيجة `sessions_send`
    عن `delivery.status="skipped"` لحالة الابن المملوك تلك لأن
    مسار الإكمال مسؤول بالفعل عن النتيجة.

  </Accordion>
  <Accordion title="Resume an existing session">
    استخدم `resumeSessionId` لمتابعة جلسة ACP سابقة بدلًا من
    البدء من جديد. يعيد الوكيل تشغيل سجل محادثته عبر
    `session/load`، لذا يستأنف بالسياق الكامل لما سبق.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    حالات الاستخدام الشائعة:

    - سلّم جلسة Codex من حاسوبك المحمول إلى هاتفك - أخبر وكيلك أن يواصل من حيث توقفت.
    - تابع جلسة برمجة بدأتها تفاعليًا في CLI، والآن دون واجهة عبر وكيلك.
    - استأنف عملًا انقطع بسبب إعادة تشغيل Gateway أو انتهاء مهلة الخمول.

    ملاحظات:

    - لا ينطبق `resumeSessionId` إلا عندما يكون `runtime: "acp"`؛ يتجاهل وقت تشغيل الوكيل الفرعي الافتراضي هذا الحقل الخاص بـ ACP فقط.
    - لا ينطبق `streamTo` إلا عندما يكون `runtime: "acp"`؛ يتجاهل وقت تشغيل الوكيل الفرعي الافتراضي هذا الحقل الخاص بـ ACP فقط.
    - `resumeSessionId` هو معرّف استئناف ACP/حزمة تشغيل محلي للمضيف، وليس مفتاح جلسة قناة OpenClaw؛ لا يزال OpenClaw يتحقق من سياسة إنشاء ACP وسياسة الوكيل الهدف قبل الإرسال، بينما تملك خلفية ACP أو حزمة التشغيل صلاحية تحميل ذلك المعرّف العلوي.
    - يستعيد `resumeSessionId` سجل محادثة ACP العلوية؛ ولا يزال `thread` و`mode` يطبقان بشكل طبيعي على جلسة OpenClaw الجديدة التي تنشئها، لذا ما زال `mode: "session"` يتطلب `thread: true`.
    - يجب أن يدعم الوكيل الهدف `session/load` (يدعمه Codex وClaude Code).
    - إذا لم يُعثر على معرّف الجلسة، يفشل الإنشاء بخطأ واضح - دون رجوع صامت إلى جلسة جديدة.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    بعد نشر Gateway، شغّل فحصًا حيًا من طرف إلى طرف بدلًا من
    الثقة باختبارات الوحدة:

    1. تحقّق من إصدار Gateway المنشور والالتزام على المضيف الهدف.
    2. افتح جلسة جسر ACPX مؤقتة إلى وكيل حي.
    3. اطلب من ذلك الوكيل استدعاء `sessions_spawn` مع `runtime: "acp"` و`agentId: "codex"` و`mode: "run"` والمهمة `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. تحقّق من `accepted=yes` ومن وجود `childSessionKey` حقيقي، ومن عدم وجود خطأ في أداة التحقق.
    5. نظّف جلسة الجسر المؤقتة.

    أبقِ البوابة على `mode: "run"` وتجاوز `streamTo: "parent"` -
    فالمسارات المرتبطة بالسلاسل في `mode: "session"` ومسارات ترحيل البث هي
    جولات تكامل أكثر ثراءً ومنفصلة.

  </Accordion>
</AccordionGroup>

## توافق صندوق العزل

تعمل جلسات ACP حاليًا على وقت تشغيل المضيف، **وليس** داخل صندوق عزل
OpenClaw.

<Warning>
**حد الأمان:**

- يمكن لأداة الاختبار الخارجية القراءة/الكتابة وفق أذونات CLI الخاصة بها و`cwd` المحدد.
- لا تغلّف سياسة صندوق العزل في OpenClaw تنفيذ أداة ACP.
- لا يزال OpenClaw يفرض بوابات ميزات ACP، والوكلاء المسموح بهم، وملكية الجلسات، وربط القنوات، وسياسة تسليم Gateway.
- استخدم `runtime: "subagent"` للعمل الأصلي في OpenClaw الذي يفرضه صندوق العزل.

</Warning>

القيود الحالية:

- إذا كانت جلسة الطالب معزولة، فسيتم حظر إنشاء جلسات ACP لكل من `sessions_spawn({ runtime: "acp" })` و`/acp spawn`.
- لا يدعم `sessions_spawn` مع `runtime: "acp"` الخيار `sandbox: "require"`.

## حل هدف الجلسة

تقبل معظم إجراءات `/acp` هدف جلسة اختياريًا (`session-key` أو
`session-id` أو `session-label`).

**ترتيب الحل:**

1. وسيطة هدف صريحة (أو `--session` لـ `/acp steer`)
   - يجرّب المفتاح
   - ثم معرّف جلسة على شكل UUID
   - ثم التسمية
2. ربط السلسلة الحالية (إذا كانت هذه المحادثة/السلسلة مرتبطة بجلسة ACP).
3. الرجوع إلى جلسة الطالب الحالية.

تشارك روابط المحادثة الحالية وروابط السلاسل كلاهما في
الخطوة 2.

إذا لم يتم حل أي هدف، يعيد OpenClaw خطأً واضحًا
(`Unable to resolve session target: ...`).

## عناصر تحكم ACP

| الأمر                 | ما يفعله                                                  | مثال                                                         |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | إنشاء جلسة ACP؛ مع ربط حالي اختياري أو ربط سلسلة.         | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | إلغاء الدور قيد التنفيذ لجلسة الهدف.                      | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | إرسال تعليمة توجيه إلى جلسة قيد التشغيل.                  | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | إغلاق الجلسة وإلغاء ربط أهداف السلسلة.                    | `/acp close`                                                  |
| `/acp status`        | عرض الخلفية، والوضع، والحالة، وخيارات وقت التشغيل، والقدرات. | `/acp status`                                                 |
| `/acp set-mode`      | تعيين وضع وقت التشغيل لجلسة الهدف.                        | `/acp set-mode plan`                                          |
| `/acp set`           | كتابة خيار تكوين عام لوقت التشغيل.                        | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | تعيين تجاوز دليل العمل لوقت التشغيل.                      | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | تعيين ملف تعريف سياسة الموافقة.                           | `/acp permissions strict`                                     |
| `/acp timeout`       | تعيين مهلة وقت التشغيل (بالثواني).                        | `/acp timeout 120`                                            |
| `/acp model`         | تعيين تجاوز نموذج وقت التشغيل.                            | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | إزالة تجاوزات خيارات وقت تشغيل الجلسة.                    | `/acp reset-options`                                          |
| `/acp sessions`      | سرد جلسات ACP الأخيرة من المخزن.                          | `/acp sessions`                                               |
| `/acp doctor`        | صحة الخلفية، والقدرات، وإصلاحات قابلة للتنفيذ.            | `/acp doctor`                                                 |
| `/acp install`       | طباعة خطوات تثبيت وتمكين حتمية.                           | `/acp install`                                                |

يعرض `/acp status` خيارات وقت التشغيل الفعالة بالإضافة إلى معرّفات الجلسة
على مستوى وقت التشغيل ومستوى الخلفية. تظهر أخطاء عناصر التحكم غير المدعومة
بوضوح عندما تفتقر الخلفية إلى قدرة. يقرأ `/acp sessions` المخزن للجلسة
المرتبطة الحالية أو جلسة الطالب؛ وتُحل رموز الهدف
(`session-key` أو `session-id` أو `session-label`) عبر
اكتشاف جلسات Gateway، بما في ذلك جذور `session.store` المخصصة لكل وكيل.

### تعيين خيارات وقت التشغيل

يحتوي `/acp` على أوامر ملائمة ومُعيِّن عام. العمليات المكافئة:

| الأمر                        | يُعيَّن إلى                            | ملاحظات                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | مفتاح تكوين وقت التشغيل `model`       | بالنسبة إلى Codex ACP، يطبّع OpenClaw `openai-codex/<model>` إلى معرّف نموذج المحوّل، ويعيّن لواحق الاستدلال بشرطة مائلة مثل `openai-codex/gpt-5.4/high` إلى `reasoning_effort`.                         |
| `/acp set thinking <level>`  | الخيار القانوني `thinking`            | يرسل OpenClaw المكافئ الذي تعلنه الخلفية عند وجوده، مفضّلًا `thinking`، ثم `effort`، أو `reasoning_effort`، أو `thought_level`. بالنسبة إلى Codex ACP، يعيّن المحوّل القيم إلى `reasoning_effort`. |
| `/acp permissions <profile>` | الخيار القانوني `permissionProfile`   | يرسل OpenClaw المكافئ الذي تعلنه الخلفية عند وجوده، مثل `approval_policy` أو `permission_profile` أو `permissions` أو `permission_mode`.                                                                     |
| `/acp timeout <seconds>`     | الخيار القانوني `timeoutSeconds`      | يرسل OpenClaw المكافئ الذي تعلنه الخلفية عند وجوده، مثل `timeout` أو `timeout_seconds`.                                                                                                                     |
| `/acp cwd <path>`            | تجاوز cwd لوقت التشغيل                | تحديث مباشر.                                                                                                                                                                                                 |
| `/acp set <key> <value>`     | عام                                  | يستخدم `key=cwd` مسار تجاوز cwd.                                                                                                                                                                             |
| `/acp reset-options`         | يمسح كل تجاوزات وقت التشغيل           | -                                                                                                                                                                                                            |

## أداة acpx، وإعداد Plugin، والأذونات

للاطلاع على تكوين أداة acpx (أسماء Claude Code / Codex / Gemini CLI
المستعارة)، وجسور MCP الخاصة بـ plugin-tools وOpenClaw-tools، وأوضاع
أذونات ACP، راجع
[إعداد وكلاء ACP](/ar/tools/acp-agents-setup).

## استكشاف الأخطاء وإصلاحها

| العَرَض                                                                     | السبب المحتمل                                                                                                           | الإصلاح                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin الخلفية مفقود أو معطّل أو محظور بواسطة `plugins.allow`.                                                       | ثبّت Plugin الخلفية وفعّله، وأدرج `acpx` في `plugins.allow` عند ضبط قائمة السماح هذه، ثم شغّل `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP معطّل عمومًا.                                                                                                 | اضبط `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | الإرسال التلقائي من رسائل السلسلة العادية معطّل.                                                               | اضبط `acp.dispatch.enabled=true` لاستئناف توجيه السلاسل تلقائيًا؛ لا تزال استدعاءات `sessions_spawn({ runtime: "acp" })` الصريحة تعمل.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | الوكيل غير موجود في قائمة السماح.                                                                                                | استخدم `agentId` مسموحًا به أو حدّث `acp.allowedAgents`.                                                                                                                     |
| يبلّغ `/acp doctor` أن الخلفية غير جاهزة مباشرة بعد بدء التشغيل                 | Plugin الخلفية مفقود أو معطّل أو محظور بسياسة السماح/المنع، أو الملف التنفيذي المضبوط له غير متاح.        | ثبّت/فعّل Plugin الخلفية، وأعد تشغيل `/acp doctor`، وافحص خطأ التثبيت أو السياسة الخاص بالخلفية إذا ظلّت غير سليمة.                                           |
| لم يُعثر على أمر الحزمة                                                   | CLI المحوّل غير مثبّت، أو Plugin الخارجي مفقود، أو فشل جلب `npx` في التشغيل الأول لمحوّل غير Codex. | شغّل `/acp doctor`، وثبّت/سخّن المحوّل مسبقًا على مضيف Gateway، أو اضبط أمر وكيل acpx صراحةً.                                                      |
| خطأ عدم العثور على النموذج من الحزمة                                            | معرّف النموذج صالح لمزوّد/حزمة أخرى، لكنه غير صالح لهدف ACP هذا.                                                | استخدم نموذجًا تسرده تلك الحزمة، أو اضبط النموذج في الحزمة، أو احذف التجاوز.                                                                            |
| خطأ مصادقة المورّد من الحزمة                                          | OpenClaw سليم، لكن CLI/المزوّد الهدف لم يسجّل الدخول.                                                     | سجّل الدخول أو وفّر مفتاح المزوّد المطلوب في بيئة مضيف Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | مفتاح/معرّف/رمز تسمية غير صحيح.                                                                                                | شغّل `/acp sessions`، وانسخ المفتاح/التسمية بالضبط، ثم أعد المحاولة.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | استُخدم `--bind here` من دون محادثة نشطة قابلة للربط.                                                            | انتقل إلى الدردشة/القناة الهدف وأعد المحاولة، أو استخدم إنشاءً غير مربوط.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | يفتقر المحوّل إلى قدرة ربط ACP بالمحادثة الحالية.                                                             | استخدم `/acp spawn ... --thread ...` حيثما يكون مدعومًا، أو اضبط `bindings[]` على المستوى الأعلى، أو انتقل إلى قناة مدعومة.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | استُخدم `--thread here` خارج سياق سلسلة.                                                                         | انتقل إلى السلسلة الهدف أو استخدم `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | يملك مستخدم آخر هدف الربط النشط.                                                                           | أعد الربط بصفتك المالك أو استخدم محادثة أو سلسلة مختلفة.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | يفتقر المحوّل إلى قدرة ربط السلاسل.                                                                               | استخدم `--thread off` أو انتقل إلى محوّل/قناة مدعومة.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | وقت تشغيل ACP يعمل على جهة المضيف؛ وجلسة الطالب داخل sandbox.                                                              | استخدم `runtime="subagent"` من الجلسات داخل sandbox، أو شغّل إنشاء ACP من جلسة ليست داخل sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | طُلب `sandbox="require"` لوقت تشغيل ACP.                                                                         | استخدم `runtime="subagent"` عند اشتراط sandbox، أو استخدم ACP مع `sandbox="inherit"` من جلسة ليست داخل sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | لا تعرض الحزمة الهدف تبديل نماذج ACP العام.                                                        | استخدم حزمة تعلن ACP `models`/`session/set_model`، أو استخدم مراجع نموذج Codex ACP، أو اضبط النموذج مباشرة في الحزمة إذا كان لديها علم بدء تشغيل خاص بها. |
| بيانات ACP الوصفية مفقودة للجلسة المربوطة                                      | بيانات وصفية قديمة/محذوفة لجلسة ACP.                                                                                    | أعد إنشاءها باستخدام `/acp spawn`، ثم أعد ربط/تركيز السلسلة.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | يحظر `permissionMode` الكتابة/التنفيذ في جلسة ACP غير تفاعلية.                                                    | اضبط `plugins.entries.acpx.config.permissionMode` على `approve-all` وأعد تشغيل Gateway. راجع [إعداد الأذونات](/ar/tools/acp-agents-setup#permission-configuration). |
| تفشل جلسة ACP مبكرًا مع مخرجات قليلة                                  | مطالبات الأذونات محظورة بواسطة `permissionMode`/`nonInteractivePermissions`.                                        | افحص سجلات Gateway بحثًا عن `AcpRuntimeError`. للأذونات الكاملة، اضبط `permissionMode=approve-all`؛ وللتدهور السلس، اضبط `nonInteractivePermissions=deny`.        |
| تتوقف جلسة ACP إلى أجل غير مسمى بعد إكمال العمل                       | انتهت عملية الحزمة لكن جلسة ACP لم تبلّغ عن الاكتمال.                                                    | حدّث OpenClaw؛ إن تنظيف acpx الحالي يجني عمليات الغلاف والمحوّل القديمة المملوكة لـ OpenClaw عند الإغلاق وبدء تشغيل Gateway.                                             |
| ترى الحزمة `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | تسرّب غلاف الحدث الداخلي عبر حدود ACP.                                                                | حدّث OpenClaw وأعد تشغيل تدفق الإكمال؛ يجب أن تتلقى الحزم الخارجية مطالبات إكمال عادية فقط.                                                          |

## ذات صلة

- [وكلاء ACP - الإعداد](/ar/tools/acp-agents-setup)
- [إرسال الوكيل](/ar/tools/agent-send)
- [خلفيات CLI](/ar/gateway/cli-backends)
- [حزمة Codex](/ar/plugins/codex-harness)
- [وقت تشغيل حزمة Codex](/ar/plugins/codex-harness-runtime)
- [أدوات sandbox متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (وضع الجسر)](/ar/cli/acp)
- [الوكلاء الفرعيون](/ar/tools/subagents)
