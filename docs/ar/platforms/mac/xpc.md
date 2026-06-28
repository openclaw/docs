---
read_when:
    - تعديل عقود IPC أو IPC لتطبيق شريط القوائم
summary: بنية IPC في macOS لتطبيق OpenClaw، ونقل عقدة Gateway، وPeekabooBridge
title: الاتصال بين العمليات في macOS
x-i18n:
    generated_at: "2026-06-28T00:13:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# بنية OpenClaw IPC على macOS

**النموذج الحالي:** يربط مقبس Unix محلي **خدمة مضيف Node** بـ **تطبيق macOS** لموافقات التنفيذ + `system.run`. توجد CLI تصحيح باسم `openclaw-mac` لفحوصات الاكتشاف/الاتصال؛ ولا تزال إجراءات الوكيل تمر عبر Gateway WebSocket و`node.invoke`. تستخدم أتمتة واجهة المستخدم PeekabooBridge.

## الأهداف

- مثيل تطبيق GUI واحد يملك كل الأعمال المتعاملة مع TCC (الإشعارات، تسجيل الشاشة، الميكروفون، الكلام، AppleScript).
- سطح صغير للأتمتة: Gateway + أوامر Node، إضافة إلى PeekabooBridge لأتمتة واجهة المستخدم.
- أذونات قابلة للتنبؤ: معرف الحزمة الموقّع نفسه دائمًا، ويُشغَّل بواسطة launchd، بحيث تبقى منح TCC ثابتة.

## كيف يعمل

### Gateway + نقل Node

- يشغّل التطبيق Gateway (الوضع المحلي) ويتصل به كـ Node.
- تُنفَّذ إجراءات الوكيل عبر `node.invoke` (مثل `system.run` و`system.notify` و`canvas.*`).
- تتضمن أوامر عقدة Mac الشائعة `canvas.*` و`camera.snap` و`camera.clip`،
  و`screen.snapshot` و`screen.record` و`system.run` و`system.notify`.
- تُبلّغ العقدة عن خريطة `permissions` حتى تتمكن الوكلاء من معرفة ما إذا كان الوصول إلى الشاشة،
  أو الكاميرا، أو الميكروفون، أو الكلام، أو الأتمتة، أو تسهيلات الاستخدام متاحًا.

### خدمة Node + IPC التطبيق

- تتصل خدمة مضيف Node بلا واجهة رسومية بـ Gateway WebSocket.
- تُمرَّر طلبات `system.run` إلى تطبيق macOS عبر مقبس Unix محلي.
- ينفّذ التطبيق الأمر في سياق واجهة المستخدم، ويطلب التأكيد عند الحاجة، ثم يعيد المخرجات.

مخطط (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (أتمتة واجهة المستخدم)

- تستخدم أتمتة واجهة المستخدم مقبس UNIX منفصلًا باسم `bridge.sock` وبروتوكول JSON الخاص بـ PeekabooBridge.
- ترتيب تفضيل المضيف (من جهة العميل): Peekaboo.app → Claude.app → OpenClaw.app → التنفيذ المحلي.
- الأمان: يتطلب مضيفو الجسر TeamID مسموحًا؛ ويُحمى مخرج الطوارئ الخاص بـ DEBUG فقط لنفس UID بواسطة `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (اصطلاح Peekaboo).
- راجع: [استخدام PeekabooBridge](/ar/platforms/mac/peekaboo) للتفاصيل.

## تدفقات التشغيل

- إعادة التشغيل/إعادة البناء: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - يقتل المثيلات الموجودة
  - بناء Swift + الحزمة
  - يكتب/يمهّد/يعيد تشغيل LaunchAgent
- مثيل واحد: يخرج التطبيق مبكرًا إذا كان هناك مثيل آخر يعمل بمعرف الحزمة نفسه.

## ملاحظات التقوية

- يُفضَّل اشتراط تطابق TeamID لكل الأسطح ذات الامتيازات.
- PeekabooBridge: قد يسمح `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (خاص بـ DEBUG فقط) للمتصلين ذوي UID نفسه أثناء التطوير المحلي.
- تظل كل الاتصالات محلية فقط؛ ولا تُعرَض أي مقابس شبكة.
- تنشأ مطالبات TCC فقط من حزمة تطبيق GUI؛ أبقِ معرف الحزمة الموقّع ثابتًا عبر عمليات إعادة البناء.
- تقوية IPC: وضع المقبس `0600`، الرمز، فحوصات UID للنظير، تحدي/استجابة HMAC، وTTL قصير.

## ذات صلة

- [تطبيق macOS](/ar/platforms/macos)
- [تدفق IPC على macOS (موافقات التنفيذ)](/ar/tools/exec-approvals-advanced#macos-ipc-flow)
