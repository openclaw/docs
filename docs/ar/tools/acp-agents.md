---
read_when:
    - تشغيل harnesses الخاصة بالبرمجة عبر ACP
    - إعداد جلسات ACP المرتبطة بالمحادثة على قنوات المراسلة
    - ربط محادثة قناة مراسلة بجلسة ACP دائمة
    - استكشاف أخطاء الواجهة الخلفية لـ ACP وربط Plugin وإصلاحها
    - تصحيح أخطاء تسليم إكمال ACP أو الحلقات بين الوكلاء
    - تشغيل أوامر `/acp` من الدردشة
summary: استخدم جلسات وقت التشغيل ACP لـ Claude Code وCursor وGemini CLI وCodex ACP الاحتياطي الصريح وOpenClaw ACP ووكلاء harness الآخرين
title: وكلاء ACP
x-i18n:
    generated_at: "2026-04-24T08:06:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d59c5aa858e7888c9188ec9fc7dd5bcb9c8a5458f40d6458a5157ebc16332c2
    source_path: tools/acp-agents.md
    workflow: 15
---

تتيح جلسات [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) لـ OpenClaw تشغيل harnesses خارجية للبرمجة (مثل Pi وClaude Code وCursor وCopilot وOpenClaw ACP وOpenCode وGemini CLI وغيرها من harnesses المدعومة من ACPX) عبر Plugin واجهة خلفية لـ ACP.

إذا طلبت من OpenClaw بلغة طبيعية ربط Codex أو التحكم فيه داخل المحادثة الحالية، فيجب على OpenClaw استخدام Plugin app-server الأصلي لـ Codex ‏(`/codex bind` و`/codex threads` و`/codex resume`). وإذا طلبت `/acp` أو ACP أو acpx أو جلسة فرعية خلفية لـ Codex، فلا يزال بإمكان OpenClaw توجيه Codex عبر ACP. ويُتتبّع كل إنشاء لجلسة ACP بوصفه [مهمة خلفية](/ar/automation/tasks).

إذا طلبت من OpenClaw بلغة طبيعية "بدء Claude Code في thread" أو استخدام harness خارجية أخرى، فيجب على OpenClaw توجيه هذا الطلب إلى وقت تشغيل ACP (وليس إلى وقت تشغيل الوكيل الفرعي الأصلي).

إذا كنت تريد أن يتصل Codex أو Claude Code مباشرة بوصفه عميل MCP خارجيًا
بمحادثات القنوات الحالية في OpenClaw، فاستخدم [`openclaw mcp serve`](/ar/cli/mcp)
بدلًا من ACP.

## أي صفحة أريد؟

هناك ثلاثة أسطح قريبة من بعضها يسهل الخلط بينها:

| تريد أن...                                                                                   | استخدم هذا                             | ملاحظات                                                                                                                                                           |
| -------------------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| تربط Codex أو تتحكم فيه في المحادثة الحالية                                                  | `/codex bind`, `/codex threads`        | مسار app-server الأصلي لـ Codex؛ ويتضمن ردود الدردشة المرتبطة، وتمرير الصور، وعناصر التحكم في model/fast/permissions، والإيقاف، والتوجيه. ACP هو fallback صريح |
| تشغّل Claude Code أو Gemini CLI أو Codex ACP الصريح أو harness خارجية أخرى _عبر_ OpenClaw | هذه الصفحة: وكلاء ACP                  | جلسات مرتبطة بالدردشة، و`/acp spawn`، و`sessions_spawn({ runtime: "acp" })`، والمهام الخلفية، وعناصر التحكم بوقت التشغيل                                         |
| تعرض جلسة OpenClaw Gateway _بوصفها_ خادم ACP لمحرر أو عميل                                  | [`openclaw acp`](/ar/cli/acp)             | وضع الجسر. يتحدث IDE/العميل ACP إلى OpenClaw عبر stdio/WebSocket                                                                                                 |
| تعيد استخدام CLI محلي للذكاء الاصطناعي بوصفه نموذج fallback نصي فقط                         | [CLI Backends](/ar/gateway/cli-backends)  | ليس ACP. لا توجد أدوات OpenClaw، ولا عناصر تحكم ACP، ولا وقت تشغيل harness                                                                                       |

## هل يعمل هذا مباشرة؟

عادة نعم. فعمليات التثبيت الجديدة تشحن Plugin وقت التشغيل المضمن `acpx` مفعّلًا افتراضيًا، مع ملف `acpx` ثنائي مثبت محليًا داخل Plugin يقوم OpenClaw بفحصه وإصلاحه ذاتيًا عند بدء التشغيل. شغّل `/acp doctor` لإجراء فحص الجاهزية.

المشكلات الشائعة عند أول تشغيل:

- قد تُجلَب مهايئات harness المستهدفة (Codex وClaude وغيرهما) عند الطلب باستخدام `npx` في أول مرة تستخدمها.
- يجب أن تكون مصادقة المورّد موجودة بالفعل على المضيف لتلك harness.
- إذا لم يكن لدى المضيف npm أو وصول إلى الشبكة، فإن جلب المهايئات في أول تشغيل يفشل إلى أن تُسخّن الذاكرات المؤقتة مسبقًا أو يُثبّت المهايئ بطريقة أخرى.

## دليل التشغيل للمشغّل

تدفق `/acp` سريع من داخل الدردشة:

1. **إنشاء** — `/acp spawn claude --bind here` أو `/acp spawn gemini --mode persistent --thread auto` أو الصيغة الصريحة `/acp spawn codex --bind here`
2. **اعمل** في المحادثة أو thread المرتبطة (أو استهدف مفتاح الجلسة صراحةً).
3. **تحقق من الحالة** — `/acp status`
4. **اضبط** — `/acp model <provider/model>` و`/acp permissions <profile>` و`/acp timeout <seconds>`
5. **وجّه** من دون استبدال السياق — `/acp steer tighten logging and continue`
6. **أوقف** — `/acp cancel` ‏(الدور الحالي) أو `/acp close` ‏(الجلسة + الارتباطات)

المحفزات باللغة الطبيعية التي ينبغي توجيهها إلى Plugin ‏Codex الأصلي:

- "اربط قناة Discord هذه بـ Codex."
- "أرفق هذه الدردشة بـ Codex thread `<id>`."
- "اعرض Codex threads، ثم اربط هذه."

يُعد ربط محادثات Codex الأصلي المسار الافتراضي للتحكم من الدردشة، لكنه متحفظ عمدًا لتدفقات الموافقة/الأدوات التفاعلية في Codex: إذ لم تُكشف بعد أدوات OpenClaw الديناميكية ومطالبات الموافقة عبر مسار الدردشة المرتبطة هذا، لذا تُرفض هذه الطلبات مع شرح واضح. استخدم مسار harness الخاص بـ Codex أو fallback الصريح إلى ACP عندما يعتمد سير العمل على أدوات OpenClaw الديناميكية أو الموافقات التفاعلية طويلة التشغيل.

المحفزات باللغة الطبيعية التي ينبغي توجيهها إلى وقت تشغيل ACP:

- "شغّل هذا بوصفه جلسة Claude Code ACP أحادية اللقطة ولخّص النتيجة."
- "استخدم Gemini CLI لهذه المهمة في thread، ثم احتفظ بالمتابعات في thread نفسها."
- "شغّل Codex عبر ACP في thread خلفية."

يختار OpenClaw القيمة `runtime: "acp"`، ويحل `agentId` الخاص بـ harness، ويرتبط بالمحادثة أو thread الحالية عند الدعم، ويوجّه المتابعات إلى تلك الجلسة حتى الإغلاق/الانتهاء. ولا يتبع Codex هذا المسار إلا عندما يكون ACP صريحًا أو عندما يظل وقت التشغيل الخلفي المطلوب بحاجة إلى ACP.

## ACP مقابل الوكلاء الفرعيين

استخدم ACP عندما تريد وقت تشغيل harness خارجية. استخدم app-server الأصلي لـ Codex لربط/التحكم في محادثات Codex. واستخدم الوكلاء الفرعيين عندما تريد عمليات تشغيل مفوضة أصلية من OpenClaw.

| المجال        | جلسة ACP                              | تشغيل وكيل فرعي                      |
| ------------- | ------------------------------------- | ------------------------------------ |
| وقت التشغيل   | Plugin واجهة خلفية لـ ACP ‏(مثل acpx) | وقت تشغيل الوكيل الفرعي الأصلي في OpenClaw |
| مفتاح الجلسة  | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`    |
| الأوامر الرئيسية | `/acp ...`                          | `/subagents ...`                     |
| أداة الإنشاء  | `sessions_spawn` مع `runtime:"acp"`   | `sessions_spawn` ‏(وقت التشغيل الافتراضي) |

راجع أيضًا [Sub-agents](/ar/tools/subagents).

## كيف يشغّل ACP ‏Claude Code

بالنسبة إلى Claude Code عبر ACP، تكون الطبقات كما يلي:

1. مستوى التحكم في جلسة OpenClaw ACP
2. Plugin وقت التشغيل المضمن `acpx`
3. مهايئ Claude ACP
4. آلية وقت التشغيل/الجلسة من جهة Claude

تمييز مهم:

- ACP Claude هو جلسة harness مع عناصر تحكم ACP، واستئناف الجلسة، وتتبع المهام الخلفية، وربط اختياري بالمحادثة/الـ thread.
- أما CLI backends فهي أزمنة تشغيل fallback محلية منفصلة للنص فقط. راجع [CLI Backends](/ar/gateway/cli-backends).

وبالنسبة إلى المشغلين، فالقاعدة العملية هي:

- إذا كنت تريد `/acp spawn` أو جلسات قابلة للربط أو عناصر تحكم وقت التشغيل أو عمل harness دائم: استخدم ACP
- إذا كنت تريد fallback نصيًا محليًا بسيطًا عبر CLI الخام: استخدم CLI backends

## الجلسات المرتبطة

### الارتباطات بالمحادثة الحالية

يثبّت `/acp spawn <harness> --bind here` المحادثة الحالية على جلسة ACP التي أُنشئت — من دون thread فرعية، وعلى سطح الدردشة نفسه. ويواصل OpenClaw امتلاك النقل، والمصادقة، والسلامة، والتسليم؛ وتُوجَّه الرسائل اللاحقة في تلك المحادثة إلى الجلسة نفسها؛ ويعيد `/new` و`/reset` ضبط الجلسة في مكانها؛ ويزيل `/acp close` الارتباط.

النموذج الذهني:

- **سطح الدردشة** — المكان الذي يواصل فيه الأشخاص الكلام (قناة Discord، أو موضوع Telegram، أو دردشة iMessage).
- **جلسة ACP** — حالة Codex/Claude/Gemini الدائمة في وقت التشغيل التي يوجّه إليها OpenClaw.
- **thread/topic فرعية** — سطح مراسلة إضافي اختياري يُنشأ فقط بواسطة `--thread ...`.
- **مساحة عمل وقت التشغيل** — موقع نظام الملفات (`cwd`، أو checkout للمستودع، أو مساحة عمل الواجهة الخلفية) الذي تعمل فيه harness. وهو مستقل عن سطح الدردشة.

أمثلة:

- `/codex bind` — احتفظ بهذه الدردشة، وأنشئ أو أرفق app-server أصليًا لـ Codex، ووجّه الرسائل المستقبلية هنا.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — اضبط Codex thread الأصلية المرتبطة من داخل الدردشة.
- `/codex stop` أو `/codex steer focus on the failing tests first` — تحكم في دور Codex الأصلي النشط.
- `/acp spawn codex --bind here` — fallback صريح إلى ACP بالنسبة إلى Codex.
- `/acp spawn codex --thread auto` — قد ينشئ OpenClaw thread/topic فرعية ويربطها هناك.
- `/acp spawn codex --bind here --cwd /workspace/repo` — ربط بالدردشة نفسها، بينما يعمل Codex في `/workspace/repo`.

ملاحظات:

- لا يمكن استخدام `--bind here` و`--thread ...` معًا.
- يعمل `--bind here` فقط على القنوات التي تعلن دعم الربط بالمحادثة الحالية؛ وإلا يعيد OpenClaw رسالة واضحة تفيد بعدم الدعم. وتستمر الارتباطات عبر إعادة تشغيل gateway.
- في Discord، لا يُطلب `spawnAcpSessions` إلا عندما يحتاج OpenClaw إلى إنشاء thread فرعية لـ `--thread auto|here` — وليس لـ `--bind here`.
- إذا أنشأت جلسة لوكيل ACP مختلف من دون `--cwd`، فإن OpenClaw يرث مساحة عمل **الوكيل الهدف** افتراضيًا. أما المسارات الموروثة المفقودة (`ENOENT`/`ENOTDIR`) فتعود إلى الافتراضي في الواجهة الخلفية؛ بينما تظهر أخطاء الوصول الأخرى (مثل `EACCES`) بوصفها أخطاء إنشاء.

### الجلسات المرتبطة بالـ thread

عندما تكون ارتباطات الـ thread مفعلة لمهايئ قناة، يمكن ربط جلسات ACP بالـ threads:

- يربط OpenClaw thread بجلسة ACP مستهدفة.
- تُوجَّه الرسائل اللاحقة في تلك thread إلى جلسة ACP المرتبطة.
- يُسلَّم خرج ACP مرة أخرى إلى thread نفسها.
- تؤدي عمليات unfocus/الإغلاق/الأرشفة/انتهاء مهلة الخمول أو انتهاء العمر الأقصى إلى إزالة الارتباط.

يعتمد دعم الارتباط بالـ thread على المهايئ. وإذا لم يكن مهايئ القناة النشط يدعم ارتباطات الـ thread، فسيعيد OpenClaw رسالة واضحة تفيد بعدم الدعم/عدم التوفر.

علامات الميزات المطلوبة لارتباط ACP بالـ thread:

- `acp.enabled=true`
- تكون `acp.dispatch.enabled` مفعلة افتراضيًا (اضبطها على `false` لإيقاف dispatch الخاص بـ ACP مؤقتًا)
- تمكين علامة إنشاء ACP thread في مهايئ القناة (بحسب المهايئ)
  - Discord: ‏`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: ‏`channels.telegram.threadBindings.spawnAcpSessions=true`

### القنوات الداعمة للـ thread

- أي مهايئ قناة يكشف عن قدرة ربط الجلسة/الـ thread.
- الدعم المضمن الحالي:
  - Discord threads/channels
  - Telegram topics ‏(مواضيع المنتدى في المجموعات/supergroups ومواضيع الرسائل المباشرة)
- يمكن لقنوات Plugin إضافة الدعم عبر واجهة الربط نفسها.

## إعدادات خاصة بالقناة

بالنسبة إلى تدفقات العمل غير المؤقتة، هيئ ارتباطات ACP دائمة في إدخالات `bindings[]` على المستوى الأعلى.

### نموذج الربط

- تشير `bindings[].type="acp"` إلى ارتباط محادثة ACP دائم.
- تحدد `bindings[].match` المحادثة المستهدفة:
  - قناة أو thread في Discord: ‏`match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - موضوع منتدى Telegram: ‏`match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - دردشة DM/مجموعة في BlueBubbles: ‏`match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    يُفضّل استخدام `chat_id:*` أو `chat_identifier:*` من أجل ارتباطات المجموعات المستقرة.
  - دردشة DM/مجموعة في iMessage: ‏`match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    يُفضّل استخدام `chat_id:*` من أجل ارتباطات المجموعات المستقرة.
- `bindings[].agentId` هو معرّف وكيل OpenClaw المالك.
- توجد تجاوزات ACP الاختيارية ضمن `bindings[].acp`:
  - `mode` ‏(`persistent` أو `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### الإعدادات الافتراضية لوقت التشغيل لكل وكيل

استخدم `agents.list[].runtime` لتعريف إعدادات ACP الافتراضية مرة واحدة لكل وكيل:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` ‏(معرّف harness، مثل `codex` أو `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

أولوية التجاوز لجلسات ACP المرتبطة:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. إعدادات ACP الافتراضية العامة (مثل `acp.backend`)

مثال:

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

السلوك:

- يضمن OpenClaw وجود جلسة ACP المهيأة قبل استخدامها.
- تُوجَّه الرسائل في تلك القناة أو الموضوع إلى جلسة ACP المهيأة.
- في المحادثات المرتبطة، يعيد `/new` و`/reset` ضبط مفتاح جلسة ACP نفسه في مكانه.
- لا تزال ارتباطات وقت التشغيل المؤقتة (مثل التي تنشئها تدفقات التركيز على thread) تُطبَّق حيثما وُجدت.
- عند إنشاء ACP عبر وكلاء متعددين من دون `cwd` صريح، يرث OpenClaw مساحة عمل الوكيل الهدف من تهيئة الوكيل.
- تعود مسارات مساحة العمل الموروثة المفقودة إلى `cwd` الافتراضي للواجهة الخلفية؛ أما إخفاقات الوصول للمسارات غير المفقودة فتظهر بوصفها أخطاء إنشاء.

## بدء جلسات ACP ‏(الواجهات)

### من `sessions_spawn`

استخدم `runtime: "acp"` لبدء جلسة ACP من دور وكيل أو استدعاء أداة.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

ملاحظات:

- تكون القيمة الافتراضية لـ `runtime` هي `subagent`، لذا اضبط `runtime: "acp"` صراحةً لجلسات ACP.
- إذا تم حذف `agentId`، يستخدم OpenClaw القيمة `acp.defaultAgent` عند تهيئتها.
- تتطلب `mode: "session"` القيمة `thread: true` للاحتفاظ بمحادثة مرتبطة ودائمة.

تفاصيل الواجهة:

- `task` ‏(مطلوب): المطالبة الأولية المرسلة إلى جلسة ACP.
- `runtime` ‏(مطلوب لـ ACP): يجب أن تكون `"acp"`.
- `agentId` ‏(اختياري): معرّف harness الهدف لـ ACP. ويعود إلى `acp.defaultAgent` إذا كانت مضبوطة.
- `thread` ‏(اختياري، الافتراضي `false`): طلب تدفق ربط thread عندما يكون مدعومًا.
- `mode` ‏(اختياري): ‏`run` ‏(أحادي اللقطة) أو `session` ‏(دائم).
  - الافتراضي هو `run`
  - إذا كانت `thread: true` وتم حذف mode، فقد يضبط OpenClaw السلوك الدائم افتراضيًا بحسب مسار وقت التشغيل
  - تتطلب `mode: "session"` القيمة `thread: true`
- `cwd` ‏(اختياري): دليل العمل المطلوب لوقت التشغيل (ويتحقق منه وفق سياسة الواجهة الخلفية/وقت التشغيل). وإذا حُذف، فإن إنشاء ACP يرث مساحة عمل الوكيل الهدف عند تهيئتها؛ وتعود المسارات الموروثة المفقودة إلى الإعدادات الافتراضية للواجهة الخلفية، بينما تُعاد أخطاء الوصول الحقيقية.
- `label` ‏(اختياري): تسمية موجهة للمشغل تُستخدم في نص الجلسة/الشريط.
- `resumeSessionId` ‏(اختياري): استئناف جلسة ACP موجودة بدلًا من إنشاء جلسة جديدة. ويعيد الوكيل تشغيل محفوظات محادثته عبر `session/load`. ويتطلب `runtime: "acp"`.
- `streamTo` ‏(اختياري): القيمة `"parent"` تبث ملخصات تقدم تشغيل ACP الأولي مرة أخرى إلى جلسة الطالب بوصفها أحداث نظام.
  - عند توفرها، تتضمن الردود المقبولة `streamLogPath` يشير إلى سجل JSONL على مستوى الجلسة (`<sessionId>.acp-stream.jsonl`) يمكنك تتبعه للحصول على سجل relay الكامل.
- `model` ‏(اختياري): تجاوز صريح للنموذج الخاص بجلسة ACP الفرعية. ويُحترم مع `runtime: "acp"` حتى تستخدم الجلسة الفرعية النموذج المطلوب بدلًا من العودة بصمت إلى الافتراضي الخاص بالوكيل الهدف.

## نموذج التسليم

يمكن أن تكون جلسات ACP إما مساحات عمل تفاعلية أو أعمالًا خلفية يملكها الأصل. ويعتمد مسار التسليم على ذلك الشكل.

### جلسات ACP التفاعلية

الجلسات التفاعلية مخصصة لمواصلة الحديث على سطح دردشة مرئي:

- يقوم `/acp spawn ... --bind here` بربط المحادثة الحالية بجلسة ACP.
- يقوم `/acp spawn ... --thread ...` بربط channel thread/topic بجلسة ACP.
- تقوم `bindings[].type="acp"` الدائمة والمهيأة بتوجيه المحادثات المطابقة إلى جلسة ACP نفسها.

تُوجَّه رسائل المتابعة في المحادثة المرتبطة مباشرة إلى جلسة ACP، ويُسلَّم خرج ACP مرة أخرى إلى القناة/الـ thread/الموضوع نفسه.

### جلسات ACP أحادية اللقطة المملوكة للأصل

جلسات ACP أحادية اللقطة التي ينشئها تشغيل وكيل آخر هي أبناء خلفيون، على نحو مشابه للوكلاء الفرعيين:

- يطلب الأصل تنفيذ العمل باستخدام `sessions_spawn({ runtime: "acp", mode: "run" })`.
- يعمل الابن ضمن جلسة harness ACP مستقلة.
- يبلغ الإكمال مرة أخرى عبر المسار الداخلي للإعلان عن إكمال المهمة.
- يعيد الأصل صياغة نتيجة الابن بصوت المساعد العادي عندما يكون الرد الموجه للمستخدم مفيدًا.

لا تتعامل مع هذا المسار على أنه دردشة ند-لند بين الأصل والابن. فلدى الابن قناة إكمال عائدة إلى الأصل بالفعل.

### `sessions_send` وتسليم A2A

يمكن لـ `sessions_send` استهداف جلسة أخرى بعد الإنشاء. وبالنسبة إلى الجلسات النظيرة العادية، يستخدم OpenClaw مسار متابعة agent-to-agent ‏(A2A) بعد حقن الرسالة:

- انتظار رد الجلسة المستهدفة
- اختياريًا السماح للطالب والهدف بتبادل عدد محدود من أدوار المتابعة
- مطالبة الهدف بإنتاج رسالة إعلان
- تسليم ذلك الإعلان إلى القناة أو thread المرئية

يمثل مسار A2A هذا fallback لعمليات الإرسال بين الجلسات النظيرة عندما يحتاج المُرسِل إلى متابعة مرئية. ويظل مفعّلًا عندما تتمكن جلسة غير ذات صلة من رؤية هدف ACP ومراسلته، مثلًا تحت إعدادات `tools.sessions.visibility` الواسعة.

يتخطى OpenClaw متابعة A2A فقط عندما يكون الطالب هو أصل ابنه أحادي اللقطة المملوك له. ففي تلك الحالة، يمكن أن يؤدي تشغيل A2A فوق إكمال المهمة إلى إيقاظ الأصل بنتيجة الابن، وتمرير رد الأصل مرة أخرى إلى الابن، وإنشاء حلقة صدى بين الأصل والابن. وتبلغ نتيجة `sessions_send` عن `delivery.status="skipped"` في حالة الابن المملوك هذه لأن مسار الإكمال مسؤول بالفعل عن النتيجة.

### استئناف جلسة موجودة

استخدم `resumeSessionId` لمتابعة جلسة ACP سابقة بدلًا من البدء من جديد. ويعيد الوكيل تشغيل محفوظات محادثته عبر `session/load`، فيتابع من حيث توقف مع السياق الكامل لما سبق.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

حالات الاستخدام الشائعة:

- نقل جلسة Codex من الحاسوب المحمول إلى الهاتف — اطلب من الوكيل المتابعة من حيث توقفت
- متابعة جلسة برمجة بدأتها تفاعليًا في CLI، ثم أكملها الآن من خلال وكيلك من دون واجهة
- متابعة عمل انقطع بسبب إعادة تشغيل gateway أو انتهاء مهلة الخمول

ملاحظات:

- يتطلب `resumeSessionId` القيمة `runtime: "acp"` — ويعيد خطأ إذا استُخدم مع وقت تشغيل الوكيل الفرعي.
- يعيد `resumeSessionId` محفوظات محادثة ACP الصاعدة؛ بينما يظل `thread` و`mode` يُطبقان كالمعتاد على جلسة OpenClaw الجديدة التي تنشئها، لذا لا تزال `mode: "session"` تتطلب `thread: true`.
- يجب أن يدعم الوكيل الهدف `session/load` ‏(ويدعمه Codex وClaude Code).
- إذا لم يُعثر على معرّف الجلسة، يفشل الإنشاء بخطأ واضح — من دون fallback صامت إلى جلسة جديدة.

<Accordion title="اختبار smoke بعد النشر">

بعد نشر gateway، أجرِ فحصًا مباشرًا من البداية إلى النهاية بدلًا من الوثوق باختبارات unit:

1. تحقق من إصدار gateway المنشور والالتزام على المضيف الهدف.
2. افتح جلسة جسر ACPX مؤقتة لوكيل مباشر.
3. اطلب من ذلك الوكيل استدعاء `sessions_spawn` مع `runtime: "acp"` و`agentId: "codex"` و`mode: "run"` والمهمة `Reply with exactly LIVE-ACP-SPAWN-OK`.
4. تحقق من `accepted=yes`، ووجود `childSessionKey` حقيقي، وعدم وجود خطأ من validator.
5. نظّف جلسة الجسر المؤقتة.

أبقِ البوابة على `mode: "run"` وتخطَّ `streamTo: "parent"` — فالمسارات المرتبطة بالـ thread الخاصة بـ `mode: "session"` ومسارات stream-relay هي تمريرات تكاملية أغنى ومنفصلة.

</Accordion>

## التوافق مع sandbox

تعمل جلسات ACP حاليًا على وقت تشغيل المضيف، وليس داخل sandbox الخاصة بـ OpenClaw.

القيود الحالية:

- إذا كانت جلسة الطالب ضمن sandbox، فسيُحظر إنشاء ACP لكل من `sessions_spawn({ runtime: "acp" })` و`/acp spawn`.
  - الخطأ: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- لا تدعم `sessions_spawn` مع `runtime: "acp"` الخيار `sandbox: "require"`.
  - الخطأ: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

استخدم `runtime: "subagent"` عندما تحتاج إلى تنفيذ تُفرض عليه sandbox.

### من أمر `/acp`

استخدم `/acp spawn` للتحكم الصريح من جهة المشغل من داخل الدردشة عند الحاجة.

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

راجع [Slash Commands](/ar/tools/slash-commands).

## حل هدف الجلسة

تقبل معظم إجراءات `/acp` هدف جلسة اختياريًا (`session-key` أو `session-id` أو `session-label`).

ترتيب الحل:

1. وسيطة الهدف الصريحة (أو `--session` بالنسبة إلى `/acp steer`)
   - يجرب المفتاح أولًا
   - ثم `session id` على شكل UUID
   - ثم التسمية
2. ارتباط الـ thread الحالية (إذا كانت هذه المحادثة/الـ thread مرتبطة بجلسة ACP)
3. fallback إلى جلسة الطالب الحالية

تشارك ارتباطات المحادثة الحالية وارتباطات الـ thread في الخطوة 2.

إذا لم يُحل أي هدف، يعيد OpenClaw خطأ واضحًا (`Unable to resolve session target: ...`).

## أوضاع ربط الإنشاء

يدعم `/acp spawn` الخيار `--bind here|off`.

| الوضع  | السلوك                                                                    |
| ------ | ------------------------------------------------------------------------- |
| `here` | ربط المحادثة النشطة الحالية في مكانها؛ والفشل إذا لم تكن هناك محادثة نشطة. |
| `off`  | عدم إنشاء ارتباط بالمحادثة الحالية.                                       |

ملاحظات:

- يمثل `--bind here` أبسط مسار للمشغل من أجل "اجعل هذه القناة أو الدردشة مدعومة بـ Codex."
- لا ينشئ `--bind here` thread فرعية.
- لا يتوفر `--bind here` إلا على القنوات التي تعرض دعم الربط بالمحادثة الحالية.
- لا يمكن الجمع بين `--bind` و`--thread` في استدعاء `/acp spawn` نفسه.

## أوضاع thread عند الإنشاء

يدعم `/acp spawn` الخيار `--thread auto|here|off`.

| الوضع  | السلوك                                                                                                    |
| ------ | --------------------------------------------------------------------------------------------------------- |
| `auto` | داخل thread نشطة: ربط تلك thread. وخارج thread: إنشاء/ربط thread فرعية عند الدعم.                        |
| `here` | يتطلب thread نشطة حالية؛ ويفشل إذا لم تكن داخل واحدة.                                                    |
| `off`  | لا يوجد ربط. تبدأ الجلسة غير مرتبطة.                                                                      |

ملاحظات:

- على الأسطح التي لا تدعم ربط الـ thread، يكون السلوك الافتراضي فعليًا هو `off`.
- يتطلب الإنشاء المرتبط بالـ thread دعم سياسة القناة:
  - Discord: ‏`channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: ‏`channels.telegram.threadBindings.spawnAcpSessions=true`
- استخدم `--bind here` عندما تريد تثبيت المحادثة الحالية من دون إنشاء thread فرعية.

## عناصر التحكم في ACP

| الأمر                | ما الذي يفعله                                              | مثال                                                         |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | إنشاء جلسة ACP؛ مع ربط اختياري بالمحادثة الحالية أو بالـ thread. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | إلغاء الدور الجاري للجلسة المستهدفة.                      | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | إرسال تعليمات توجيه إلى الجلسة الجارية.                   | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | إغلاق الجلسة وفك ارتباط أهداف الـ thread.                 | `/acp close`                                                  |
| `/acp status`        | عرض الواجهة الخلفية، والوضع، والحالة، وخيارات وقت التشغيل، والإمكانيات. | `/acp status`                                                 |
| `/acp set-mode`      | ضبط وضع وقت التشغيل للجلسة المستهدفة.                     | `/acp set-mode plan`                                          |
| `/acp set`           | كتابة خيار تهيئة عام لوقت التشغيل.                         | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ضبط تجاوز دليل العمل لوقت التشغيل.                         | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | ضبط ملف تعريف سياسة الموافقة.                              | `/acp permissions strict`                                     |
| `/acp timeout`       | ضبط مهلة وقت التشغيل (بالثواني).                           | `/acp timeout 120`                                            |
| `/acp model`         | ضبط تجاوز نموذج وقت التشغيل.                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | إزالة تجاوزات خيارات وقت التشغيل للجلسة.                    | `/acp reset-options`                                          |
| `/acp sessions`      | إدراج جلسات ACP الحديثة من المخزن.                         | `/acp sessions`                                               |
| `/acp doctor`        | صحة الواجهة الخلفية، والإمكانيات، والإصلاحات القابلة للتنفيذ. | `/acp doctor`                                                 |
| `/acp install`       | طباعة خطوات تثبيت وتمكين حتمية.                            | `/acp install`                                                |

يعرض `/acp status` خيارات وقت التشغيل الفعلية بالإضافة إلى معرّفات الجلسة على مستوى وقت التشغيل وعلى مستوى الواجهة الخلفية. وتظهر أخطاء التحكم غير المدعوم بوضوح عندما تفتقر واجهة خلفية إلى إحدى الإمكانيات. ويقرأ `/acp sessions` من المخزن للجلسة الحالية المرتبطة أو جلسة الطالب؛ وتُحل رموز الهدف (`session-key` أو `session-id` أو `session-label`) عبر اكتشاف جلسات gateway، بما في ذلك جذور `session.store` المخصصة لكل وكيل.

## ربط خيارات وقت التشغيل

يوفر `/acp` أوامر مريحة وأداة ضبط عامة.

العمليات المكافئة:

- يطابق `/acp model <id>` مفتاح تهيئة وقت التشغيل `model`.
- يطابق `/acp permissions <profile>` مفتاح تهيئة وقت التشغيل `approval_policy`.
- يطابق `/acp timeout <seconds>` مفتاح تهيئة وقت التشغيل `timeout`.
- يحدّث `/acp cwd <path>` تجاوز `cwd` لوقت التشغيل مباشرة.
- يمثّل `/acp set <key> <value>` المسار العام.
  - حالة خاصة: تستخدم `key=cwd` مسار تجاوز `cwd`.
- يمسح `/acp reset-options` جميع تجاوزات وقت التشغيل للجلسة المستهدفة.

## تهيئة harness الخاصة بـ acpx وPlugin والأذونات

بالنسبة إلى تهيئة harness الخاصة بـ acpx ‏(الأسماء المستعارة لـ Claude Code / Codex / Gemini CLI)، وجسور MCP لـ plugin-tools وOpenClaw-tools، وأوضاع أذونات ACP، راجع
[ACP agents — setup](/ar/tools/acp-agents-setup).

## استكشاف الأخطاء وإصلاحها

| العَرَض                                                                      | السبب المحتمل                                                                    | الحل                                                                                                                                                                          |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                      | Plugin الواجهة الخلفية مفقود أو معطل.                                           | ثبّت Plugin الواجهة الخلفية وفعّله، ثم شغّل `/acp doctor`.                                                                                                                   |
| `ACP is disabled by policy (acp.enabled=false)`                              | ACP معطل على مستوى عام.                                                          | اضبط `acp.enabled=true`.                                                                                                                                                      |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`            | تم تعطيل dispatch من رسائل الـ thread العادية.                                   | اضبط `acp.dispatch.enabled=true`.                                                                                                                                             |
| `ACP agent "<id>" is not allowed by policy`                                  | الوكيل غير موجود في قائمة السماح.                                                | استخدم `agentId` مسموحًا به أو حدّث `acp.allowedAgents`.                                                                                                                      |
| `Unable to resolve session target: ...`                                      | رمز key/id/label غير صحيح.                                                       | شغّل `/acp sessions`، وانسخ المفتاح/التسمية بدقة، ثم أعد المحاولة.                                                                                                            |
| `--bind here requires running /acp spawn inside an active ... conversation`  | تم استخدام `--bind here` من دون محادثة نشطة قابلة للربط.                         | انتقل إلى الدردشة/القناة المستهدفة وأعد المحاولة، أو استخدم إنشاء غير مرتبط.                                                                                                 |
| `Conversation bindings are unavailable for <channel>.`                       | يفتقر المهايئ إلى إمكانية ربط ACP بالمحادثة الحالية.                             | استخدم `/acp spawn ... --thread ...` عند الدعم، أو هيئ `bindings[]` على المستوى الأعلى، أو انتقل إلى قناة مدعومة.                                                           |
| `--thread here requires running /acp spawn inside an active ... thread`      | تم استخدام `--thread here` خارج سياق thread.                                     | انتقل إلى thread المستهدفة أو استخدم `--thread auto` أو `off`.                                                                                                               |
| `Only <user-id> can rebind this channel/conversation/thread.`                | يملك مستخدم آخر هدف الربط النشط.                                                 | أعد الربط بصفتك المالك أو استخدم محادثة أو thread مختلفة.                                                                                                                    |
| `Thread bindings are unavailable for <channel>.`                             | يفتقر المهايئ إلى إمكانية ربط الـ thread.                                         | استخدم `--thread off` أو انتقل إلى مهايئ/قناة مدعومة.                                                                                                                        |
| `Sandboxed sessions cannot spawn ACP sessions ...`                           | وقت تشغيل ACP يعمل على المضيف؛ وجلسة الطالب ضمن sandbox.                         | استخدم `runtime="subagent"` من الجلسات ضمن sandbox، أو شغّل إنشاء ACP من جلسة غير ضمن sandbox.                                                                               |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`      | تم طلب `sandbox="require"` لوقت تشغيل ACP.                                       | استخدم `runtime="subagent"` عندما تكون sandbox مطلوبة، أو استخدم ACP مع `sandbox="inherit"` من جلسة غير ضمن sandbox.                                                          |
| بيانات ACP الوصفية مفقودة للجلسة المرتبطة                                     | بيانات وصفية قديمة/محذوفة لجلسة ACP.                                             | أعد الإنشاء باستخدام `/acp spawn`، ثم أعد الربط/التركيز على الـ thread.                                                                                                      |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`     | يمنع `permissionMode` عمليات الكتابة/التنفيذ في جلسة ACP غير تفاعلية.            | اضبط `plugins.entries.acpx.config.permissionMode` على `approve-all` ثم أعد تشغيل gateway. راجع [تهيئة الأذونات](/ar/tools/acp-agents-setup#permission-configuration).          |
| تفشل جلسة ACP مبكرًا مع مخرجات قليلة                                          | يتم حظر مطالبات الأذونات بواسطة `permissionMode`/`nonInteractivePermissions`.    | افحص سجلات gateway بحثًا عن `AcpRuntimeError`. ولمنح أذونات كاملة، اضبط `permissionMode=approve-all`؛ وللتدهور السلس، اضبط `nonInteractivePermissions=deny`.                  |
| تتوقف جلسة ACP إلى أجل غير مسمى بعد إكمال العمل                              | انتهت عملية harness لكن جلسة ACP لم تبلغ بالإكمال.                               | راقب باستخدام `ps aux \| grep acpx`؛ واقتل العمليات العالقة يدويًا.                                                                                                           |

## ذو صلة

- [Sub-agents](/ar/tools/subagents)
- [أدوات sandbox متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools)
- [إرسال الوكيل](/ar/tools/agent-send)
