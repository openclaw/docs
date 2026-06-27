---
read_when:
    - استضافة PeekabooBridge في OpenClaw.app
    - دمج Peekaboo عبر Swift Package Manager
    - تغيير بروتوكول/مسارات PeekabooBridge
    - الاختيار بين PeekabooBridge وCodex Computer Use وcua-driver MCP
summary: تكامل PeekabooBridge لأتمتة واجهة مستخدم macOS
title: جسر Peekaboo
x-i18n:
    generated_at: "2026-06-27T17:58:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

يمكن لـ OpenClaw استضافة **PeekabooBridge** بصفته وسيط أتمتة واجهة مستخدم محليًا وواعيًا بالأذونات. يتيح هذا لـ CLI `peekaboo` تشغيل أتمتة واجهة المستخدم مع إعادة استخدام أذونات TCC لتطبيق macOS.

## ما هذا (وما ليس عليه)

- **المضيف**: يمكن لـ OpenClaw.app العمل كمضيف لـ PeekabooBridge.
- **العميل**: استخدم CLI `peekaboo` (لا توجد واجهة `openclaw ui ...` منفصلة).
- **واجهة المستخدم**: تبقى التراكبات المرئية في Peekaboo.app؛ وOpenClaw ليس إلا مضيف وسيط خفيفًا.

## العلاقة مع Computer Use

لدى OpenClaw ثلاثة مسارات للتحكم بسطح المكتب، وهي منفصلة عمدًا:

- **مضيف PeekabooBridge**: يمكن لـ OpenClaw.app استضافة مقبس PeekabooBridge المحلي.
  يظل CLI `peekaboo` هو العميل ويستخدم أذونات macOS الخاصة بـ OpenClaw.app
  لبدائيات أتمتة Peekaboo مثل لقطات الشاشة، والنقرات،
  والقوائم، ومربعات الحوار، وإجراءات Dock، وإدارة النوافذ.
- **Codex Computer Use**: يجهز Plugin `codex` المضمّن خادم تطبيق Codex،
  ويتحقق من توفر خادم MCP `computer-use` الخاص بـ Codex، ثم يتيح
  لـ Codex امتلاك استدعاءات أدوات التحكم الأصلي بسطح المكتب أثناء أدوار وضع Codex. لا يقوم OpenClaw
  بتمرير تلك الإجراءات عبر PeekabooBridge.
- **MCP `cua-driver` المباشر**: يمكن لـ OpenClaw تسجيل خادم
  `cua-driver mcp` العلوي من TryCua كخادم MCP عادي. يمنح ذلك الوكلاء مخططات برنامج تشغيل CUA
  الخاصة به وسير عمل pid/window/element-index من دون التوجيه
  عبر سوق Codex أو مقبس PeekabooBridge.

استخدم Peekaboo عندما تريد سطح أتمتة macOS الواسع ومضيف الجسر الواعي بالأذونات في OpenClaw.app. استخدم Codex Computer Use عندما ينبغي لوكيل وضع Codex
الاعتماد على Plugin استخدام الحاسوب الأصلي في Codex. استخدم `cua-driver mcp` المباشر
عندما تريد كشف برنامج تشغيل CUA لأي وقت تشغيل مُدار بواسطة OpenClaw كخادم
MCP عادي.

## تفعيل الجسر

في تطبيق macOS:

- الإعدادات ← **تفعيل جسر Peekaboo**

عند التفعيل، يبدأ OpenClaw خادم مقبس UNIX محليًا. إذا عُطّل، يتوقف المضيف
وسيعود `peekaboo` إلى المضيفين الآخرين المتاحين.

## ترتيب اكتشاف العميل

تحاول عملاء Peekaboo عادةً المضيفين بهذا الترتيب:

1. Peekaboo.app (تجربة مستخدم كاملة)
2. Claude.app (إذا كان مثبتًا)
3. OpenClaw.app (وسيط خفيف)

استخدم `peekaboo bridge status --verbose` لمعرفة المضيف النشط ومسار
المقبس المستخدم. يمكنك التجاوز باستخدام:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## الأمان والأذونات

- يتحقق الجسر من **توقيعات كود المستدعي**؛ ويتم فرض قائمة سماح لـ TeamIDs
  (TeamID لمضيف Peekaboo + TeamID لتطبيق OpenClaw).
- فضّل هوية الجسر/التطبيق الموقعة على وقت تشغيل `node` عام من أجل
  Accessibility. منح Accessibility لـ `node` يسمح لأي حزمة يشغلها
  ذلك الملف التنفيذي لـ Node بأن ترث وصول أتمتة الواجهة الرسومية؛ راجع
  [أذونات macOS](/ar/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- تنتهي مهلة الطلبات بعد حوالي 10 ثوانٍ.
- إذا كانت الأذونات المطلوبة مفقودة، يعيد الجسر رسالة خطأ واضحة
  بدلًا من تشغيل إعدادات النظام.

## سلوك اللقطات (الأتمتة)

تُخزّن اللقطات في الذاكرة وتنتهي صلاحيتها تلقائيًا بعد نافذة قصيرة.
إذا كنت تحتاج إلى احتفاظ أطول، فأعد الالتقاط من العميل.

## استكشاف الأخطاء وإصلاحها

- إذا أبلغ `peekaboo` أن "bridge client is not authorized"، فتأكد من أن العميل
  موقّع بشكل صحيح أو شغّل المضيف باستخدام `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  في وضع **التصحيح** فقط.
- إذا لم يُعثر على أي مضيفين، فافتح أحد تطبيقات المضيف (Peekaboo.app أو OpenClaw.app)
  وتأكد من منح الأذونات.

## ذات صلة

- [تطبيق macOS](/ar/platforms/macos)
- [أذونات macOS](/ar/platforms/mac/permissions)
