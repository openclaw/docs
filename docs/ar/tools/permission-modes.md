---
read_when:
    - اختيار auto أو ask أو allowlist أو full أو deny لأذونات الأوامر
    - تكوين الموافقات التي راجعها Codex Guardian عبر `tools.exec.mode`
    - مقارنة موافقات تنفيذ OpenClaw مع أذونات حزمة ACPX
summary: أوضاع الأذونات لتنفيذ المضيف، وموافقات Codex Guardian، وجلسات حزمة ACPX
title: أوضاع الأذونات
x-i18n:
    generated_at: "2026-06-27T18:44:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ce89cadb45b3b96ce9ab62b35c06610d02f0ff02f15ef7d2128c59fbebb325a
    source_path: tools/permission-modes.md
    workflow: 16
---

تحدد أوضاع الأذونات مقدار الصلاحية التي يمتلكها الوكيل قبل أن يتمكن من تشغيل أوامر المضيف، أو كتابة الملفات، أو طلب وصول إضافي من حزمة خلفية. ابدأ بـ `tools.exec.mode: "auto"` عندما تريد أن يستخدم OpenClaw قوائم السماح أولًا، ثم المراجعة التلقائية الأصلية في Codex أو مسار موافقة بشري عند عدم التطابق.

<Note>
  وضع الأذونات منفصل عن `tools.exec.host=auto`. يختار `tools.exec.host`
  مكان تشغيل الأمر. ويختار `tools.exec.mode` طريقة اعتماد تنفيذ المضيف.
</Note>

## الإعداد الافتراضي الموصى به

استخدم `auto` لوكلاء البرمجة الذين يحتاجون إلى وصول مفيد إلى المضيف من دون تحويل كل عدم تطابق إلى طلب بشري:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

ثم تحقق من السياسة الفعلية:

```bash
openclaw exec-policy show
```

في وضع `auto`، يشغل OpenClaw مطابقات قائمة السماح الحتمية مباشرة. تمر حالات عدم تطابق الموافقة أولًا عبر المراجع التلقائي الأصلي في OpenClaw، ثم تعود إلى مسار الموافقة البشري المكوّن عند الحاجة.

## أوضاع تنفيذ المضيف في OpenClaw

`tools.exec.mode` هو سطح السياسة الموحّد لتنفيذ `exec` على المضيف.

| الوضع        | السلوك                                     | استخدمه عندما                                              |
| ----------- | -------------------------------------------- | ----------------------------------------------------- |
| `deny`      | حظر تنفيذ المضيف.                             | لا يُسمح بأي أوامر على المضيف.                         |
| `allowlist` | تشغيل الأوامر المدرجة في قائمة السماح فقط.               | لديك مجموعة أوامر معروفة بأنها آمنة.                    |
| `ask`       | تشغيل مطابقات قائمة السماح والسؤال عند عدم التطابق.     | يجب أن يراجع إنسان الأوامر الجديدة.                   |
| `auto`      | تشغيل مطابقات قائمة السماح، ثم استخدام المراجعة التلقائية. | تحتاج جلسات البرمجة إلى وصول عملي ومحروس.        |
| `full`      | تشغيل تنفيذ المضيف من دون مطالبات.               | يجب أن يتجاوز هذا المضيف/هذه الجلسة الموثوقة بوابات الموافقة. |

للاطلاع على سياسة تنفيذ المضيف الكاملة، وملف الموافقات المحلي، ومخطط قائمة السماح، والثنائيات الآمنة، وسلوك التمرير، راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

## ربط Codex Guardian

بالنسبة إلى جلسات خادم التطبيق الأصلية في Codex، يُربط `tools.exec.mode: "auto"` بموافقات يراجعها Codex Guardian عندما تسمح متطلبات Codex المحلية بذلك. يرسل OpenClaw عادةً:

| حقل Codex         | القيمة النموذجية     |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

في وضع `auto`، لا يحتفظ OpenClaw بتجاوزات Codex القديمة غير الآمنة مثل `approvalPolicy: "never"` أو `sandbox: "danger-full-access"`. استخدم `tools.exec.mode: "full"` فقط عندما تريد عمدًا وضعًا بلا موافقات.

لإعداد خادم التطبيق، وترتيب المصادقة، وتفاصيل وقت تشغيل Codex الأصلي، راجع [حزمة Codex](/ar/plugins/codex-harness).

## أذونات حزمة ACPX

جلسات ACPX غير تفاعلية، لذلك لا يمكنها النقر على مطالبة أذونات TTY. يستخدم ACPX إعدادات منفصلة على مستوى الحزمة ضمن `plugins.entries.acpx.config`:

| الإعداد                     | القيمة الشائعة    | المعنى                                     |
| --------------------------- | --------------- | ------------------------------------------- |
| `permissionMode`            | `approve-reads` | الموافقة التلقائية على القراءات فقط.                    |
| `permissionMode`            | `approve-all`   | الموافقة التلقائية على الكتابات وأوامر الصدفة.     |
| `permissionMode`            | `deny-all`      | رفض كل مطالبات الأذونات.                |
| `nonInteractivePermissions` | `fail`          | الإيقاف عندما تكون المطالبة مطلوبة.      |
| `nonInteractivePermissions` | `deny`          | رفض المطالبة والمتابعة عندما يكون ذلك ممكنًا. |

اضبط أذونات ACPX بشكل منفصل عن موافقات التنفيذ في OpenClaw:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

استخدم `approve-all` بوصفه مكافئ الطوارئ في ACPX لجلسة حزمة بلا مطالبات. للحصول على تفاصيل الإعداد وأنماط الفشل، راجع [إعداد وكلاء ACP](/ar/tools/acp-agents-setup#permission-configuration).

## اختيار وضع

| الهدف                                          | التكوين                                                   |
| --------------------------------------------- | ----------------------------------------------------------- |
| حظر أوامر المضيف بالكامل                | `tools.exec.mode: "deny"`                                   |
| السماح بتشغيل الأوامر المعروفة بأنها آمنة فقط              | `tools.exec.mode: "allowlist"`                              |
| سؤال إنسان عن كل شكل أمر جديد       | `tools.exec.mode: "ask"`                                    |
| استخدام المراجعة التلقائية في Codex/OpenClaw قبل البشر  | `tools.exec.mode: "auto"`                                   |
| تخطي موافقات تنفيذ المضيف بالكامل             | `tools.exec.mode: "full"` بالإضافة إلى ملف موافقات مضيف مطابق |
| جعل جلسات ACPX غير التفاعلية تكتب/تنفذ | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

إذا ظل الأمر يعرض مطالبة أو يفشل بعد تغيير الوضع، فتحقق من الطبقتين:

```bash
openclaw approvals get
openclaw exec-policy show
```

يستخدم تنفيذ المضيف النتيجة الأكثر صرامة بين إعدادات OpenClaw وملف الموافقات المحلي على المضيف. لا تخفف أذونات حزمة ACPX من موافقات تنفيذ المضيف، ولا تخفف موافقات تنفيذ المضيف من مطالبات حزمة ACPX.

## ذات صلة

- [موافقات التنفيذ](/ar/tools/exec-approvals)
- [موافقات التنفيذ - متقدم](/ar/tools/exec-approvals-advanced)
- [حزمة Codex](/ar/plugins/codex-harness)
- [إعداد وكلاء ACP](/ar/tools/acp-agents-setup#permission-configuration)
