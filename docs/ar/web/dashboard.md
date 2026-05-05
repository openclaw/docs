---
read_when:
    - تغيير أوضاع مصادقة لوحة التحكم أو إتاحتها
summary: الوصول إلى لوحة معلومات Gateway (واجهة التحكم) والمصادقة
title: لوحة المعلومات
x-i18n:
    generated_at: "2026-05-05T01:52:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e2086587fee6303221663748c3047886a5beae29862d66e2edf78e02bfe3da1
    source_path: web/dashboard.md
    workflow: 16
---

لوحة معلومات Gateway هي واجهة التحكم في المتصفح التي تُقدَّم على `/` افتراضيًا
(يمكن تجاوزها باستخدام `gateway.controlUi.basePath`).

فتح سريع (Gateway محلي):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (أو [http://localhost:18789/](http://localhost:18789/))
- مع `gateway.tls.enabled: true`، استخدم `https://127.0.0.1:18789/` و
  `wss://127.0.0.1:18789` لنقطة نهاية WebSocket.

مراجع أساسية:

- [واجهة التحكم](/ar/web/control-ui) للاستخدام وإمكانات واجهة المستخدم.
- [Tailscale](/ar/gateway/tailscale) لأتمتة Serve/Funnel.
- [أسطح الويب](/ar/web) لأوضاع الربط وملاحظات الأمان.

يُفرض التوثيق عند مصافحة WebSocket عبر مسار توثيق Gateway
المكوَّن:

- `connect.params.auth.token`
- `connect.params.auth.password`
- ترويسات هوية Tailscale Serve عندما يكون `gateway.auth.allowTailscale: true`
- ترويسات هوية الوكيل الموثوق عندما يكون `gateway.auth.mode: "trusted-proxy"`

راجع `gateway.auth` في [إعدادات Gateway](/ar/gateway/configuration).

ملاحظة أمان: واجهة التحكم هي **سطح إداري** (الدردشة، الإعدادات، موافقات التنفيذ).
لا تعرضها للعامة. تحتفظ واجهة المستخدم برموز URL الخاصة بلوحة المعلومات في sessionStorage
لجلسة تبويب المتصفح الحالية وURL المحدد لـ Gateway، وتزيلها من URL بعد التحميل.
فضّل localhost أو Tailscale Serve أو نفق SSH.

## المسار السريع (موصى به)

- بعد الإعداد الأولي، يفتح CLI لوحة المعلومات تلقائيًا ويطبع رابطًا نظيفًا (من دون رمز).
- أعد الفتح في أي وقت: `openclaw dashboard` (ينسخ الرابط، ويفتح المتصفح إن أمكن، ويعرض تلميح SSH إذا كانت البيئة بلا واجهة).
- إذا فشل التسليم عبر الحافظة والمتصفح، يظل `openclaw dashboard` يطبع
  URL النظيف ويخبرك باستخدام الرمز من `OPENCLAW_GATEWAY_TOKEN` أو
  `gateway.auth.token` كمفتاح جزء URL باسم `token`؛ ولا يطبع قيم الرموز
  في السجلات.
- إذا طلبت واجهة المستخدم توثيق السر المشترك، الصق الرمز أو
  كلمة المرور المكوَّنة في إعدادات واجهة التحكم.

## أساسيات التوثيق (محليًا مقابل عن بُعد)

- **Localhost**: افتح `http://127.0.0.1:18789/`.
- **TLS لـ Gateway**: عندما يكون `gateway.tls.enabled: true`، تستخدم روابط لوحة المعلومات/الحالة
  `https://` وتستخدم روابط WebSocket في واجهة التحكم `wss://`.
- **مصدر رمز السر المشترك**: `gateway.auth.token` (أو
  `OPENCLAW_GATEWAY_TOKEN`)؛ يمكن لـ `openclaw dashboard` تمريره عبر جزء URL
  للتهيئة الأولية لمرة واحدة، وتحتفظ به واجهة التحكم في sessionStorage
  لجلسة تبويب المتصفح الحالية وURL المحدد لـ Gateway بدلًا من localStorage.
- إذا كان `gateway.auth.token` مُدارًا بواسطة SecretRef، فإن `openclaw dashboard`
  يطبع/ينسخ/يفتح URL غير مرمَّز حسب التصميم. يتجنب هذا كشف
  الرموز المُدارة خارجيًا في سجلات shell أو سجل الحافظة أو وسيطات
  تشغيل المتصفح.
- إذا كان `gateway.auth.token` مكوَّنًا كـ SecretRef ولم يُحل في
  shell الحالي لديك، يظل `openclaw dashboard` يطبع URL غير مرمَّزًا مع
  إرشادات قابلة للتنفيذ لإعداد التوثيق.
- **كلمة مرور السر المشترك**: استخدم `gateway.auth.password` المكوَّنة (أو
  `OPENCLAW_GATEWAY_PASSWORD`). لا تحتفظ لوحة المعلومات بكلمات المرور عبر
  عمليات إعادة التحميل.
- **الأوضاع الحاملة للهوية**: يمكن لـ Tailscale Serve تلبية توثيق واجهة التحكم/WebSocket
  عبر ترويسات الهوية عندما يكون `gateway.auth.allowTailscale: true`، ويمكن
  لوكيل عكسي مدرك للهوية وغير loopback تلبية
  `gateway.auth.mode: "trusted-proxy"`. في تلك الأوضاع لا تحتاج لوحة المعلومات
  إلى لصق سر مشترك لـ WebSocket.
- **ليس localhost**: استخدم Tailscale Serve، أو ربطًا غير loopback بسر مشترك، أو
  وكيلًا عكسيًا مدركًا للهوية وغير loopback مع
  `gateway.auth.mode: "trusted-proxy"`، أو نفق SSH. تظل واجهات HTTP API تستخدم
  توثيق السر المشترك ما لم تشغّل عمدًا
  `gateway.auth.mode: "none"` للدخول الخاص أو توثيق HTTP عبر الوكيل الموثوق. راجع
  [أسطح الويب](/ar/web).

<a id="if-you-see-unauthorized-1008"></a>

## إذا رأيت "unauthorized" / 1008

- تأكد من إمكانية الوصول إلى Gateway (محليًا: `openclaw status`؛ عن بُعد: نفق SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`).
- بالنسبة إلى `AUTH_TOKEN_MISMATCH`، يمكن للعملاء إجراء إعادة محاولة موثوقة واحدة باستخدام رمز جهاز مخزّن مؤقتًا عندما يعيد Gateway تلميحات إعادة المحاولة. تعيد إعادة المحاولة بالرمز المخزّن مؤقتًا استخدام نطاقات الرمز المعتمدة المخزّنة مؤقتًا؛ أما المستدعون الذين يحددون `deviceToken` صراحةً / `scopes` صراحةً فيحتفظون بمجموعة النطاقات المطلوبة لديهم. إذا ظل التوثيق يفشل بعد تلك الإعادة، فأصلح انجراف الرمز يدويًا.
- خارج مسار إعادة المحاولة ذلك، تكون أولوية توثيق الاتصال هي الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزّن، ثم رمز التهيئة الأولية.
- في مسار واجهة تحكم Tailscale Serve غير المتزامن، تُسلسل المحاولات الفاشلة لنفس
  `{scope, ip}` قبل أن يسجلها محدِّد محاولات التوثيق الفاشلة، لذلك
  يمكن أن تعرض إعادة المحاولة السيئة المتزامنة الثانية `retry later` بالفعل.
- لخطوات إصلاح انجراف الرمز، اتبع [قائمة التحقق من استرداد انجراف الرمز](/ar/cli/devices#token-drift-recovery-checklist).
- استرجع السر المشترك أو زوّده من مضيف Gateway:
  - الرمز: `openclaw config get gateway.auth.token`
  - كلمة المرور: حلّ `gateway.auth.password` المكوَّنة أو
    `OPENCLAW_GATEWAY_PASSWORD`
  - رمز مُدار بواسطة SecretRef: حلّ مزود السر الخارجي أو صدّر
    `OPENCLAW_GATEWAY_TOKEN` في هذا shell، ثم أعد تشغيل `openclaw dashboard`
  - لا يوجد سر مشترك مكوَّن: `openclaw doctor --generate-gateway-token`
- في إعدادات لوحة المعلومات، الصق الرمز أو كلمة المرور في حقل التوثيق،
  ثم اتصل.
- منتقي لغة واجهة المستخدم موجود في **نظرة عامة -> وصول Gateway -> اللغة**.
  إنه جزء من بطاقة الوصول، وليس قسم المظهر.

## ذو صلة

- [واجهة التحكم](/ar/web/control-ui)
- [WebChat](/ar/web/webchat)
