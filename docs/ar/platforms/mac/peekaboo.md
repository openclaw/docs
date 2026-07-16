---
read_when:
    - استضافة PeekabooBridge في OpenClaw.app
    - دمج Peekaboo عبر مدير حزم Swift
    - تغيير بروتوكول/مسارات PeekabooBridge
    - الاختيار بين PeekabooBridge وCodex Computer Use وcua-driver MCP
summary: تكامل PeekabooBridge لأتمتة واجهة مستخدم macOS
title: جسر Peekaboo
x-i18n:
    generated_at: "2026-07-16T14:23:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 24d4187b2f5c5f11f44a24e25b350adaa3b068f24dce640ec695d52eb61f8e9a
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

يمكن لـ OpenClaw استضافة **PeekabooBridge** بصفته وسيطًا محليًا لأتمتة واجهة المستخدم يراعي الأذونات (`PeekabooBridgeHostCoordinator`، والمدعوم بحزمة Swift ‏`steipete/Peekaboo`). يتيح ذلك لـ CLI ‏`peekaboo` تشغيل أتمتة واجهة المستخدم مع إعادة استخدام أذونات TCC لتطبيق macOS.

## ماهية هذا (وما ليس هو)

- **المضيف**: يمكن لـ OpenClaw.app العمل بصفته مضيفًا لـ PeekabooBridge.
- **العميل**: CLI ‏`peekaboo` (لا توجد واجهة مستقلة لـ `openclaw ui ...`).
- **واجهة المستخدم**: تظل التراكبات المرئية في Peekaboo.app؛ أما OpenClaw فهو مضيف وسيط بسيط.

## العلاقة بمسارات التحكم الأخرى في سطح المكتب

لدى OpenClaw أربعة مسارات للتحكم في سطح المكتب، وتظل منفصلة عن قصد:

- **مضيف PeekabooBridge**: يستضيف OpenClaw.app مقبس PeekabooBridge المحلي. ويكون CLI ‏`peekaboo` هو العميل، ويستخدم أذونات macOS الخاصة بـ OpenClaw.app لالتقاط لقطات الشاشة، والنقر، والتعامل مع القوائم ومربعات الحوار وإجراءات Dock وإدارة النوافذ.
- **استخدام الحاسوب بواسطة الوكيل (`computer.act`)**: تلتقط أداة `computer` المضمّنة في وكيل Gateway لقطات الشاشة عبر `screen.snapshot`، وتتحكم في المؤشر ولوحة المفاتيح من خلال أمر Node الخطِر `computer.act`. تنفّذ عقدة macOS الأمر `computer.act` داخل العملية باستخدام خدمات أتمتة Peekaboo المضمّنة التي يتيحها هذا الجسر، إلى جانب وظائف CoreGraphics محدودة، من دون المرور عبر مقبس PeekabooBridge أو CLI ‏`peekaboo`. راجع [استخدام الحاسوب](/ar/nodes/computer-use).
- **استخدام الحاسوب عبر Codex**: يتحقق Plugin المضمّن `codex` من Plugin ‏MCP الخاص بـ Codex ‏`computer-use` ويمكنه تثبيته (`extensions/codex/src/app-server/computer-use.ts`)؛ ثم يتيح لـ Codex تولّي استدعاءات أدوات التحكم الأصلية في سطح المكتب أثناء دورات وضع Codex. لا يمرر OpenClaw هذه الإجراءات عبر PeekabooBridge.
- **MCP مباشر لـ `cua-driver`**: يمكن لـ OpenClaw تسجيل خادم `cua-driver mcp` الأصلي من TryCua بصفته خادم MCP عاديًا، ما يمنح الوكلاء مخططات برنامج تشغيل CUA نفسه وسير عمل pid/window/element-index من دون التوجيه عبر متجر Codex أو مقبس PeekabooBridge.

استخدم Peekaboo للاستفادة من نطاق أتمتة macOS الواسع عبر مضيف الجسر المراعي للأذونات في OpenClaw.app. واستخدم التحكم في الحاسوب بواسطة الوكيل عندما ينبغي لوكيل Gateway رؤية سطح المكتب والتحكم فيه من خلال أمر Node موحّد `computer.act` يمكن لأي نموذج رؤية تشغيله. واستخدم استخدام الحاسوب عبر Codex عندما ينبغي لوكيل في وضع Codex الاعتماد على Plugin الأصلي لـ Codex. واستخدم `cua-driver mcp` المباشر لإتاحة برنامج تشغيل CUA لأي بيئة تشغيل يديرها OpenClaw بصفته خادم MCP عاديًا.

## تمكين الجسر

في تطبيق macOS: **Settings -> Enable Peekaboo Bridge**. يتطلب مفتاح التبديل تشغيل **Allow Computer Control**، لأن كليهما يمنح أتمتة محلية لواجهة المستخدم؛ وعندما يكون Computer Control متوقفًا، يُعطّل مفتاح التبديل ولا يعمل المضيف. لتشغيل Peekaboo من دون Computer Control، شغّل تطبيق Mac الخاص بـ Peekaboo بصفته المضيف بدلًا من ذلك.

عند تمكينه (وتشغيل Computer Control)، يبدأ OpenClaw خادم مقبس UNIX محليًا في `~/Library/Application Support/OpenClaw/<socket-name>`. وإذا عُطّل، يتوقف المضيف ويلجأ `peekaboo` إلى المضيفين الآخرين المتاحين. ويحافظ المنسّق أيضًا على روابط رمزية قديمة للمقابس (`clawdbot` و`clawdis` و`moltbot` ضمن Application Support) تشير إلى المقبس الحالي من أجل تثبيتات `peekaboo` الأقدم.

## ترتيب اكتشاف العميل

تحاول عملاء Peekaboo عادةً الاتصال بالمضيفين بالترتيب التالي:

1. Peekaboo.app (تجربة مستخدم كاملة)
2. Claude.app (إذا كان مثبّتًا)
3. OpenClaw.app (وسيط بسيط)

استخدم `peekaboo bridge status --verbose` لمعرفة المضيف النشط ومسار المقبس المستخدم. ويمكن التجاوز باستخدام:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## الأمان والأذونات

- يتحقق الجسر من **توقيعات التعليمات البرمجية للمتصل**؛ وتُفرض قائمة سماح لمعرّفات TeamID (معرّف TeamID لمضيف Peekaboo بالإضافة إلى معرّف TeamID الخاص بالتطبيق الجاري تشغيله).
- يُفضّل استخدام هوية الجسر/التطبيق الموقّعة بدلًا من بيئة تشغيل `node` عامة لإمكانية الوصول. إذ يتيح منح إمكانية الوصول إلى `node` لأي حزمة يشغّلها ملف Node التنفيذي ذلك أن ترث صلاحية أتمتة واجهة المستخدم الرسومية؛ راجع [أذونات macOS](/ar/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- تنتهي مهلة الطلبات بعد 10 ثوانٍ (`requestTimeoutSec: 10`).
- إذا كانت الأذونات المطلوبة مفقودة، يعيد الجسر رسالة خطأ واضحة بدلًا من تشغيل System Settings.

## سلوك اللقطات (الأتمتة)

تُخزّن اللقطات في الذاكرة ضمن فترة صلاحية مدتها 10 دقائق، وبحد أقصى قدره 50 لقطة (`InMemorySnapshotManager`)؛ ولا تُحذف العناصر الناتجة عند التنظيف. إذا لزم الاحتفاظ بها مدة أطول، فأعِد التقاطها من العميل.

## استكشاف الأخطاء وإصلاحها

- إذا أبلغ `peekaboo` عن "عميل الجسر غير مصرّح له"، فتأكد من توقيع العميل توقيعًا صحيحًا، أو شغّل المضيف باستخدام `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` في وضع **debug** فقط.
- إذا لم يُعثر على أي مضيف، فافتح أحد تطبيقات المضيف (Peekaboo.app أو OpenClaw.app) وتأكد من منح الأذونات.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [أذونات macOS](/ar/platforms/mac/permissions)
