---
read_when:
    - استضافة PeekabooBridge في OpenClaw.app
    - دمج Peekaboo عبر Swift Package Manager
    - تغيير بروتوكول/مسارات PeekabooBridge
    - الاختيار بين PeekabooBridge وCodex Computer Use وcua-driver MCP
summary: تكامل PeekabooBridge لأتمتة واجهة مستخدم macOS
title: جسر الغميضة
x-i18n:
    generated_at: "2026-05-06T08:05:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 724bc6f29b991eb824df01d2b23e87b5d5cf32eb5ebaa0cbbc321dd8fca53c9e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

يمكن لـ OpenClaw استضافة **PeekabooBridge** كوسيط محلي لأتمتة واجهة المستخدم واعٍ بالأذونات. يتيح ذلك لـ CLI الخاص بـ `peekaboo` قيادة أتمتة واجهة المستخدم مع إعادة استخدام أذونات TCC لتطبيق macOS.

## ما هذا (وما ليس كذلك)

- **المضيف**: يمكن لـ OpenClaw.app أن يعمل كمضيف لـ PeekabooBridge.
- **العميل**: استخدم CLI الخاص بـ `peekaboo` (لا توجد واجهة `openclaw ui ...` منفصلة).
- **واجهة المستخدم**: تبقى التراكبات المرئية في Peekaboo.app؛ أما OpenClaw فهو مضيف وسيط خفيف.

## العلاقة مع استخدام الكمبيوتر

لدى OpenClaw ثلاثة مسارات للتحكم بسطح المكتب، وهي منفصلة عمدًا:

- **مضيف PeekabooBridge**: يمكن لـ OpenClaw.app استضافة مقبس PeekabooBridge المحلي.
  يظل CLI الخاص بـ `peekaboo` هو العميل ويستخدم أذونات macOS الخاصة بـ OpenClaw.app
  لبدائيات أتمتة Peekaboo مثل لقطات الشاشة، والنقرات،
  والقوائم، ومربعات الحوار، وإجراءات Dock، وإدارة النوافذ.
- **استخدام الكمبيوتر في Codex**: يجهّز Plugin المضمّن `codex` خادم تطبيق Codex،
  ويتحقق من توفر خادم MCP الخاص بـ `computer-use` في Codex، ثم يتيح
  لـ Codex امتلاك استدعاءات أدوات التحكم الأصلي بسطح المكتب أثناء دورات وضع Codex. لا يقوم OpenClaw
  بتمرير هذه الإجراءات عبر PeekabooBridge.
- **MCP المباشر لـ `cua-driver`**: يمكن لـ OpenClaw تسجيل خادم
  `cua-driver mcp` upstream الخاص بـ TryCua كخادم MCP عادي. يمنح ذلك الوكلاء مخططات برنامج تشغيل CUA
  الخاصة به وسير عمل pid/window/element-index من دون التوجيه
  عبر سوق Codex أو مقبس PeekabooBridge.

استخدم Peekaboo عندما تريد سطح أتمتة macOS واسعًا ومضيف الجسر الواعي بالأذونات في OpenClaw.app. استخدم استخدام الكمبيوتر في Codex عندما ينبغي لوكيل وضع Codex الاعتماد على Plugin استخدام الكمبيوتر الأصلي في Codex. استخدم `cua-driver mcp` المباشر عندما تريد إتاحة برنامج تشغيل CUA لأي وقت تشغيل مُدار بواسطة OpenClaw كخادم MCP عادي.

## تفعيل الجسر

في تطبيق macOS:

- الإعدادات ← **Enable Peekaboo Bridge**

عند التفعيل، يبدأ OpenClaw خادم مقبس UNIX محليًا. عند التعطيل، يتم إيقاف المضيف وسيعود `peekaboo` إلى المضيفين الآخرين المتاحين.

## ترتيب اكتشاف العميل

تحاول عملاء Peekaboo عادةً المضيفين بهذا الترتيب:

1. Peekaboo.app (تجربة مستخدم كاملة)
2. Claude.app (إذا كان مثبتًا)
3. OpenClaw.app (وسيط خفيف)

استخدم `peekaboo bridge status --verbose` لمعرفة المضيف النشط ومسار المقبس المستخدم. يمكنك التجاوز باستخدام:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## الأمان والأذونات

- يتحقق الجسر من **تواقيع كود المستدعي**؛ ويتم فرض قائمة سماح لـ TeamIDs
  (TeamID مضيف Peekaboo + TeamID تطبيق OpenClaw).
- تنتهي مهلة الطلبات بعد نحو 10 ثوانٍ.
- إذا كانت الأذونات المطلوبة مفقودة، يعيد الجسر رسالة خطأ واضحة
  بدلًا من تشغيل إعدادات النظام.

## سلوك اللقطات (الأتمتة)

تُخزّن اللقطات في الذاكرة وتنتهي صلاحيتها تلقائيًا بعد نافذة قصيرة.
إذا كنت تحتاج إلى احتفاظ أطول، فأعد الالتقاط من العميل.

## استكشاف الأخطاء وإصلاحها

- إذا أبلغ `peekaboo` أن "عميل الجسر غير مصرّح له"، فتأكد من أن العميل
  موقّع بشكل صحيح أو شغّل المضيف باستخدام `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  في وضع **التصحيح** فقط.
- إذا لم يتم العثور على أي مضيفين، فافتح أحد تطبيقات المضيف (Peekaboo.app أو OpenClaw.app)
  وتأكد من منح الأذونات.

## ذات صلة

- [تطبيق macOS](/ar/platforms/macos)
- [أذونات macOS](/ar/platforms/mac/permissions)
