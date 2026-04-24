---
read_when:
    - تكوين موافقات exec أو قوائم السماح էanalysis to=commentary.multi_tool_use.parallel  天天赢彩票_json {"tool_uses":[{"recipient_name":"functions.bash","parameters":{"command":"rg -n \"Exec approvals, allowlists, and sandbox escape prompts|Exec approvals|sandbox escape prompts|tools.exec.ask|tools.exec.security\" docs ../docs -S -g '!node_modules'","timeout":10}},{"recipient_name":"functions.read","parameters":{"path":"docs/AGENTS.md","offset":1,"limit":80}}]}
    - تنفيذ واجهة موافقة exec في تطبيق macOS
    - مراجعة مطالبات الخروج من sandbox وتداعياتها
summary: موافقات exec، وقوائم السماح، ومطالبات الخروج من sandbox
title: موافقات exec +#+#+#+#+#+analysis to=commentary.multi_tool_use.parallel  大发快三官网_json {"tool_uses":[{"recipient_name":"functions.bash","parameters":{"command":"rg -n \"Exec approvals, allowlists, and sandbox escape prompts|Exec approvals|sandbox escape prompts\" -S .. -g '!node_modules'","timeout":10}},{"recipient_name":"functions.read","parameters":{"path":"docs/AGENTS.md","offset":1,"limit":120}}]}
x-i18n:
    generated_at: "2026-04-24T08:08:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7c5cd24e7c1831d5a865da6fa20f4c23280a0ec12b9e8f7f3245170a05a37d
    source_path: tools/exec-approvals.md
    workflow: 15
---

تمثل موافقات exec **الحاجز الوقائي للتطبيق المرافق / مضيف node** الذي يسمح لـ
وكيل داخل sandbox بتشغيل أوامر على مضيف فعلي (`gateway` أو `node`). إنها
قفل أمان: لا تُسمح الأوامر إلا عندما تتفق السياسة + قائمة السماح + (الموافقة
الاختيارية من المستخدم) جميعًا. تتراكم موافقات exec **فوق** سياسة الأدوات
وتقييد elevated ‏(إلا إذا كانت قيمة elevated هي `full`، إذ يتم حينها تخطي الموافقات).

<Note>
السياسة الفعلية هي **الأشد** بين `tools.exec.*` والإعدادات الافتراضية للموافقات؛
إذا تم حذف حقل من حقول الموافقات، تُستخدم قيمة `tools.exec`.
كما يستخدم exec على المضيف حالة الموافقات المحلية على ذلك الجهاز — فوجود
`ask: "always"` محلي على المضيف في `~/.openclaw/exec-approvals.json` يعني استمرار
ظهور المطالبات حتى لو طلبت الجلسة أو القيم الافتراضية في التكوين
`ask: "on-miss"`.
</Note>

## فحص السياسة الفعلية

- `openclaw approvals get`، و`... --gateway`، و`... --node <id|name|ip>` — تعرض السياسة المطلوبة، ومصادر سياسة المضيف، والنتيجة الفعلية.
- `openclaw exec-policy show` — عرض مدمج على الجهاز المحلي.
- `openclaw exec-policy set|preset` — مزامنة السياسة المطلوبة محليًا مع ملف موافقات المضيف المحلي في خطوة واحدة.

عندما يطلب نطاق محلي `host=node`، فإن `exec-policy show` يبلغ عن هذا النطاق
على أنه مُدار عبر node في Runtime بدلًا من التظاهر بأن ملف الموافقات المحلي هو
مصدر الحقيقة.

إذا كانت واجهة المستخدم الخاصة بالتطبيق المرافق **غير متاحة**، فإن أي طلب
يتطلب عادةً مطالبة يُحل باستخدام **احتياط ask** ‏(الافتراضي: deny).

<Tip>
يمكن لعملاء الموافقة الأصلية في الدردشة زرع وسائل استخدام خاصة بالقناة داخل
رسالة الموافقة المعلقة. على سبيل المثال، يزرع Matrix اختصارات تفاعل
(`✅` للسماح مرة واحدة، و`❌` للرفض، و`♾️` للسماح دائمًا) مع الإبقاء
على أوامر `/approve ...` داخل الرسالة كاحتياط.
</Tip>

## أين يُطبَّق

تُفرض موافقات exec محليًا على مضيف التنفيذ:

- **مضيف gateway** → عملية `openclaw` على جهاز gateway
- **مضيف node** → مشغّل node ‏(تطبيق macOS المرافق أو مضيف node من دون رأس)

ملاحظة حول نموذج الثقة:

- تُعد الجهات المستدعية المصادَق عليها من gateway مشغّلين موثوقين لذلك Gateway.
- تمدّ nodes المقترنة قدرة المشغّل الموثوق هذه إلى مضيف node.
- تقلل موافقات exec من مخاطر التنفيذ العرضي، لكنها ليست حدًا للمصادقة لكل مستخدم.
- تربط التشغيلات المعتمدة على مضيف node سياق التنفيذ القياسي: ‏cwd قياسي، وargv مطابق، وربط env عند وجوده، ومسار تنفيذي مثبت عند الاقتضاء.
- بالنسبة إلى سكربتات shell والاستدعاءات المباشرة لملفات interpreter/runtime، يحاول OpenClaw أيضًا
  ربط مُعامِل ملف محلي محدد واحد. وإذا تغيّر ذلك الملف المرتبط بعد الموافقة ولكن قبل التنفيذ،
  يُرفض التشغيل بدلًا من تنفيذ محتوى تغيّر.
- هذا الربط للملفات مقصود به أفضل جهد، وليس نموذجًا دلاليًا كاملًا لكل
  مسارات تحميل interpreter/runtime. وإذا لم يتمكن وضع الموافقة من تحديد ملف محلي
  محدد واحد للربط به، فإنه يرفض إنشاء تشغيل معتمد على موافقة بدلًا من التظاهر بتغطية كاملة.

التقسيم على macOS:

- تقوم **خدمة مضيف node** بتمرير `system.run` إلى **تطبيق macOS** عبر IPC محلي.
- يقوم **تطبيق macOS** بفرض الموافقات + تنفيذ الأمر في سياق UI.

## الإعدادات والتخزين

تعيش الموافقات في ملف JSON محلي على مضيف التنفيذ:

`~/.openclaw/exec-approvals.json`

مثال على المخطط:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## وضع "YOLO" من دون موافقة

إذا كنت تريد أن يعمل exec على المضيف من دون مطالبات موافقة، فيجب أن تفتح **كلتا** طبقتي السياسة:

- سياسة exec المطلوبة في تكوين OpenClaw ‏(`tools.exec.*`)
- سياسة الموافقات المحلية على المضيف في `~/.openclaw/exec-approvals.json`

هذا هو الآن سلوك المضيف الافتراضي ما لم تشدده صراحةً:

- `tools.exec.security`: ‏`full` على `gateway`/`node`
- `tools.exec.ask`: ‏`off`
- `askFallback` على المضيف: ‏`full`

تمييز مهم:

- يختار `tools.exec.host=auto` مكان تشغيل exec: داخل sandbox عند توفره، وإلا على gateway.
- يحدد YOLO كيفية اعتماد exec على المضيف: ‏`security=full` بالإضافة إلى `ask=off`.
- يمكن لمزوّدي CLI المدعومين الذين يكشفون وضع أذونات غير تفاعلي خاص بهم اتباع هذه السياسة.
  يضيف Claude CLI الوسيط `--permission-mode bypassPermissions` عندما تكون سياسة exec
  المطلوبة في OpenClaw هي YOLO. ويمكنك تجاوز سلوك تلك الواجهة الخلفية
  باستخدام وسائط Claude الصريحة تحت
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`، مثل
  `--permission-mode default` أو `acceptEdits` أو `bypassPermissions`.
- في وضع YOLO، لا يضيف OpenClaw بوابة موافقة منفصلة مبنية على الاستدلال حول إخفاء الأوامر أو طبقة رفض preflight للسكربتات فوق سياسة exec على المضيف المكوّنة.
- لا يجعل `auto` توجيه gateway تجاوزًا مجانيًا من جلسة داخل sandbox. فطلب `host=node` لكل استدعاء مسموح من `auto`، و`host=gateway` مسموح من `auto` فقط عندما لا يكون Runtime الخاص بـ sandbox نشطًا. وإذا كنت تريد قيمة افتراضية ثابتة غير auto، فاضبط `tools.exec.host` أو استخدم `/exec host=...` صراحةً.

إذا كنت تريد إعدادًا أكثر تحفظًا، فأعد تشديد أي من الطبقتين إلى `allowlist` / `on-miss`
أو `deny`.

إعداد دائم على مضيف gateway من نوع "عدم المطالبة أبدًا":

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

ثم اضبط ملف موافقات المضيف ليطابق ذلك:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

اختصار محلي للسياسة نفسها على مضيف gateway على الجهاز الحالي:

```bash
openclaw exec-policy preset yolo
```

يحدّث هذا الاختصار المحلي كليهما:

- `tools.exec.host/security/ask` المحلية
- الافتراضيات المحلية في `~/.openclaw/exec-approvals.json`

وهو مقصود به أن يكون محليًا فقط. وإذا كنت تحتاج إلى تغيير موافقات مضيف gateway أو مضيف node
عن بُعد، فاستمر باستخدام `openclaw approvals set --gateway` أو
`openclaw approvals set --node <id|name|ip>`.

بالنسبة إلى مضيف node، طبّق ملف الموافقات نفسه على ذلك node بدلًا من ذلك:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

قيد مهم خاص بالمحلي فقط:

- لا يقوم `openclaw exec-policy` بمزامنة موافقات node
- يتم رفض `openclaw exec-policy set --host node`
- تُجلب موافقات exec الخاصة بـ node من node أثناء Runtime، لذا يجب أن تستخدم التحديثات الموجهة إلى node الأمر `openclaw approvals --node ...`

اختصار خاص بالجلسة فقط:

- يؤدي `/exec security=full ask=off` إلى تغيير الجلسة الحالية فقط.
- يمثل `/elevated full` اختصارًا طارئًا يتجاوز أيضًا موافقات exec لتلك الجلسة.

إذا ظل ملف موافقات المضيف أشد من التكوين، فإن سياسة المضيف الأشد تظل هي السارية.

## مقابض السياسة

### الأمان (`exec.security`)

- **deny**: حظر جميع طلبات exec على المضيف.
- **allowlist**: السماح فقط للأوامر الموجودة في قائمة السماح.
- **full**: السماح بكل شيء (يكافئ elevated).

### Ask ‏(`exec.ask`)

- **off**: لا تظهر مطالبة أبدًا.
- **on-miss**: تظهر مطالبة فقط عندما لا تطابق قائمة السماح.
- **always**: تظهر مطالبة لكل أمر.
- لا يؤدي trust الدائم من نوع `allow-always` إلى إخفاء المطالبات عندما يكون وضع ask الفعلي هو `always`

### احتياط Ask ‏(`askFallback`)

إذا كانت المطالبة مطلوبة لكن لا توجد واجهة مستخدم قابلة للوصول، فإن الاحتياط يقرر:

- **deny**: الحظر.
- **allowlist**: السماح فقط إذا طابقت قائمة السماح.
- **full**: السماح.

### تقوية eval المضمّن لـ interpreter ‏(`tools.exec.strictInlineEval`)

عندما تكون `tools.exec.strictInlineEval=true`، يتعامل OpenClaw مع صيغ eval المضمنة على أنها تتطلب موافقة حتى لو كان الملف الثنائي لـ interpreter نفسه موجودًا في قائمة السماح.

أمثلة:

- `python -c`
- `node -e`، `node --eval`، `node -p`
- `ruby -e`
- `perl -e`، `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

هذا دفاع متعمق خاص بمحملات interpreter التي لا ترتبط بشكل نظيف
بمعامل ملف ثابت واحد. في الوضع الصارم:

- لا تزال هذه الأوامر تحتاج إلى موافقة صريحة؛
- ولا يؤدي `allow-always` إلى حفظ إدخالات قائمة سماح جديدة لها تلقائيًا.

## قائمة السماح (لكل وكيل)

تكون قوائم السماح **لكل وكيل**. وإذا وُجد عدة وكلاء، فبدّل الوكيل الذي
تقوم بتحريره في تطبيق macOS. وتمثل الأنماط **مطابقات glob غير حساسة لحالة الأحرف**.
ينبغي أن تتحلل الأنماط إلى **مسارات ملفات ثنائية** (ويتم تجاهل الإدخالات التي تحتوي على basename فقط).
تُنقل الإدخالات القديمة `agents.default` إلى `agents.main` عند التحميل.
ولا تزال سلاسل shell مثل `echo ok && pwd` تتطلب أن يطابق كل مقطع من المستوى الأعلى قواعد قائمة السماح.

أمثلة:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

يتتبع كل إدخال في قائمة السماح ما يلي:

- **id** UUID ثابت يُستخدم لهوية UI ‏(اختياري)
- **آخر استخدام** طابع زمني
- **آخر أمر مستخدم**
- **آخر مسار محلَّل**

## السماح التلقائي لواجهات Skills CLI

عند تفعيل **Auto-allow skill CLIs**، تُعامل الملفات التنفيذية المشار إليها من قبل Skills المعروفة
على أنها موجودة في قائمة السماح على nodes ‏(Node على macOS أو مضيف node من دون رأس). ويستخدم ذلك
`skills.bins` عبر Gateway RPC لجلب قائمة ملفات Skill الثنائية. عطّل هذا إذا كنت تريد قوائم سماح يدوية صارمة.

ملاحظات ثقة مهمة:

- هذه **قائمة سماح ضمنية للتسهيل**، وهي منفصلة عن إدخالات قائمة السماح اليدوية للمسارات.
- وهي مخصصة لبيئات المشغّل الموثوقة حيث يكون Gateway وnode ضمن حدود الثقة نفسها.
- إذا كنت تحتاج إلى ثقة صريحة صارمة، فأبقِ `autoAllowSkills: false` واستخدم إدخالات قائمة السماح اليدوية للمسارات فقط.

## الملفات الثنائية الآمنة وتمرير الموافقة

بالنسبة إلى الملفات الثنائية الآمنة (المسار السريع القائم على stdin)، وتفاصيل ربط interpreter، وكيفية
تمرير مطالبات الموافقة إلى Slack/Discord/Telegram ‏(أو تشغيلها كعملاء موافقة أصلية)، راجع [موافقات Exec — متقدم](/ar/tools/exec-approvals-advanced).

<!-- moved to /tools/exec-approvals-advanced -->

## التحرير في Control UI

استخدم بطاقة **Control UI → Nodes → Exec approvals** لتحرير الإعدادات الافتراضية، وتجاوزات
كل وكيل، وقوائم السماح. اختر نطاقًا (Defaults أو وكيل)، وعدّل السياسة،
وأضف/أزل أنماط قائمة السماح، ثم **احفظ**. تعرض الواجهة بيانات **آخر استخدام**
لكل نمط حتى تتمكن من إبقاء القائمة مرتبة.

يختار محدد الهدف **Gateway** ‏(الموافقات المحلية) أو **Node**. ويجب على Nodes
أن تعلن عن `system.execApprovals.get/set` ‏(تطبيق macOS أو مضيف node من دون رأس).
إذا لم يكن node يعلن عن موافقات exec بعد، فحرّر ملفه المحلي
`~/.openclaw/exec-approvals.json` مباشرةً.

CLI: يدعم `openclaw approvals` تحرير gateway أو node ‏(راجع [Approvals CLI](/ar/cli/approvals)).

## تدفق الموافقة

عندما تكون المطالبة مطلوبة، يبث gateway الحدث `exec.approval.requested` إلى عملاء التشغيل.
وتقوم Control UI وتطبيق macOS بحله عبر `exec.approval.resolve`، ثم يمرر gateway الطلب
المعتمد إلى مضيف node.

بالنسبة إلى `host=node`، تتضمن طلبات الموافقة حمولة قياسية `systemRunPlan`. ويستخدم gateway
هذه الخطة على أنها السياق المرجعي للأمر/cwd/الجلسة عند تمرير طلبات `system.run`
المعتمدة.

وهذا مهم بالنسبة إلى زمن تأخر الموافقة غير المتزامنة:

- يقوم مسار exec الخاص بـ node بإعداد خطة معيارية واحدة مسبقًا
- ويخزّن سجل الموافقة تلك الخطة وبيانات الربط الوصفية الخاصة بها
- وبعد الموافقة، يعيد استدعاء `system.run` النهائي الممرَّر استخدام الخطة المخزنة
  بدلًا من الوثوق بأي تعديلات لاحقة من الجهة الطالبة
- وإذا غيّرت الجهة الطالبة `command` أو `rawCommand` أو `cwd` أو `agentId` أو
  `sessionKey` بعد إنشاء طلب الموافقة، فإن gateway يرفض
  التشغيل الممرَّر بسبب عدم تطابق الموافقة

## أحداث النظام

يتم عرض دورة حياة exec كرسائل نظام:

- `Exec running` ‏(فقط إذا تجاوز الأمر عتبة إشعار التشغيل)
- `Exec finished`
- `Exec denied`

تُنشر هذه الرسائل في جلسة الوكيل بعد أن يبلّغ node عن الحدث.
كما تصدر موافقات exec على مضيف Gateway أحداث دورة الحياة نفسها عند انتهاء الأمر (واختياريًا عند تشغيله مدة أطول من العتبة).
وتعيد exec المقيّدة بالموافقة استخدام معرّف الموافقة بوصفه `runId` في هذه الرسائل لتسهيل الترابط.

## سلوك الرفض عند عدم الموافقة

عندما يتم رفض موافقة exec غير المتزامنة، يمنع OpenClaw الوكيل من إعادة استخدام
الخرج الناتج عن أي تشغيل سابق للأمر نفسه في الجلسة. ويتم تمرير سبب الرفض
مع إرشادات صريحة تفيد بعدم وجود أي خرج للأمر، مما يمنع
الوكيل من الادعاء بوجود خرج جديد أو من تكرار الأمر المرفوض باستخدام
نتائج قديمة من تشغيل سابق ناجح.

## التداعيات

- يمثل **full** صلاحية قوية؛ ويفضل استخدام قوائم السماح متى أمكن.
- يبقيك **ask** ضمن الحلقة مع الاستمرار في السماح بموافقات سريعة.
- تمنع قوائم السماح لكل وكيل تسرب موافقات وكيل إلى الآخرين.
- لا تنطبق الموافقات إلا على طلبات exec على المضيف الصادرة من **مرسلين مصرّح لهم**. ولا يمكن للمرسلين غير المصرح لهم إصدار `/exec`.
- يمثل `/exec security=full` وسيلة راحة على مستوى الجلسة للمشغّلين المصرّح لهم، ويتخطى الموافقات عمدًا. ولحظر exec على المضيف بشكل صارم، اضبط أمان الموافقات على `deny` أو امنع أداة `exec` عبر سياسة الأدوات.

## ذو صلة

<CardGroup cols={2}>
  <Card title="موافقات Exec — متقدم" href="/ar/tools/exec-approvals-advanced" icon="gear">
    الملفات الثنائية الآمنة، وربط interpreter، وتمرير الموافقة إلى الدردشة.
  </Card>
  <Card title="أداة Exec" href="/ar/tools/exec" icon="terminal">
    أداة تنفيذ أوامر shell.
  </Card>
  <Card title="الوضع Elevated" href="/ar/tools/elevated" icon="shield-exclamation">
    مسار طارئ يتخطى الموافقات أيضًا.
  </Card>
  <Card title="Sandboxing" href="/ar/gateway/sandboxing" icon="box">
    أوضاع sandbox والوصول إلى مساحة العمل.
  </Card>
  <Card title="الأمان" href="/ar/gateway/security" icon="lock">
    نموذج الأمان والتقوية.
  </Card>
  <Card title="Sandbox مقابل سياسة الأدوات مقابل Elevated" href="/ar/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    متى تستخدم كل عنصر تحكم.
  </Card>
  <Card title="Skills" href="/ar/tools/skills" icon="sparkles">
    سلوك السماح التلقائي المدعوم بـ Skill.
  </Card>
</CardGroup>
