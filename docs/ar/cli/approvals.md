---
read_when:
    - تريد تعديل موافقات التنفيذ من CLI
    - تحتاج إلى إدارة قوائم السماح على مضيفي Gateway أو Node
summary: مرجع CLI للأمرين `openclaw approvals` و`openclaw exec-policy`
title: الموافقات
x-i18n:
    generated_at: "2026-07-12T05:40:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

إدارة موافقات التنفيذ للمضيف **المحلي** أو **مضيف Gateway** أو **مضيف Node**. عند عدم تحديد علامة هدف، تقرأ الأوامر ملف الموافقات المحلي على القرص أو تكتب فيه. استخدم `--gateway` لاستهداف Gateway، أو `--node <id|name|ip>` لاستهداف Node محدد.

الاسم البديل: `openclaw exec-approvals`

ذو صلة: [موافقات التنفيذ](/ar/tools/exec-approvals)، [العُقد](/ar/nodes)

## `openclaw exec-policy`

الأمر `openclaw exec-policy` هو أمر ملائم **محلي فقط** يُبقي إعدادات `tools.exec.*` المطلوبة وملف موافقات المضيف المحلي متزامنين في خطوة واحدة:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

تطبّق الإعدادات المسبقة (`yolo` و`cautious` و`deny-all`) القيم `host` و`security` و`ask` و`askFallback` معًا. أما `set` فيطبّق العلامات التي تمررها فقط؛ ويُتحقق من صحة كل قيمة مقبولة (`--host auto|sandbox|gateway|node` و`--security deny|allowlist|full` و`--ask off|on-miss|always` و`--ask-fallback deny|allowlist|full`).

النطاق:

- يحدّث ملف الإعدادات المحلي وملف الموافقات المحلي معًا؛ ولا يدفع السياسة إلى Gateway أو مضيف Node.
- تُرفض القيمة `--host node`: تُجلب موافقات تنفيذ Node من Node في وقت التشغيل، ولذلك لا يستطيع `exec-policy` المحلي مزامنتها. استخدم بدلًا منه `openclaw approvals set --node <id|name|ip>`.
- يضع `exec-policy show` علامة على نطاقات `host=node` بأنها مُدارة بواسطة Node في وقت التشغيل بدلًا من اشتقاق سياسة فعّالة من ملف الموافقات المحلي.

لموافقات المضيف البعيد، استخدم مباشرةً `openclaw approvals set --gateway` أو `openclaw approvals set --node <id|name|ip>`.

## الأوامر الشائعة

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

يعرض `get` سياسة التنفيذ الفعّالة للهدف: سياسة `tools.exec` المطلوبة، وسياسة ملف موافقات المضيف، والنتيجة الفعّالة المدمجة. تعرض العُقد ذات السياسة الأصلية للمضيف، مثل التطبيق المرافق لنظام Windows، تلك السياسة مباشرةً بدلًا من تطبيق حسابات سياسة ملف موافقات OpenClaw.

بالنسبة إلى العُقد المستندة إلى ملف، يتطلب العرض المدمج لقطة للسياسة جرى حلّها على المضيف. تعرض العُقد الأقدم السياسة الفعّالة على أنها غير متاحة بدلًا من افتراض أن سياسة Gateway المطلوبة تنطبق أيضًا على المضيف.

<Note>
لا تُضمّن تجاوزات `/exec` الخاصة بكل جلسة. شغّل `/exec` في الجلسة المعنية لفحص قيمها الافتراضية الحالية.
</Note>

ترتيب الأولوية:

- ملف موافقات المضيف هو مصدر الحقيقة القابل للإنفاذ.
- يمكن لسياسة `tools.exec` المطلوبة تضييق المقصود أو توسيعه، لكن النتيجة الفعّالة تُشتق من قواعد المضيف.
- يجمع `--node` بين ملف موافقات مضيف Node وسياسة `tools.exec` في Gateway (يُطبّق كلاهما في وقت التشغيل).
- إذا لم تكن إعدادات Gateway متاحة، يعود CLI إلى لقطة موافقات Node ويشير إلى تعذّر حساب سياسة وقت التشغيل النهائية.

## استبدال الموافقات من ملف

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

يقبل `set` تنسيق JSON5، وليس JSON الصارم فقط. استخدم إما `--file` أو `--stdin`، وليس كليهما.

تستخدم عُقد Windows الأصلية للمضيف بنية السياسة الخاصة بها:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

يقرأ CLI أولًا التجزئة الحالية لـ Node ويرسلها مع التحديث، بحيث تُرفض التعديلات المحلية المتزامنة بدلًا من استبدالها. الحقل `rules` مطلوب لأن هذه العملية تستبدل قائمة قواعد Node الكاملة؛ أما `defaultAction` فهو اختياري. لا يمكن إعداد Node يبلّغ عن تعطيل سياسته الأصلية عن بُعد؛ فعّل السياسة أو أعدّها على ذلك المضيف أولًا. لا تدعم السياسات الأصلية للمضيف مساعدات `allowlist add|remove`.

## مثال «عدم المطالبة مطلقًا» / YOLO

اضبط القيم الافتراضية لموافقات المضيف على `full` و`off` لمضيف يجب ألا يتوقف مطلقًا عند موافقات التنفيذ:

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

بالنسبة إلى العُقد التي تكشف ملف موافقات OpenClaw، استخدم المحتوى نفسه مع `openclaw approvals set --node <id|name|ip> --stdin`. تتطلب العُقد الأصلية للمضيف البنية الخاصة بمالكها والموضحة أعلاه.

يغيّر هذا **ملف موافقات المضيف** فقط. ولإبقاء سياسة OpenClaw المطلوبة متوافقة، اضبط أيضًا:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

القيمة `tools.exec.host=gateway` صريحة هنا لأن `host=auto` لا تزال تعني «بيئة العزل عند توفرها، وإلا Gateway»: يتعلق YOLO بالموافقات، لا بالتوجيه. استخدم `gateway` (أو `/exec host=gateway`) عندما تريد التنفيذ على المضيف حتى مع إعداد بيئة عزل.

القيمة الافتراضية للحقل `askFallback` عند حذفه هي `deny`. اضبط `askFallback: "full"` صراحةً عند ترقية مضيف بلا واجهة مستخدم يجب أن يحافظ على سلوك عدم المطالبة مطلقًا.

اختصار محلي للغرض نفسه، على الجهاز المحلي فقط:

```bash
openclaw exec-policy preset yolo
```

## مساعدات قائمة السماح

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## الخيارات الشائعة

تدعم `get` و`set` و`allowlist add|remove` جميعها ما يلي:

- `--node <id|name|ip>` (يحل المعرّف أو الاسم أو عنوان IP أو بادئة المعرّف؛ وهو المحلل نفسه المستخدم في `openclaw nodes`)
- `--gateway`
- خيارات RPC المشتركة لـ Node: `--url` و`--token` و`--timeout` و`--json`

يعني عدم تحديد علامة هدف استخدام ملف الموافقات المحلي على القرص.

تدعم `allowlist add|remove` أيضًا الخيار `--agent <id>` (قيمته الافتراضية `"*"`، ما يجعله ينطبق على جميع الوكلاء).

## ملاحظات

- يجب أن يعلن مضيف Node عن `system.execApprovals.get/set` (تطبيق macOS أو مضيف Node بلا واجهة رسومية أو التطبيق المرافق لنظام Windows).
- تُخزّن ملفات الموافقات لكل مضيف في دليل حالة OpenClaw: `$OPENCLAW_STATE_DIR/exec-approvals.json`، أو `~/.openclaw/exec-approvals.json` عندما لا يكون المتغير مضبوطًا.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [موافقات التنفيذ](/ar/tools/exec-approvals)
