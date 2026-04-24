---
read_when:
    - تصميم مساعد onboarding لتطبيق macOS
    - تنفيذ إعدادات المصادقة أو الهوية
sidebarTitle: 'Onboarding: macOS App'
summary: تدفق الإعداد عند أول تشغيل لـ OpenClaw ‏(تطبيق macOS)
title: Onboarding ‏(تطبيق macOS)
x-i18n:
    generated_at: "2026-04-24T08:05:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa516f8f5b4c7318f27a5af4e7ac12f5685aef6f84579a68496c2497d6f9041d
    source_path: start/onboarding.md
    workflow: 15
---

تصف هذه الوثيقة تدفق الإعداد عند **أول تشغيل** حاليًا. الهدف هو
تجربة "اليوم صفر" سلسة: اختر أين يعمل Gateway، وصِل المصادقة، وشغّل المعالج،
ودع الوكيل يهيّئ نفسه.

للحصول على نظرة عامة عامة على مسارات onboarding، راجع [نظرة عامة على onboarding](/ar/start/onboarding-overview).

<Steps>
<Step title="وافق على تحذير macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="وافق على العثور على الشبكات المحلية">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="الترحيب وإشعار الأمان">
<Frame caption="اقرأ إشعار الأمان المعروض واتخذ قرارك وفقًا لذلك">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

نموذج الثقة الأمني:

- افتراضيًا، يكون OpenClaw وكيلًا شخصيًا: حدّ مشغّل موثوق واحد.
- تتطلب الإعدادات المشتركة/متعددة المستخدمين تقييدًا محكمًا (فصل حدود الثقة، والإبقاء على وصول الأدوات في حدّه الأدنى، واتباع [الأمان](/ar/gateway/security)).
- يستخدم onboarding المحلي الآن افتراضيًا `tools.profile: "coding"` في الإعدادات الجديدة بحيث تحتفظ الإعدادات المحلية الجديدة بأدوات نظام الملفات/وقت التشغيل من دون فرض الملف الشخصي غير المقيّد `full`.
- إذا كانت hooks/webhooks أو تغذيات محتوى غير موثوقة أخرى مفعلة، فاستخدم طبقة نموذج قوية وحديثة وحافظ على سياسة أدوات صارمة/‏sandboxing.

</Step>
<Step title="محلي أم بعيد">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

أين يعمل **Gateway**؟

- **هذا الـ Mac ‏(محلي فقط):** يمكن لـ onboarding ضبط المصادقة وكتابة بيانات الاعتماد
  محليًا.
- **بعيد ‏(عبر SSH/Tailnet):** لا يضبط onboarding **المصادقة المحلية**؛
  بل يجب أن تكون بيانات الاعتماد موجودة على مضيف gateway.
- **الضبط لاحقًا:** تخطَّ الإعداد واترك التطبيق غير مهيأ.

<Tip>
**نصيحة حول مصادقة Gateway:**

- ينشئ المعالج الآن **رمزًا** حتى في وضع loopback، لذا يجب على عملاء WS المحليين إجراء المصادقة.
- إذا عطّلت المصادقة، فبإمكان أي عملية محلية الاتصال؛ استخدم ذلك فقط على الأجهزة الموثوقة بالكامل.
- استخدم **رمزًا** للوصول عبر عدة أجهزة أو للربط غير المعتمد على loopback.

</Tip>
</Step>
<Step title="الأذونات">
<Frame caption="اختر الأذونات التي تريد منحها لـ OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

يطلب onboarding أذونات TCC اللازمة من أجل:

- Automation ‏(AppleScript)
- Notifications
- Accessibility
- Screen Recording
- Microphone
- Speech Recognition
- Camera
- Location

</Step>
<Step title="CLI">
  <Info>هذه الخطوة اختيارية</Info>
  يمكن للتطبيق تثبيت CLI العامة `openclaw` عبر npm أو pnpm أو bun.
  وهو يفضّل npm أولًا، ثم pnpm، ثم bun إذا كان ذلك هو مدير الحزم
  الوحيد المكتشف. أما بالنسبة إلى وقت تشغيل Gateway، فيظل Node هو المسار الموصى به.
</Step>
<Step title="Onboarding Chat ‏(جلسة مخصصة)">
  بعد الإعداد، يفتح التطبيق جلسة دردشة onboarding مخصصة حتى يتمكن الوكيل من
  تقديم نفسه وإرشادك إلى الخطوات التالية. وهذا يبقي إرشادات أول تشغيل
  منفصلة عن محادثتك العادية. راجع [Bootstrapping](/ar/start/bootstrapping) لمعرفة
  ما الذي يحدث على مضيف gateway أثناء أول تشغيل للوكيل.
</Step>
</Steps>

## ذو صلة

- [نظرة عامة على onboarding](/ar/start/onboarding-overview)
- [البدء](/ar/start/getting-started)
