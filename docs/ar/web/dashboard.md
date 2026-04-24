---
read_when:
    - تغيير أوضاع مصادقة لوحة التحكم أو تعريضها للوصول
summary: الوصول إلى لوحة Gateway ‏(واجهة التحكم) والمصادقة الخاصة بها
title: لوحة التحكم
x-i18n:
    generated_at: "2026-04-24T08:12:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8753e0edf0a04e4c36b76aa6973dcd9d903a98c0b85e498bfcb05e728bb6272b
    source_path: web/dashboard.md
    workflow: 15
---

لوحة Gateway هي واجهة التحكم في المتصفح Control UI التي تُخدم عند `/` افتراضيًا
(يمكن التجاوز عبر `gateway.controlUi.basePath`).

فتح سريع (Gateway محلية):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (أو [http://localhost:18789/](http://localhost:18789/))

مراجع أساسية:

- [Control UI](/ar/web/control-ui) للاستخدام وقدرات الواجهة.
- [Tailscale](/ar/gateway/tailscale) لأتمتة Serve/Funnel.
- [أسطح الويب](/ar/web) لأوضاع الربط وملاحظات الأمان.

تُفرض المصادقة عند مصافحة WebSocket عبر مسار مصادقة gateway
المضبوط:

- `connect.params.auth.token`
- `connect.params.auth.password`
- رؤوس هوية Tailscale Serve عندما تكون `gateway.auth.allowTailscale: true`
- رؤوس هوية trusted-proxy عندما تكون `gateway.auth.mode: "trusted-proxy"`

راجع `gateway.auth` في [إعداد Gateway](/ar/gateway/configuration).

ملاحظة أمان: واجهة Control UI هي **سطح إداري** (محادثة، إعدادات، موافقات exec).
لا تعرّضها للعامة. تحتفظ الواجهة برموز URL الخاصة بلوحة التحكم في `sessionStorage`
لجلسة علامة تبويب المتصفح الحالية وعنوان gateway المحدد، وتزيلها من عنوان URL بعد التحميل.
فضّل localhost أو Tailscale Serve أو نفق SSH.

## المسار السريع (مستحسن)

- بعد الإعداد الأولي، تفتح CLI لوحة التحكم تلقائيًا وتطبع رابطًا نظيفًا (من دون رموز).
- لإعادة الفتح في أي وقت: `openclaw dashboard` ‏(ينسخ الرابط، ويفتح المتصفح إن أمكن، ويعرض تلميح SSH إذا كان الوضع headless).
- إذا طلبت الواجهة مصادقة السر المشترك، فالصق الرمز أو
  كلمة المرور المضبوطة في إعدادات Control UI.

## أساسيات المصادقة (محلي مقابل بعيد)

- **Localhost**: افتح `http://127.0.0.1:18789/`.
- **مصدر رمز السر المشترك**: `gateway.auth.token` (أو
  `OPENCLAW_GATEWAY_TOKEN`)؛ يمكن لـ `openclaw dashboard` تمريره عبر جزء URL
  من أجل bootstrap لمرة واحدة، وتحتفظ به Control UI في `sessionStorage` من أجل
  جلسة علامة تبويب المتصفح الحالية وعنوان gateway المحدد بدلًا من `localStorage`.
- إذا كانت `gateway.auth.token` مُدارة عبر SecretRef، فإن `openclaw dashboard`
  يطبع/ينسخ/يفتح عنوان URL غير مضمّن فيه رمز بحكم التصميم. وهذا يتجنب كشف
  الرموز المُدارة خارجيًا في سجلات shell أو سجل الحافظة أو وسائط تشغيل المتصفح.
- إذا كانت `gateway.auth.token` مضبوطة كـ SecretRef ولم يتم حلها في
  shell الحالية، فإن `openclaw dashboard` ما تزال تطبع عنوان URL غير مضمّن فيه رمز
  بالإضافة إلى إرشادات قابلة للتنفيذ لإعداد المصادقة.
- **كلمة مرور السر المشترك**: استخدم `gateway.auth.password` المضبوطة (أو
  `OPENCLAW_GATEWAY_PASSWORD`). لا تحفظ لوحة التحكم كلمات المرور عبر
  إعادة التحميل.
- **الأوضاع المعتمدة على الهوية**: يمكن لـ Tailscale Serve تلبية مصادقة Control UI/WebSocket
  عبر رؤوس الهوية عندما تكون `gateway.auth.allowTailscale: true`، ويمكن لوكيل عكسي
  غير loopback ومدرك للهوية تلبية
  `gateway.auth.mode: "trusted-proxy"`. وفي تلك الأوضاع لا تحتاج لوحة التحكم
  إلى سر مشترك مُلصق من أجل WebSocket.
- **ليس localhost**: استخدم Tailscale Serve، أو ربط سر مشترك غير loopback، أو
  وكيلاً عكسيًا غير loopback ومدركًا للهوية مع
  `gateway.auth.mode: "trusted-proxy"`، أو نفق SSH. ولا تزال HTTP APIs تستخدم
  مصادقة السر المشترك ما لم تشغّل عمدًا
  `gateway.auth.mode: "none"` للوصول الخاص أو مصادقة HTTP الخاصة بـ trusted-proxy. راجع
  [أسطح الويب](/ar/web).

<a id="if-you-see-unauthorized-1008"></a>

## إذا رأيت "unauthorized" / 1008

- تأكد من أن gateway قابلة للوصول (محليًا: `openclaw status`؛ وبعيدًا: نفق SSH ‏`ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`).
- بالنسبة إلى `AUTH_TOKEN_MISMATCH`، قد ينفذ العملاء إعادة محاولة موثوقة واحدة باستخدام device token مخزنة مؤقتًا عندما تعيد gateway تلميحات إعادة محاولة. وتعيد إعادة المحاولة بهذه token المخزنة مؤقتًا استخدام النطاقات approved المخزنة مع token؛ أما المستدعون الذين يمررون `deviceToken` صراحةً / `scopes` صراحةً فيحتفظون بمجموعة النطاقات المطلوبة الخاصة بهم. وإذا استمرت المصادقة في الفشل بعد إعادة المحاولة تلك، فقم بحل انجراف token يدويًا.
- خارج مسار إعادة المحاولة هذا، تكون أولوية مصادقة الاتصال هي: shared token/password الصريحة أولًا، ثم `deviceToken` الصريحة، ثم device token المخزنة، ثم bootstrap token.
- في مسار Control UI غير المتزامن عبر Tailscale Serve، تتم سلسلة المحاولات الفاشلة لنفس
  `{scope, ip}` قبل أن يسجل محدد المصادقة الفاشلة هذه المحاولات، لذلك قد تُظهر
  إعادة المحاولة الثانية السيئة المتزامنة بالفعل الرسالة `retry later`.
- لخطوات إصلاح انجراف token، اتبع [قائمة التحقق من استرداد انجراف الرمز](/ar/cli/devices#token-drift-recovery-checklist).
- استرجع السر المشترك أو زوّد به من مضيف gateway:
  - الرمز: `openclaw config get gateway.auth.token`
  - كلمة المرور: حل `gateway.auth.password` المضبوطة أو
    `OPENCLAW_GATEWAY_PASSWORD`
  - رمز مُدار عبر SecretRef: قم بحل موفّر الأسرار الخارجي أو صدّر
    `OPENCLAW_GATEWAY_TOKEN` في هذه shell، ثم أعد تشغيل `openclaw dashboard`
  - لا يوجد سر مشترك مضبوط: `openclaw doctor --generate-gateway-token`
- في إعدادات لوحة التحكم، الصق الرمز أو كلمة المرور في حقل المصادقة،
  ثم اتصل.
- يوجد منتقي لغة الواجهة في **Overview -> Gateway Access -> Language**.
  وهو جزء من بطاقة الوصول، وليس قسم المظهر.

## ذو صلة

- [Control UI](/ar/web/control-ui)
- [WebChat](/ar/web/webchat)
