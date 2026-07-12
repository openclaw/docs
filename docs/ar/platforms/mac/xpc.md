---
read_when:
    - تحرير عقود IPC أو IPC لتطبيق شريط القوائم
summary: بنية IPC في macOS لتطبيق OpenClaw، ونقل عقدة Gateway، وPeekabooBridge
title: IPC في macOS
x-i18n:
    generated_at: "2026-07-12T06:11:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 39e11af2bb9348d1c1f6e4fe6be95e825d23d5c1aa66e32dae713a89afb12b4f
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# بنية IPC في macOS لدى OpenClaw

يربط مقبس Unix محلي خدمة مضيف Node بتطبيق macOS للحصول على موافقات التنفيذ وتشغيل `system.run`. تتوفر CLI لتصحيح الأخطاء باسم `openclaw-mac` ‏(`apps/macos/Sources/OpenClawMacCLI`) لإجراء عمليات التحقق من الاكتشاف والاتصال؛ ومع ذلك، تظل إجراءات الوكيل تتدفق عبر WebSocket الخاص بـ Gateway و`node.invoke`. يشغّل مسار `computer.act` المدعوم بـ Node أتمتة Peekaboo المضمّنة داخل العملية؛ بينما تستخدم عملاء Peekaboo المستقلة PeekabooBridge.

## الأهداف

- مثيل واحد لتطبيق واجهة المستخدم الرسومية يتولى جميع الأعمال التي تتعامل مع TCC (الإشعارات وتسجيل الشاشة والميكروفون والكلام وAppleScript).
- واجهة محدودة للأتمتة: Gateway وأوامر Node، و`computer.act` داخل العملية، بالإضافة إلى PeekabooBridge لعملاء أتمتة واجهة المستخدم المستقلين.
- أذونات متوقعة: استخدام معرّف حزمة موقّع واحد دائمًا، وتشغيله بواسطة launchd، لكي تظل منح أذونات TCC سارية.

## آلية العمل

### نقل Gateway وNode

- يشغّل التطبيق Gateway (في الوضع المحلي) ويتصل به بصفته Node.
- تُنفَّذ إجراءات الوكيل عبر `node.invoke` (مثل `system.run` و`system.notify` و`canvas.*`).
- تتضمن أوامر Node: ‏`canvas.*` و`camera.snap` و`camera.clip` و`screen.snapshot` و`screen.record` و`computer.act` و`system.run` و`system.notify`.
- يبلّغ Node عن خريطة `permissions` لكي تتمكن الوكلاء من معرفة مدى توفر الوصول إلى الشاشة أو الكاميرا أو الميكروفون أو الكلام أو الأتمتة أو تسهيلات الاستخدام.

### خدمة Node وIPC مع التطبيق

- تتصل خدمة مضيف Node بلا واجهة رسومية بـ WebSocket الخاص بـ Gateway.
- تُمرَّر طلبات `system.run` إلى تطبيق macOS عبر مقبس Unix محلي (`ExecApprovalsSocket.swift`).
- ينفّذ التطبيق الأمر في سياق واجهة المستخدم، ويعرض مطالبة عند الحاجة، ثم يعيد المخرجات.

المخطط (SCI):

```text
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (أتمتة واجهة المستخدم)

- **لا** تستخدم أداة `computer` المضمّنة للوكيل هذا المقبس. تنفّذ Node مقترنة بنظام macOS الإجراء `computer.act` داخل عملية التطبيق باستخدام خدمات Peekaboo المضمّنة.
- تستخدم أتمتة واجهة المستخدم مقبس UNIX منفصلًا (`~/Library/Application Support/OpenClaw/<socket>`) وبروتوكول JSON الخاص بـ PeekabooBridge.
- ترتيب تفضيل المضيف (من جانب العميل): Peekaboo.app ثم Claude.app ثم OpenClaw.app ثم التنفيذ المحلي.
- الأمان: تتطلب مضيفات الجسر TeamID مدرجًا في قائمة السماح (يدرج `PeekabooBridgeHostCoordinator` المضمّن فريقًا ثابتًا بالإضافة إلى فريق توقيع التطبيق نفسه في قائمة السماح)؛ وتوجد آلية تجاوز لمعرّف المستخدم نفسه خاصة بوضع DEBUG فقط، ويتحكم فيها `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (وفق اصطلاح Peekaboo).
- راجع: [استخدام PeekabooBridge](/ar/platforms/mac/peekaboo) للاطلاع على التفاصيل.

## تدفقات التشغيل

- إعادة التشغيل/إعادة البناء: ينهي `scripts/restart-mac.sh` المثيلات الموجودة، ويعيد البناء باستخدام Swift، ويعيد التحزيم، ثم يعيد التشغيل. يكتشف تلقائيًا هوية توقيع متاحة، ويرجع إلى `--no-sign` إذا لم يعثر على أي هوية؛ مرّر `--sign` لفرض التوقيع (يفشل إذا لم يتوفر مفتاح) أو `--no-sign` لفرض المسار غير الموقّع. يُلغى تعيين `SIGN_IDENTITY` في البيئة ضمن المسار الموقّع، لكي يختار الاكتشاف التلقائي للهوية في `scripts/codesign-mac-app.sh` الشهادة.
- مثيل واحد: يفحص التطبيق `NSWorkspace.runningApplications` بحثًا عن معرّف حزمة مكرر، ويخرج إذا عثر على أكثر من مثيل واحد (`isDuplicateInstance()` في `MenuBar.swift`).

## ملاحظات التحصين

- يُفضّل اشتراط تطابق TeamID لجميع الواجهات ذات الامتيازات.
- PeekabooBridge: قد يسمح `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (في وضع DEBUG فقط) للجهات المستدعية التي تحمل معرّف المستخدم نفسه لأغراض التطوير المحلي.
- تظل جميع الاتصالات محلية فقط؛ ولا تُكشف أي مقابس شبكة.
- تنشأ مطالبات TCC من حزمة تطبيق واجهة المستخدم الرسومية فقط؛ حافظ على استقرار معرّف الحزمة الموقّع عبر عمليات إعادة البناء.
- تحصين مقبس موافقات التنفيذ: وضع الملف `0600`، ورمز مميز مشترك، وفحص معرّف المستخدم للنظير (`getpeereid`)، وآلية تحدٍّ/استجابة باستخدام HMAC-SHA256، ومدة صلاحية قصيرة للطلبات.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [تدفق IPC في macOS (موافقات التنفيذ)](/ar/tools/exec-approvals-advanced#macos-ipc-flow)
