---
read_when:
    - استضافة PeekabooBridge داخل OpenClaw.app
    - دمج Peekaboo عبر Swift Package Manager
    - "تغيير بروتوكول/مسارات PeekabooBridge\tRTLUanalysis to=functions.read  天天中彩票不中返commentary 开号网址json  content: {\"path\":\"docs/help/peekaboo-bridge.md\"}"
summary: تكامل PeekabooBridge لأتمتة واجهة المستخدم على macOS
title: جسر Peekaboo
x-i18n:
    generated_at: "2026-04-24T07:52:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3646f66551645733292fb183e0ff2c56697e7b24248ff7c32a0dc925431f6ba7
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

يمكن لـ OpenClaw استضافة **PeekabooBridge** كوسيط محلي واعٍ بالأذونات لأتمتة واجهة المستخدم.
وهذا يتيح لأداة CLI ‏`peekaboo` تشغيل أتمتة واجهة المستخدم مع إعادة استخدام
أذونات TCC الخاصة بتطبيق macOS.

## ما هذا (وما ليس عليه)

- **المضيف**: يمكن لـ OpenClaw.app أن يعمل كمضيف PeekabooBridge.
- **العميل**: استخدم CLI ‏`peekaboo` ‏(ولا يوجد سطح منفصل من نوع `openclaw ui ...`).
- **واجهة المستخدم**: تظل الطبقات المرئية في Peekaboo.app؛ أما OpenClaw فهو مضيف وسيط خفيف.

## تمكين الجسر

في تطبيق macOS:

- Settings → **تمكين Peekaboo Bridge**

عند التمكين، يبدأ OpenClaw خادم UNIX socket محليًا. وإذا تم تعطيله، يتم
إيقاف المضيف وسيتراجع `peekaboo` إلى أي مضيفين آخرين متاحين.

## ترتيب اكتشاف العميل

تحاول عملاء Peekaboo عادةً المضيفين بهذا الترتيب:

1. Peekaboo.app ‏(تجربة كاملة)
2. Claude.app ‏(إذا كان مثبتًا)
3. OpenClaw.app ‏(وسيط خفيف)

استخدم `peekaboo bridge status --verbose` لمعرفة أي مضيف نشط وأي
مسار socket قيد الاستخدام. ويمكنك التجاوز عبر:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## الأمان والأذونات

- يتحقق الجسر من **توقيعات كود المستدعي**؛ ويتم فرض allowlist خاصة بـ TeamIDs ‏(TeamID الخاصة بمضيف Peekaboo + TeamID الخاصة بتطبيق OpenClaw).
- تنتهي مهلة الطلبات بعد نحو 10 ثوانٍ.
- إذا كانت الأذونات المطلوبة مفقودة، يعيد الجسر رسالة خطأ واضحة
  بدلًا من تشغيل System Settings.

## سلوك اللقطات (الأتمتة)

تُخزَّن اللقطات في الذاكرة وتنتهي صلاحيتها تلقائيًا بعد نافذة قصيرة.
وإذا كنت تحتاج إلى احتفاظ أطول، فأعد الالتقاط من العميل.

## استكشاف الأخطاء وإصلاحها

- إذا أبلغ `peekaboo` عن “bridge client is not authorized”، فتأكد من أن العميل
  موقّع بشكل صحيح أو شغّل المضيف مع `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  في وضع **debug** فقط.
- إذا لم يتم العثور على أي مضيفين، فافتح أحد تطبيقات المضيف (Peekaboo.app أو OpenClaw.app)
  وتأكد من منح الأذونات.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [أذونات macOS](/ar/platforms/mac/permissions)
