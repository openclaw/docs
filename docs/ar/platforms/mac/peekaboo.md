---
read_when:
    - استضافة PeekabooBridge في OpenClaw.app
    - دمج Peekaboo عبر Swift Package Manager
    - تغيير بروتوكول/مسارات PeekabooBridge
    - الاختيار بين PeekabooBridge وCodex Computer Use وcua-driver MCP
summary: تكامل PeekabooBridge لأتمتة واجهة مستخدم macOS
title: جسر Peekaboo
x-i18n:
    generated_at: "2026-07-12T06:06:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 030b5017f6a43df58e6843e8a4c37448bdaaa41ac7d7d7ab2a46cce05fa9f893
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

يمكن لـ OpenClaw استضافة **PeekabooBridge** كوسيط محلي لأتمتة واجهة المستخدم يراعي الأذونات (`PeekabooBridgeHostCoordinator`، والمدعوم بحزمة Swift المسماة `steipete/Peekaboo`). يتيح ذلك لـ CLI ‏`peekaboo` تنفيذ أتمتة واجهة المستخدم مع إعادة استخدام أذونات TCC الخاصة بتطبيق macOS.

## ما هذا (وما ليس كذلك)

- **المضيف**: يمكن لتطبيق OpenClaw.app العمل كمضيف لـ PeekabooBridge.
- **العميل**: CLI ‏`peekaboo` (لا توجد واجهة مستقلة باسم `openclaw ui ...`).
- **واجهة المستخدم**: تبقى التراكبات المرئية في Peekaboo.app؛ ويعمل OpenClaw كمضيف وسيط خفيف.

## العلاقة بمسارات التحكم الأخرى في سطح المكتب

لدى OpenClaw أربعة مسارات للتحكم في سطح المكتب، وتظل منفصلة عن قصد:

- **مضيف PeekabooBridge**: يستضيف OpenClaw.app مقبس PeekabooBridge المحلي. ويكون CLI ‏`peekaboo` هو العميل، ويستخدم أذونات macOS الخاصة بـ OpenClaw.app لالتقاط لقطات الشاشة، والنقر، والقوائم، ومربعات الحوار، وإجراءات Dock، وإدارة النوافذ.
- **استخدام الحاسوب بواسطة الوكيل (`computer.act`)**: تلتقط أداة `computer` المدمجة في وكيل Gateway لقطات الشاشة عبر `screen.snapshot`، وتتحكم في المؤشر ولوحة المفاتيح من خلال أمر Node الخطِر `computer.act`. تنفّذ Node تعمل على macOS الأمر `computer.act` داخل العملية باستخدام خدمات أتمتة Peekaboo المضمّنة التي يتيحها هذا الجسر، إلى جانب بدائيات CoreGraphics محدودة النطاق، من دون المرور عبر مقبس PeekabooBridge أو CLI ‏`peekaboo`. راجع [استخدام الحاسوب](/nodes/computer-use).
- **استخدام الحاسوب في Codex**: يتحقق Plugin ‏`codex` المضمّن من Plugin ‏MCP ‏`computer-use` الخاص بـ Codex، ويمكنه تثبيته (`extensions/codex/src/app-server/computer-use.ts`)، ثم يتيح لـ Codex تولّي استدعاءات أدوات التحكم الأصلية في سطح المكتب أثناء أدوار وضع Codex. لا يمرر OpenClaw هذه الإجراءات عبر PeekabooBridge.
- **MCP ‏`cua-driver` المباشر**: يمكن لـ OpenClaw تسجيل خادم `cua-driver mcp` الأصلي من TryCua كخادم MCP عادي، ما يمنح الوكلاء مخططات برنامج تشغيل CUA وسير عمل معرّف العملية/النافذة/فهرس العنصر الخاص به، من دون التوجيه عبر متجر Codex أو مقبس PeekabooBridge.

استخدم Peekaboo للحصول على نطاق أتمتة macOS الواسع عبر مضيف الجسر المراعي للأذونات في OpenClaw.app. واستخدم التحكم في الحاسوب بواسطة الوكيل عندما ينبغي لوكيل Gateway رؤية سطح المكتب والتحكم فيه عبر أمر Node موحّد `computer.act` يمكن لأي نموذج رؤية تشغيله. واستخدم استخدام الحاسوب في Codex عندما ينبغي لوكيل يعمل في وضع Codex الاعتماد على Plugin الأصلي الخاص بـ Codex. واستخدم `cua-driver mcp` المباشر لإتاحة برنامج تشغيل CUA لأي بيئة تشغيل يديرها OpenClaw بوصفه خادم MCP عاديًا.

## تمكين الجسر

في تطبيق macOS: **Settings -> Enable Peekaboo Bridge**.

عند تمكينه، يبدأ OpenClaw خادم مقبس UNIX محليًا في `~/Library/Application Support/OpenClaw/<socket-name>`. وإذا عُطّل، يتوقف المضيف ويعود `peekaboo` إلى المضيفين الآخرين المتاحين. ويحافظ المنسّق أيضًا على روابط رمزية قديمة للمقابس (`clawdbot` و`clawdis` و`moltbot` ضمن Application Support) تشير إلى المقبس الحالي لتثبيتات `peekaboo` الأقدم.

## ترتيب اكتشاف العميل

تحاول عملاء Peekaboo عادةً الاتصال بالمضيفين بالترتيب الآتي:

1. Peekaboo.app (تجربة مستخدم كاملة)
2. Claude.app (إذا كان مثبتًا)
3. OpenClaw.app (وسيط خفيف)

استخدم `peekaboo bridge status --verbose` لمعرفة المضيف النشط ومسار المقبس المستخدم. يمكنك التجاوز باستخدام:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## الأمان والأذونات

- يتحقق الجسر من **توقيعات رمز المستدعي**؛ وتُفرض قائمة سماح لمعرّفات TeamID (معرّف TeamID لمضيف Peekaboo، بالإضافة إلى معرّف TeamID الخاص بالتطبيق قيد التشغيل).
- فضّل هوية الجسر/التطبيق الموقّعة على بيئة تشغيل `node` عامة لأذونات تسهيلات الاستخدام. إذ إن منح تسهيلات الاستخدام إلى `node` يتيح لأي حزمة يشغّلها ملف Node التنفيذي هذا أن ترث صلاحية أتمتة الواجهة الرسومية؛ راجع [أذونات macOS](/ar/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- تنتهي مهلة الطلبات بعد 10 ثوانٍ (`requestTimeoutSec: 10`).
- إذا كانت الأذونات المطلوبة مفقودة، يعيد الجسر رسالة خطأ واضحة بدلًا من تشغيل إعدادات النظام.

## سلوك اللقطات (الأتمتة)

تُخزّن اللقطات في الذاكرة ضمن نافذة صلاحية مدتها 10 دقائق، وبحد أقصى يبلغ 50 لقطة (`InMemorySnapshotManager`)؛ ولا تُحذف المخرجات عند التنظيف. إذا كنت تحتاج إلى احتفاظ أطول، فأعد الالتقاط من العميل.

## استكشاف الأخطاء وإصلاحها

- إذا أبلغ `peekaboo` بأن "عميل الجسر غير مخوّل"، فتأكد من أن العميل موقّع بصورة صحيحة، أو شغّل المضيف باستخدام `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` في وضع **تصحيح الأخطاء** فقط.
- إذا لم يُعثر على أي مضيف، فافتح أحد تطبيقات المضيف (Peekaboo.app أو OpenClaw.app) وتأكد من منح الأذونات.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [أذونات macOS](/ar/platforms/mac/permissions)
