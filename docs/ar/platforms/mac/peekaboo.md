---
read_when:
    - استضافة PeekabooBridge في OpenClaw.app
    - دمج Peekaboo عبر Swift Package Manager
    - تغيير بروتوكول/مسارات PeekabooBridge
    - الاختيار بين PeekabooBridge وCodex Computer Use وcua-driver MCP
summary: تكامل PeekabooBridge لأتمتة واجهة المستخدم في macOS
title: جسر بيكابو
x-i18n:
    generated_at: "2026-04-30T08:11:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92effdd6cfe4002fff2b8cd1092999f837e93694acf110eaebd30648b0a6946e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

يمكن لـ OpenClaw استضافة **PeekabooBridge** بصفته وسيط أتمتة واجهة مستخدم محليا ومدركا للأذونات. يتيح هذا لـ CLI `peekaboo` قيادة أتمتة واجهة المستخدم مع إعادة استخدام أذونات TCC الخاصة بتطبيق macOS.

## ما هذا (وما ليس كذلك)

- **المضيف**: يمكن لـ OpenClaw.app أن يعمل كمضيف PeekabooBridge.
- **العميل**: استخدم CLI `peekaboo` (من دون واجهة `openclaw ui ...` منفصلة).
- **واجهة المستخدم**: تبقى التراكبات المرئية في Peekaboo.app؛ أما OpenClaw فهو مضيف وسيط خفيف.

## العلاقة مع استخدام الحاسوب

لدى OpenClaw ثلاثة مسارات للتحكم بسطح المكتب، وتبقى منفصلة عمدا:

- **مضيف PeekabooBridge**: يمكن لـ OpenClaw.app استضافة مقبس PeekabooBridge المحلي.
  يبقى CLI `peekaboo` هو العميل ويستخدم أذونات macOS الخاصة بـ OpenClaw.app لبدائيات أتمتة Peekaboo مثل لقطات الشاشة، والنقرات، والقوائم، ومربعات الحوار، وإجراءات Dock، وإدارة النوافذ.
- **Codex Computer Use**: يجهز Plugin `codex` المضمن خادم تطبيق Codex، ويتحقق من توفر خادم MCP `computer-use` الخاص بـ Codex، ثم يتيح لـ Codex امتلاك استدعاءات أدوات التحكم الأصلي بسطح المكتب أثناء أدوار وضع Codex. لا يمرر OpenClaw تلك الإجراءات عبر PeekabooBridge.
- **MCP `cua-driver` المباشر**: يمكن لـ OpenClaw تسجيل خادم `cua-driver mcp` العلوي من TryCua كخادم MCP عادي. يمنح ذلك الوكلاء مخططات برنامج تشغيل CUA نفسه وسير عمل pid/window/element-index من دون التوجيه عبر سوق Codex أو مقبس PeekabooBridge.

استخدم Peekaboo عندما تريد سطح أتمتة macOS الواسع ومضيف الجسر المدرك للأذونات في OpenClaw.app. استخدم Codex Computer Use عندما ينبغي لوكيل يعمل في وضع Codex الاعتماد على Plugin استخدام الحاسوب الأصلي الخاص بـ Codex. استخدم `cua-driver mcp` المباشر عندما تريد كشف برنامج تشغيل CUA لأي بيئة تشغيل يديرها OpenClaw كخادم MCP عادي.

## تفعيل الجسر

في تطبيق macOS:

- Settings → **تفعيل جسر Peekaboo**

عند التفعيل، يبدأ OpenClaw خادم مقبس UNIX محليا. إذا تم تعطيله، يتم إيقاف المضيف وسيتراجع `peekaboo` إلى المضيفين الآخرين المتاحين.

## ترتيب اكتشاف العميل

تحاول عملاء Peekaboo عادة المضيفين بهذا الترتيب:

1. Peekaboo.app (تجربة مستخدم كاملة)
2. Claude.app (إذا كان مثبتا)
3. OpenClaw.app (وسيط خفيف)

استخدم `peekaboo bridge status --verbose` لمعرفة المضيف النشط ومسار المقبس المستخدم. يمكنك التجاوز باستخدام:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## الأمان والأذونات

- يتحقق الجسر من **تواقيع كود المستدعي**؛ يتم فرض قائمة سماح من TeamIDs (TeamID لمضيف Peekaboo + TeamID لتطبيق OpenClaw).
- تنتهي مهلة الطلبات بعد نحو 10 ثوان.
- إذا كانت الأذونات المطلوبة مفقودة، يعيد الجسر رسالة خطأ واضحة بدلا من فتح إعدادات النظام.

## سلوك اللقطات (الأتمتة)

تخزن اللقطات في الذاكرة وتنتهي صلاحيتها تلقائيا بعد نافذة زمنية قصيرة. إذا احتجت إلى احتفاظ أطول، فأعد الالتقاط من العميل.

## استكشاف الأخطاء وإصلاحها

- إذا أبلغ `peekaboo` أن “bridge client is not authorized”، فتأكد من أن العميل موقّع بشكل صحيح أو شغّل المضيف باستخدام `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` في وضع **التصحيح** فقط.
- إذا لم يتم العثور على أي مضيفين، فافتح أحد تطبيقات المضيف (Peekaboo.app أو OpenClaw.app) وتأكد من منح الأذونات.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [أذونات macOS](/ar/platforms/mac/permissions)
