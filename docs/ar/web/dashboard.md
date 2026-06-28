---
read_when:
    - تغيير مصادقة لوحة التحكم أو أوضاع إتاحتها
summary: الوصول والمصادقة للوحة معلومات Gateway (واجهة التحكم)
title: لوحة التحكم
x-i18n:
    generated_at: "2026-05-11T20:44:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07e11c1f71e6691ee053192e238a3b48568f81c3180e6b5f8e21b6874417e57e
    source_path: web/dashboard.md
    workflow: 16
    postprocess_version: locale-links-v1
---

لوحة معلومات Gateway هي واجهة التحكم في المتصفح التي تُقدَّم افتراضيًا على `/`
(يمكن تجاوز ذلك باستخدام `gateway.controlUi.basePath`).

فتح سريع (Gateway المحلي):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (أو [http://localhost:18789/](http://localhost:18789/))
- مع `gateway.tls.enabled: true`، استخدم `https://127.0.0.1:18789/` و
  `wss://127.0.0.1:18789` لنقطة نهاية WebSocket.

مراجع رئيسية:

- [واجهة التحكم](/ar/web/control-ui) للاستخدام وإمكانات الواجهة.
- [Tailscale](/ar/gateway/tailscale) لأتمتة Serve/Funnel.
- [أسطح الويب](/ar/web) لأوضاع الربط وملاحظات الأمان.

يُفرض التحقق من الهوية عند مصافحة WebSocket عبر مسار مصادقة Gateway
المكوَّن:

- `connect.params.auth.token`
- `connect.params.auth.password`
- ترويسات هوية Tailscale Serve عند `gateway.auth.allowTailscale: true`
- ترويسات هوية الوكيل الموثوق عند `gateway.auth.mode: "trusted-proxy"`

راجع `gateway.auth` في [تكوين Gateway](/ar/gateway/configuration).

ملاحظة أمان: واجهة التحكم هي **سطح إدارة** (دردشة، تكوين، موافقات التنفيذ).
لا تعرضها للعامة. تحتفظ الواجهة برموز URL للوحة المعلومات في sessionStorage
لجلسة تبويب المتصفح الحالية وعنوان Gateway المحدد، وتزيلها من URL بعد التحميل.
فضّل localhost أو Tailscale Serve أو نفق SSH.

## المسار السريع (موصى به)

- بعد الإعداد الأولي، يفتح CLI لوحة المعلومات تلقائيًا ويطبع رابطًا نظيفًا (بلا رمز).
- أعد الفتح في أي وقت: `openclaw dashboard` (ينسخ الرابط، ويفتح المتصفح إن أمكن، ويعرض تلميح SSH إذا كان بلا واجهة).
- إذا فشل التسليم عبر الحافظة والمتصفح، يظل `openclaw dashboard` يطبع
  URL النظيف ويخبرك باستخدام الرمز من `OPENCLAW_GATEWAY_TOKEN` أو
  `gateway.auth.token` كمفتاح جزء URL باسم `token`؛ ولا يطبع قيم الرموز
  في السجلات.
- إذا طالبتك الواجهة بمصادقة السر المشترك، فالصق الرمز أو كلمة المرور المكوَّنة
  في إعدادات واجهة التحكم.

## أساسيات المصادقة (محلي مقابل بعيد)

- **Localhost**: افتح `http://127.0.0.1:18789/`.
- **TLS لـ Gateway**: عند `gateway.tls.enabled: true`، تستخدم روابط لوحة المعلومات/الحالة
  `https://` وتستخدم روابط WebSocket في واجهة التحكم `wss://`.
- **مصدر رمز السر المشترك**: `gateway.auth.token` (أو
  `OPENCLAW_GATEWAY_TOKEN`)؛ يمكن لـ `openclaw dashboard` تمريره عبر جزء URL
  للإقلاع الأولي لمرة واحدة، وتحتفظ به واجهة التحكم في sessionStorage لجلسة
  تبويب المتصفح الحالية وعنوان Gateway المحدد بدلًا من localStorage.
- إذا كان `gateway.auth.token` مُدارًا بواسطة SecretRef، فإن `openclaw dashboard`
  يطبع/ينسخ/يفتح URL بلا رمز حسب التصميم. يتجنب ذلك كشف الرموز المُدارة
  خارجيًا في سجلات الطرفية أو سجل الحافظة أو وسائط تشغيل المتصفح.
- إذا كان `gateway.auth.token` مكوَّنًا كـ SecretRef وغير محلول في الصدفة
  الحالية لديك، يظل `openclaw dashboard` يطبع URL بلا رمز مع إرشادات قابلة
  للتنفيذ لإعداد المصادقة.
- **كلمة مرور السر المشترك**: استخدم `gateway.auth.password` المكوَّنة (أو
  `OPENCLAW_GATEWAY_PASSWORD`). لا تحتفظ لوحة المعلومات بكلمات المرور عبر
  عمليات إعادة التحميل.
- **الأوضاع الحاملة للهوية**: يمكن لـ Tailscale Serve تلبية مصادقة واجهة التحكم/WebSocket
  عبر ترويسات الهوية عند `gateway.auth.allowTailscale: true`، ويمكن لوكيل
  عكسي غير loopback ومدرك للهوية تلبية
  `gateway.auth.mode: "trusted-proxy"`. في هذه الأوضاع لا تحتاج لوحة المعلومات
  إلى لصق سر مشترك من أجل WebSocket.
- **ليس localhost**: استخدم Tailscale Serve، أو ربط سر مشترك غير loopback، أو
  وكيلًا عكسيًا غير loopback ومدركًا للهوية مع
  `gateway.auth.mode: "trusted-proxy"`، أو نفق SSH. تظل واجهات HTTP البرمجية تستخدم
  مصادقة السر المشترك ما لم تُشغّل عمدًا
  `gateway.auth.mode: "none"` للدخول الخاص أو مصادقة HTTP عبر الوكيل الموثوق. راجع
  [أسطح الويب](/ar/web).

<a id="if-you-see-unauthorized-1008"></a>

## إذا رأيت "unauthorized" / 1008

- تأكد من إمكانية الوصول إلى Gateway (محليًا: `openclaw status`؛ وعن بُعد: نفق SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`).
- بالنسبة إلى `AUTH_TOKEN_MISMATCH`، قد تجري العملاء إعادة محاولة موثوقة واحدة باستخدام رمز جهاز مخبأ عندما يعيد Gateway تلميحات إعادة المحاولة. تعيد إعادة المحاولة بالرمز المخبأ استخدام النطاقات المعتمدة المخبأة لذلك الرمز؛ أما المستدعون الذين يمررون `deviceToken` صريحًا / `scopes` صريحة فيحتفظون بمجموعة النطاقات المطلوبة لديهم. إذا استمرت المصادقة في الفشل بعد إعادة المحاولة تلك، فحلّ انحراف الرمز يدويًا.
- بالنسبة إلى `AUTH_SCOPE_MISMATCH`، تم التعرف على رمز الجهاز لكنه لا يحمل النطاقات التي تطلبها لوحة المعلومات؛ أعد الإقران أو وافق على عقد النطاق المطلوب بدلًا من تدوير رمز Gateway المشترك.
- خارج مسار إعادة المحاولة ذلك، تكون أولوية مصادقة الاتصال هي الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز الإقلاع الأولي.
- في مسار واجهة تحكم Tailscale Serve غير المتزامن، تُسلسل المحاولات الفاشلة لنفس
  `{scope, ip}` قبل أن يسجلها محدد المصادقة الفاشلة، لذلك قد تُظهر إعادة المحاولة
  السيئة المتزامنة الثانية بالفعل `retry later`.
- لخطوات إصلاح انحراف الرمز، اتبع [قائمة تحقق استرداد انحراف الرمز](/ar/cli/devices#token-drift-recovery-checklist).
- استرجع السر المشترك أو قدّمه من مضيف Gateway:
  - الرمز: `openclaw config get gateway.auth.token`
  - كلمة المرور: حلّ `gateway.auth.password` المكوَّنة أو
    `OPENCLAW_GATEWAY_PASSWORD`
  - رمز مُدار بواسطة SecretRef: حلّ مزود الأسرار الخارجي أو صدّر
    `OPENCLAW_GATEWAY_TOKEN` في هذه الصدفة، ثم أعد تشغيل `openclaw dashboard`
  - لا يوجد سر مشترك مكوَّن: `openclaw doctor --generate-gateway-token`
- في إعدادات لوحة المعلومات، الصق الرمز أو كلمة المرور في حقل المصادقة،
  ثم اتصل.
- منتقي لغة الواجهة موجود في **نظرة عامة -> وصول Gateway -> اللغة**.
  وهو جزء من بطاقة الوصول، وليس قسم المظهر.

## ذات صلة

- [واجهة التحكم](/ar/web/control-ui)
- [WebChat](/ar/web/webchat)
