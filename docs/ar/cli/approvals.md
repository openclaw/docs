---
read_when:
    - تريد تعديل موافقات exec من CLI
    - تحتاج إلى إدارة قوائم السماح على مضيفي Gateway أو Node
summary: مرجع CLI لـ `openclaw approvals` و `openclaw exec-policy`
title: الموافقات
x-i18n:
    generated_at: "2026-06-27T17:20:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

إدارة موافقات التنفيذ للمضيف **المحلي**، أو **مضيف Gateway**، أو **مضيف Node**.
افتراضيًا، تستهدف الأوامر ملف الموافقات المحلي على القرص. استخدم `--gateway` لاستهداف Gateway، أو `--node` لاستهداف Node محدد.

الاسم المستعار: `openclaw exec-approvals`

ذات صلة:

- موافقات التنفيذ: [موافقات التنفيذ](/ar/tools/exec-approvals)
- Nodes: [Nodes](/ar/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` هو أمر الملاءمة المحلي لإبقاء إعدادات
`tools.exec.*` المطلوبة وملف موافقات المضيف المحلي متطابقين في خطوة واحدة.

استخدمه عندما تريد:

- فحص السياسة المحلية المطلوبة، وملف موافقات المضيف، والدمج الفعلي
- تطبيق إعداد محلي مسبق مثل YOLO أو رفض الكل
- مزامنة `tools.exec.*` المحلي وملف موافقات المضيف المحلي

أمثلة:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

أوضاع الإخراج:

- بدون `--json`: يطبع عرض الجدول القابل للقراءة البشرية
- `--json`: يطبع مخرجات منظمة قابلة للقراءة آليًا

النطاق الحالي:

- `exec-policy` **محلي فقط**
- يحدّث ملف الإعداد المحلي وملف الموافقات المحلي معًا
- **لا** يدفع السياسة إلى مضيف Gateway أو مضيف Node
- يتم رفض `--host node` في هذا الأمر لأن موافقات التنفيذ على Node تُجلب من Node في وقت التشغيل ويجب إدارتها عبر أوامر الموافقات الموجهة إلى Node بدلًا من ذلك
- يضع `openclaw exec-policy show` علامة على نطاقات `host=node` بأنها مُدارة بواسطة Node في وقت التشغيل بدلًا من اشتقاق سياسة فعالة من ملف الموافقات المحلي

إذا كنت بحاجة إلى تحرير موافقات المضيف البعيد مباشرةً، فاستمر في استخدام `openclaw approvals set --gateway`
أو `openclaw approvals set --node <id|name|ip>`.

## الأوامر الشائعة

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

يعرض `openclaw approvals get` الآن سياسة التنفيذ الفعلية للأهداف المحلية، وGateway، وNode:

- سياسة `tools.exec` المطلوبة
- سياسة ملف موافقات المضيف
- النتيجة الفعلية بعد تطبيق قواعد الأولوية

الأولوية مقصودة:

- ملف موافقات المضيف هو مصدر الحقيقة القابل للإنفاذ
- يمكن لسياسة `tools.exec` المطلوبة تضييق النية أو توسيعها، لكن النتيجة الفعلية لا تزال مشتقة من قواعد المضيف
- يجمع `--node` ملف موافقات مضيف Node مع سياسة `tools.exec` الخاصة بـ Gateway، لأن كليهما لا يزال ينطبق في وقت التشغيل
- إذا كانت إعدادات Gateway غير متاحة، يعود CLI إلى لقطة موافقات Node ويشير إلى تعذّر حساب سياسة وقت التشغيل النهائية

## استبدال الموافقات من ملف

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

يقبل `set` صيغة JSON5، وليس JSON الصارم فقط. استخدم إما `--file` أو `--stdin`، وليس كليهما.

## مثال "عدم المطالبة مطلقًا" / YOLO

بالنسبة إلى مضيف لا ينبغي أن يتوقف أبدًا عند موافقات التنفيذ، عيّن افتراضيات موافقات المضيف إلى `full` + `off`:

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

صيغة Node:

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

يغيّر هذا **ملف موافقات المضيف** فقط. لإبقاء سياسة OpenClaw المطلوبة متطابقة، عيّن أيضًا:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

لماذا `tools.exec.host=gateway` في هذا المثال:

- لا يزال `host=auto` يعني "استخدام sandbox عند توفره، وإلا Gateway".
- YOLO يتعلق بالموافقات، وليس بالتوجيه.
- إذا كنت تريد تنفيذ المضيف حتى عند إعداد sandbox، فاجعل اختيار المضيف صريحًا باستخدام `gateway` أو `/exec host=gateway`.

القيمة الافتراضية لـ `askFallback` عند حذفها هي `deny`. عيّن `askFallback: "full"`
صراحةً عند ترقية مضيف بلا واجهة مستخدم يجب أن يحافظ على سلوك عدم المطالبة مطلقًا.

اختصار محلي:

```bash
openclaw exec-policy preset yolo
```

يحدّث ذلك الاختصار المحلي كلًا من إعدادات `tools.exec.*` المحلية المطلوبة
وافتراضيات الموافقات المحلية معًا. وهو مكافئ من حيث المقصود للإعداد اليدوي ذي الخطوتين
أعلاه، لكن للجهاز المحلي فقط.

## مساعدات قائمة السماح

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## الخيارات الشائعة

يدعم كل من `get`، و`set`، و`allowlist add|remove` ما يلي:

- `--node <id|name|ip>`
- `--gateway`
- خيارات RPC المشتركة لـ Node: `--url`، `--token`، `--timeout`، `--json`

ملاحظات الاستهداف:

- عدم وجود أعلام هدف يعني ملف الموافقات المحلي على القرص
- يستهدف `--gateway` ملف موافقات مضيف Gateway
- يستهدف `--node` مضيف Node واحدًا بعد حل المعرّف، أو الاسم، أو عنوان IP، أو بادئة المعرّف

يدعم `allowlist add|remove` أيضًا:

- `--agent <id>` (القيمة الافتراضية هي `*`)

## ملاحظات

- يستخدم `--node` المحلل نفسه الذي يستخدمه `openclaw nodes` (المعرّف، أو الاسم، أو ip، أو بادئة المعرّف).
- القيمة الافتراضية لـ `--agent` هي `"*"`، ما ينطبق على جميع الوكلاء.
- يجب أن يعلن مضيف Node عن `system.execApprovals.get/set` (تطبيق macOS أو مضيف Node بلا واجهة).
- تُخزَّن ملفات الموافقات لكل مضيف في دليل حالة OpenClaw
  (`$OPENCLAW_STATE_DIR/exec-approvals.json`، أو
  `~/.openclaw/exec-approvals.json` عندما لا يكون المتغير مضبوطًا).

## ذات صلة

- [مرجع CLI](/ar/cli)
- [موافقات التنفيذ](/ar/tools/exec-approvals)
