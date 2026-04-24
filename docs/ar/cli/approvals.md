---
read_when:
    - تريد تعديل موافقات exec من خلال CLI
    - تحتاج إلى إدارة قوائم السماح على مضيفات Gateway أو Node
summary: مرجع CLI لـ `openclaw approvals` و`openclaw exec-policy`
title: الموافقات
x-i18n:
    generated_at: "2026-04-24T07:33:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7403f0e35616db5baf3d1564c8c405b3883fc3e5032da9c6a19a32dba8c5fb7d
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

إدارة موافقات exec الخاصة بـ **المضيف المحلي** أو **مضيف Gateway** أو **مضيف Node**.
افتراضيًا، تستهدف الأوامر ملف الموافقات المحلي على القرص. استخدم `--gateway` للاستهداف على Gateway، أو `--node` لاستهداف Node معيّن.

الاسم البديل: `openclaw exec-approvals`

ذو صلة:

- موافقات exec: [موافقات exec](/ar/tools/exec-approvals)
- Nodes: [Nodes](/ar/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` هو أمر الراحة المحلي للحفاظ على توافق
تهيئة `tools.exec.*` المطلوبة وملف الموافقات الخاص بالمضيف المحلي في خطوة واحدة.

استخدمه عندما تريد:

- فحص السياسة المحلية المطلوبة، وملف موافقات المضيف، والدمج الفعّال
- تطبيق إعداد محلي مسبق مثل YOLO أو deny-all
- مزامنة `tools.exec.*` المحلي و`~/.openclaw/exec-approvals.json` المحلي

أمثلة:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

أوضاع الإخراج:

- بدون `--json`: يطبع عرض الجدول المقروء للبشر
- مع `--json`: يطبع إخراجًا منظمًا قابلًا للقراءة الآلية

النطاق الحالي:

- `exec-policy` **محلي فقط**
- يحدّث ملف التهيئة المحلي وملف الموافقات المحلي معًا
- لا يدفع السياسة إلى مضيف Gateway أو مضيف Node
- يتم رفض `--host node` في هذا الأمر لأن موافقات exec الخاصة بـ Node تُجلَب من Node وقت التشغيل ويجب إدارتها عبر أوامر الموافقات الموجهة إلى Node بدلًا من ذلك
- يعلّم `openclaw exec-policy show` نطاقات `host=node` على أنها مُدارة من Node وقت التشغيل بدلًا من اشتقاق سياسة فعّالة من ملف الموافقات المحلي

إذا كنت بحاجة إلى تعديل موافقات مضيفات بعيدة مباشرةً، فاستمر في استخدام `openclaw approvals set --gateway`
أو `openclaw approvals set --node <id|name|ip>`.

## أوامر شائعة

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

يعرض `openclaw approvals get` الآن سياسة exec الفعّالة للأهداف المحلية وأهداف Gateway وNode:

- سياسة `tools.exec` المطلوبة
- سياسة ملف موافقات المضيف
- النتيجة الفعّالة بعد تطبيق قواعد الأسبقية

الأسبقية مقصودة:

- ملف موافقات المضيف هو مصدر الحقيقة القابل للإنفاذ
- يمكن لسياسة `tools.exec` المطلوبة أن تضيق النية أو توسعها، لكن النتيجة الفعّالة تظل مشتقة من قواعد المضيف
- يجمع `--node` بين ملف موافقات مضيف Node وسياسة `tools.exec` الخاصة بـ Gateway، لأن كلاهما لا يزال يُطبَّق وقت التشغيل
- إذا لم تكن تهيئة Gateway متاحة، يعود CLI إلى لقطة موافقات Node ويشير إلى أنه لم يمكن حساب سياسة وقت التشغيل النهائية

## استبدال الموافقات من ملف

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

يقبل `set` تنسيق JSON5، وليس JSON الصارم فقط. استخدم إما `--file` أو `--stdin`، وليس كليهما.

## مثال "عدم السؤال مطلقًا" / YOLO

بالنسبة إلى مضيف يجب ألا يتوقف أبدًا عند موافقات exec، اضبط القيم الافتراضية لموافقات المضيف إلى `full` + `off`:

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

يغيّر هذا **ملف موافقات المضيف** فقط. ولإبقاء سياسة OpenClaw المطلوبة متوافقة، اضبط أيضًا:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

لماذا `tools.exec.host=gateway` في هذا المثال:

- ما زال `host=auto` يعني "sandbox عند توفره، وإلا فـ Gateway".
- يتعلق YOLO بالموافقات، وليس بالتوجيه.
- إذا كنت تريد exec على المضيف حتى عند تهيئة sandbox، فاجعل اختيار المضيف صريحًا باستخدام `gateway` أو `/exec host=gateway`.

وهذا يطابق سلوك YOLO الحالي الافتراضي للمضيف. شدّده إذا كنت تريد موافقات.

اختصار محلي:

```bash
openclaw exec-policy preset yolo
```

يحدّث هذا الاختصار المحلي كلًا من تهيئة `tools.exec.*` المحلية المطلوبة
والقيم الافتراضية للموافقات المحلية معًا. وهو مكافئ من حيث النية للإعداد اليدوي
ذي الخطوتين أعلاه، لكنه مخصص للجهاز المحلي فقط.

## مساعدات قائمة السماح

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## خيارات شائعة

تدعم الأوامر `get` و`set` و`allowlist add|remove` جميعها:

- `--node <id|name|ip>`
- `--gateway`
- خيارات RPC المشتركة الخاصة بـ Node: `--url`, `--token`, `--timeout`, `--json`

ملاحظات الاستهداف:

- عدم استخدام أي علامات استهداف يعني ملف الموافقات المحلي على القرص
- يستهدف `--gateway` ملف موافقات مضيف Gateway
- يستهدف `--node` مضيف Node واحدًا بعد resolve المعرّف أو الاسم أو IP أو بادئة المعرّف

كما يدعم `allowlist add|remove` أيضًا:

- `--agent <id>` (الافتراضي `*`)

## ملاحظات

- يستخدم `--node` نفس المحلِّل الذي يستخدمه `openclaw nodes` ‏(المعرّف أو الاسم أو ip أو بادئة المعرّف).
- القيمة الافتراضية لـ `--agent` هي `"*"`, وهذا ينطبق على جميع الوكلاء.
- يجب أن يعلن مضيف Node عن `system.execApprovals.get/set` ‏(تطبيق macOS أو مضيف Node دون واجهة).
- تُخزَّن ملفات الموافقات لكل مضيف في `~/.openclaw/exec-approvals.json`.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [موافقات exec](/ar/tools/exec-approvals)
