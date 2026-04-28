---
read_when:
    - تهيئة موافقات exec أو قوائم السماح
    - تنفيذ تجربة مستخدم موافقة exec في تطبيق macOS
    - مراجعة مطالبات الهروب من sandbox وآثارها
sidebarTitle: Exec approvals
summary: 'موافقات exec على المضيف: مفاتيح السياسة، وقوائم السماح، وسير العمل YOLO/الصارم'
title: موافقات Exec
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:41:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 868cee97882f7298a092bdcb9ec8fd058a5d7cb8745fad2edd712fabfb512e52
    source_path: tools/exec-approvals.md
    workflow: 15
---

موافقات exec هي **حاجز الحماية في التطبيق المرافق / مضيف Node** للسماح
لوكيل داخل sandbox بتشغيل أوامر على مضيف حقيقي (`gateway` أو `node`). وهي
تعشيقة أمان: لا تُسمح الأوامر إلا عندما تتفق السياسة + قائمة السماح +
(اختياريًا) موافقة المستخدم جميعًا. وتتراكم موافقات exec **فوق**
سياسة الأداة وتقييد elevated ‏(إلا إذا كانت elevated مضبوطة على `full`، وهو ما
يتخطى الموافقات).

<Note>
السياسة الفعلية هي **الأشد** بين `tools.exec.*` وافتراضيات
الموافقات؛ وإذا حُذف حقل من حقول الموافقات، فسيُستخدم
القيمة من `tools.exec`. كما يستخدم exec على المضيف أيضًا حالة الموافقات المحلية على ذلك الجهاز — فوجود
`ask: "always"` محلي على المضيف في `~/.openclaw/exec-approvals.json` يبقي
المطالبات مستمرة حتى لو طلبت افتراضيات الجلسة أو الإعدادات `ask: "on-miss"`.
</Note>

## فحص السياسة الفعلية

| الأمر                                                          | ما الذي يعرضه                                                                      |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | السياسة المطلوبة، ومصادر سياسة المضيف، والنتيجة الفعلية.                       |
| `openclaw exec-policy show`                                      | العرض المدمج على الجهاز المحلي.                                                             |
| `openclaw exec-policy set` / `preset`                            | مزامنة السياسة المطلوبة محليًا مع ملف موافقات المضيف المحلي في خطوة واحدة. |

عندما يطلب نطاق محلي `host=node`، يعرض `exec-policy show` ذلك
النطاق باعتباره مُدارًا بواسطة Node في وقت التشغيل بدلًا من الادعاء بأن ملف
الموافقات المحلي هو مصدر الحقيقة.

إذا كانت واجهة المستخدم في التطبيق المرافق **غير متاحة**، فإن أي طلب
كان من المفترض أن يعرض مطالبة يُحل بواسطة **الرجوع الاحتياطي للسؤال**
(الافتراضي: `deny`).

<Tip>
يمكن لعملاء الموافقة الأصلية في الدردشة أن يزرعوا وسائل مخصصة بالقناة على
رسالة الموافقة المعلقة. فعلى سبيل المثال، تقوم Matrix بزرع اختصارات
تفاعل (`✅` سماح مرة واحدة، `❌` رفض، `♾️` سماح دائمًا) مع الإبقاء
على أوامر `/approve ...` داخل الرسالة كرجوع احتياطي.
</Tip>

## أين يُطبَّق

تُفرَض موافقات exec محليًا على مضيف التنفيذ:

- **مضيف Gateway** → عملية `openclaw` على جهاز gateway.
- **مضيف Node** → مشغّل node ‏(تطبيق macOS المرافق أو مضيف node عديم الواجهة).

### نموذج الثقة

- يُعد المستدعون المصادَق عليهم مع Gateway مشغّلين موثوقين لتلك Gateway.
- تمدّ Nodes المقترنة قدرة المشغّل الموثوق هذه إلى مضيف node.
- تقلّل موافقات exec من خطر التنفيذ العرضي، لكنها **ليست** حدًا للمصادقة لكل مستخدم.
- تربط تشغيلات node-host الموافق عليها سياق تنفيذ قياسيًا: ‏cwd قياسي، وargv دقيق، وربط env عند وجوده، ومسار executable مثبت عند الاقتضاء.
- بالنسبة إلى سكربتات shell والاستدعاءات المباشرة لملفات interpreter/runtime، يحاول OpenClaw أيضًا ربط معامل ملف محلي ملموس واحد. وإذا تغيّر ذلك الملف المرتبط بعد الموافقة وقبل التنفيذ، يُرفض التشغيل بدلًا من تنفيذ محتوى منجرف.
- ربط الملفات مقصود به أفضل جهد، **وليس** نموذجًا دلاليًا كاملًا لكل مسارات تحميل interpreter/runtime. وإذا لم يتمكن وضع الموافقة من تحديد ملف محلي ملموس واحد لربطه بالضبط، فإنه يرفض إنشاء تشغيل مدعوم بالموافقة بدلًا من الادعاء بتغطية كاملة.

### التقسيم في macOS

- تقوم **خدمة مضيف node** بتمرير `system.run` إلى **تطبيق macOS** عبر IPC محلي.
- يفرض **تطبيق macOS** الموافقات وينفذ الأمر ضمن سياق واجهة المستخدم.

## الإعدادات والتخزين

توجد الموافقات في ملف JSON محلي على مضيف التنفيذ:

```text
~/.openclaw/exec-approvals.json
```

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

## مفاتيح السياسة

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  `deny` يحظر جميع طلبات exec على المضيف. `allowlist` يسمح فقط بالأوامر المدرجة في قائمة السماح. `full` يسمح بكل شيء (مكافئ لـ elevated).
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  `off` لا يعرض مطالبات أبدًا. `on-miss` يعرض مطالبة فقط عندما لا تطابق قائمة السماح. `always` يعرض مطالبة لكل أمر، والثقة الدائمة `allow-always` **لا** تمنع المطالبات عندما يكون وضع السؤال الفعلي هو `always`.
</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  القرار عند الحاجة إلى مطالبة لكن لا توجد واجهة مستخدم قابلة للوصول.

  `deny` يحظر الطلب. `allowlist` يسمح فقط إذا طابقت قائمة السماح. `full` يسمح بالطلب.
</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  عندما تكون `true`، يتعامل OpenClaw مع صيغ eval المضمنة في الشيفرة على أنها
  تتطلب موافقة فقط حتى لو كان binary الخاصة بالمفسّر نفسها ضمن قائمة السماح. وهذا دفاع إضافي
  ضد محمّلات المفسّرات التي لا تُطابق بشكل نظيف
  معامل ملف واحدًا مستقرًا.
</ParamField>

أمثلة يلتقطها الوضع الصارم:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

في الوضع الصارم، لا تزال هذه الأوامر بحاجة إلى موافقة صريحة، كما أن
`allow-always` لا يحتفظ تلقائيًا بإدخالات جديدة لها في قائمة السماح.

## وضع YOLO ‏(من دون موافقة)

إذا أردت أن يعمل exec على المضيف من دون مطالبات موافقة، فيجب عليك فتح
**طبقتي السياسة** كلتيهما — سياسة exec المطلوبة في إعدادات OpenClaw
(`tools.exec.*`) **وكذلك** سياسة الموافقات المحلية على المضيف في
`~/.openclaw/exec-approvals.json`.

YOLO هو السلوك الافتراضي على المضيف ما لم تُشدده صراحةً:

| الطبقة                | إعداد YOLO                 |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` على `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| `askFallback` للمضيف  | `full`                     |

<Warning>
**فروق مهمة:**

`tools.exec.host=auto` يختار **أين** يعمل exec: داخل sandbox عند توفرها، وإلا فعلى gateway. يختار YOLO **كيف** تُعتمد exec على المضيف: `security=full` مع `ask=off`. في وضع YOLO، لا يضيف OpenClaw **بوابة موافقة استدلالية منفصلة** لإخفاء الأوامر أو طبقة رفض تمهيدي للسكربتات فوق سياسة exec على المضيف المهيأة. لا يجعل `auto` توجيه gateway تجاوزًا مجانيًا من جلسة داخل sandbox. ويُسمح بطلب `host=node` لكل استدعاء من `auto`؛ أما `host=gateway` فلا يُسمح به من `auto` إلا عندما لا يكون هناك وقت تشغيل sandbox نشط. وللحصول على افتراضي ثابت غير `auto`، اضبط `tools.exec.host` أو استخدم `/exec host=...` صراحةً.
</Warning>

يمكن للمزوّدين المدعومين عبر CLI الذين يكشفون وضع صلاحياتهم غير التفاعلي الخاص
أن يتبعوا هذه السياسة. وتضيف Claude CLI الخيار
`--permission-mode bypassPermissions` عندما تكون سياسة exec المطلوبة في OpenClaw
هي YOLO. ويمكنك تجاوز سلوك تلك الواجهة الخلفية بإعطاء وسائط Claude صريحة
ضمن `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` —
مثلًا `--permission-mode default`، أو `acceptEdits`، أو
`bypassPermissions`.

إذا أردت إعدادًا أكثر تحفظًا، فشدّد أيًا من الطبقتين مجددًا إلى
`allowlist` / `on-miss` أو `deny`.

### إعداد دائم "لا تطالب أبدًا" على مضيف gateway

<Steps>
  <Step title="اضبط سياسة الإعدادات المطلوبة">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="طابق ملف موافقات المضيف">
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
  </Step>
</Steps>

### اختصار محلي

```bash
openclaw exec-policy preset yolo
```

يحدّث هذا الاختصار المحلي كليهما:

- `tools.exec.host/security/ask` المحلية.
- افتراضيات `~/.openclaw/exec-approvals.json` المحلية.

وهو محلي فقط عمدًا. ولتغيير موافقات مضيف gateway أو مضيف node عن بُعد،
استخدم `openclaw approvals set --gateway` أو
`openclaw approvals set --node <id|name|ip>`.

### مضيف Node

بالنسبة إلى مضيف node، طبّق ملف الموافقات نفسه على تلك node بدلًا من ذلك:

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

<Note>
**قيود محلية فقط:**

`openclaw exec-policy` لا يزامن موافقات node. يُرفض `openclaw exec-policy set --host node`. تُجلب موافقات exec الخاصة بـ Node من node في وقت التشغيل، لذلك يجب أن تستخدم التحديثات الموجهة إلى node الأمر `openclaw approvals --node ...`.
</Note>

### اختصار خاص بالجلسة فقط

- يغيّر `/exec security=full ask=off` الجلسة الحالية فقط.
- يُعد `/elevated full` اختصار كسر زجاجي يتخطى أيضًا موافقات exec لتلك الجلسة.

إذا بقي ملف موافقات المضيف أكثر تشددًا من الإعدادات، فإن سياسة المضيف
الأشد تظل هي السائدة.

## قائمة السماح ‏(لكل وكيل)

قوائم السماح تكون **لكل وكيل**. وإذا كان هناك عدة وكلاء، فبدّل الوكيل
الذي تعدّله في تطبيق macOS. والأنماط هي مطابقات glob.

يمكن أن تكون الأنماط globs لمسارات binary المحلولة أو globs لأسماء أوامر مجردة.
تطابق الأسماء المجردة فقط الأوامر المستدعاة عبر `PATH`، لذلك يمكن أن تطابق `rg`
المسار `/opt/homebrew/bin/rg` عندما يكون الأمر هو `rg`، لكن **ليس** `./rg` أو
`/tmp/rg`. استخدم glob للمسار عندما تريد الوثوق بموقع binary
محدد واحد.

تُرحَّل إدخالات `agents.default` القديمة إلى `agents.main` عند التحميل.
أما سلاسل shell مثل `echo ok && pwd` فلا تزال تحتاج إلى أن يطابق كل مقطع من المستوى الأعلى
قواعد قائمة السماح.

أمثلة:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

يتتبع كل إدخال في قائمة السماح:

| الحقل              | المعنى                              |
| ------------------ | ----------------------------------- |
| `id`               | UUID ثابت يُستخدم لهوية UI          |
| `lastUsedAt`       | الطابع الزمني لآخر استخدام          |
| `lastUsedCommand`  | آخر أمر طابق النمط                 |
| `lastResolvedPath` | آخر مسار binary محلول               |

## السماح التلقائي لـ Skills CLIs

عند تفعيل **السماح التلقائي لـ Skills CLIs**، تُعامَل الملفات التنفيذية المشار إليها بواسطة
Skills المعروفة على أنها ضمن قائمة السماح على nodes ‏(سواء كانت macOS node أو headless
node host). ويستخدم ذلك `skills.bins` عبر Gateway RPC لجلب قائمة
حاويات المهارات. عطّل هذا إذا كنت تريد قوائم سماح يدوية صارمة.

<Warning>
- هذه **قائمة سماح ضمنية للملاءمة**، منفصلة عن إدخالات قائمة السماح اليدوية للمسارات.
- وهي مخصصة لبيئات المشغّل الموثوقة التي تكون فيها Gateway وnode ضمن حدود الثقة نفسها.
- إذا كنت تحتاج إلى ثقة صريحة صارمة، فأبقِ `autoAllowSkills: false` واستخدم إدخالات قائمة السماح اليدوية للمسارات فقط.
</Warning>

## الحاويات الآمنة وتمرير الموافقات

بالنسبة إلى الحاويات الآمنة (مسار stdin-only السريع)، وتفاصيل ربط المفسّر، و
كيفية تمرير مطالبات الموافقة إلى Slack/Discord/Telegram ‏(أو تشغيلها كعملاء موافقة أصليين)، راجع
[موافقات Exec — متقدم](/ar/tools/exec-approvals-advanced).

## التحرير في Control UI

استخدم بطاقة **Control UI → Nodes → Exec approvals** لتحرير الافتراضيات،
والتجاوزات لكل وكيل، وقوائم السماح. اختر نطاقًا (Defaults أو وكيلًا)،
وعدّل السياسة، وأضف/أزل أنماط قائمة السماح، ثم **احفظ**. وتعرض UI
بيانات آخر استخدام لكل نمط حتى تتمكن من إبقاء القائمة مرتبة.

يختار محدد الهدف **Gateway** ‏(الموافقات المحلية) أو **Node**.
ويجب أن تعلن Nodes عن `system.execApprovals.get/set` ‏(تطبيق macOS أو
مضيف node عديم الواجهة). وإذا لم تكن node تعلن عن موافقات exec بعد،
فحرّر ملف `~/.openclaw/exec-approvals.json` المحلي الخاص بها مباشرةً.

CLI: يدعم `openclaw approvals` التحرير على gateway أو node — راجع
[CLI للموافقات](/ar/cli/approvals).

## تدفّق الموافقة

عندما تكون المطالبة مطلوبة، تبث gateway الحدث
`exec.approval.requested` إلى عملاء المشغّل. وتقوم Control UI وتطبيق macOS
بحلّه عبر `exec.approval.resolve`، ثم تمرر gateway
الطلب الموافق عليه إلى مضيف node.

بالنسبة إلى `host=node`، تتضمن طلبات الموافقة حمولة
`systemRunPlan` قياسية. وتستخدم gateway هذه الخطة باعتبارها
سياق الأمر/‏cwd/‏الجلسة الموثوق عند تمرير طلبات `system.run`
الموافق عليها.

وهذا مهم بالنسبة إلى زمن تأخر الموافقة غير المتزامنة:

- يجهّز مسار تنفيذ node خطة قياسية واحدة مسبقًا.
- ويخزّن سجل الموافقة تلك الخطة وبيانات الربط الوصفية الخاصة بها.
- وبعد الموافقة، يعيد استدعاء `system.run` النهائي الذي يُمرَّر استخدام الخطة المخزنة بدلًا من الوثوق بتعديلات المستدعي اللاحقة.
- وإذا غيّر المستدعي `command` أو `rawCommand` أو `cwd` أو `agentId` أو `sessionKey` بعد إنشاء طلب الموافقة، فترفض gateway التشغيل الممرَّر باعتباره عدم تطابق في الموافقة.

## أحداث النظام

يُعرض سير حياة exec كرسائل نظام:

- `Exec running` ‏(فقط إذا تجاوز الأمر عتبة إشعار التشغيل).
- `Exec finished`.
- `Exec denied`.

تُنشر هذه الرسائل في جلسة الوكيل بعد أن تُبلغ node عن الحدث.
كما تصدر موافقات exec على مضيف Gateway أحداث سير الحياة نفسها عندما
ينتهي الأمر (واختياريًا عندما يعمل مدة أطول من العتبة).
وتعيد أوامر exec المقيدة بالموافقة استخدام معرّف الموافقة باعتباره `runId` في هذه
الرسائل لسهولة الربط.

## سلوك الموافقة المرفوضة

عندما تُرفض موافقة exec غير المتزامنة، يمنع OpenClaw الوكيل من
إعادة استخدام المخرجات من أي تشغيل سابق للأمر نفسه في الجلسة.
ويُمرَّر سبب الرفض مع إرشاد صريح بأنه لا توجد مخرجات للأمر،
مما يمنع الوكيل من الادعاء بوجود مخرجات جديدة أو
تكرار الأمر المرفوض باستخدام نتائج قديمة من تشغيل ناجح سابق.

## الآثار

- إن **`full`** قوي؛ ففضّل قوائم السماح متى أمكن.
- يبقيك **`ask`** ضمن الحلقة مع السماح بموافقات سريعة.
- تمنع قوائم السماح لكل وكيل من تسرب موافقات وكيل إلى آخر.
- لا تنطبق الموافقات إلا على طلبات exec على المضيف من **مرسلين مصرح لهم**. ولا يستطيع المرسلون غير المصرح لهم إصدار `/exec`.
- يُعد `/exec security=full` وسيلة راحة على مستوى الجلسة للمشغّلين المصرح لهم ويتخطى الموافقات عمدًا. ولحظر exec على المضيف بشكل صارم، اضبط موافقات الأمان على `deny` أو امنع أداة `exec` عبر سياسة الأداة.

## ذو صلة

<CardGroup cols={2}>
  <Card title="موافقات Exec — متقدم" href="/ar/tools/exec-approvals-advanced" icon="gear">
    الحاويات الآمنة، وربط المفسّر، وتمرير الموافقات إلى الدردشة.
  </Card>
  <Card title="أداة Exec" href="/ar/tools/exec" icon="terminal">
    أداة تنفيذ أوامر shell.
  </Card>
  <Card title="الوضع Elevated" href="/ar/tools/elevated" icon="shield-exclamation">
    مسار كسر زجاجي يتخطى أيضًا الموافقات.
  </Card>
  <Card title="العزل داخل sandbox" href="/ar/gateway/sandboxing" icon="box">
    أوضاع sandbox والوصول إلى مساحة العمل.
  </Card>
  <Card title="الأمان" href="/ar/gateway/security" icon="lock">
    نموذج الأمان والتقوية.
  </Card>
  <Card title="Sandbox مقابل سياسة الأداة مقابل elevated" href="/ar/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    متى تستخدم كل وسيلة تحكم.
  </Card>
  <Card title="Skills" href="/ar/tools/skills" icon="sparkles">
    سلوك السماح التلقائي المدعوم بالـ Skill.
  </Card>
</CardGroup>
