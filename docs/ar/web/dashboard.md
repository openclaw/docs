---
read_when:
    - تغيير أوضاع مصادقة لوحة التحكم أو تعريضها
summary: الوصول إلى لوحة Gateway ‏(Control UI) والمصادقة عليها
title: لوحة التحكم
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-25T14:01:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e0e7c8cebe715f96e7f0e967e9fd86c4c6c54f7cc08a4291b02515fc0933a1a
    source_path: web/dashboard.md
    workflow: 15
---

لوحة Gateway هي Control UI في المتصفح وتُخدم افتراضيًا عند `/`
(يمكن تجاوزها عبر `gateway.controlUi.basePath`).

الفتح السريع (Gateway محلي):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (أو [http://localhost:18789/](http://localhost:18789/))
- مع `gateway.tls.enabled: true`، استخدم `https://127.0.0.1:18789/` و
  `wss://127.0.0.1:18789` لنقطة نهاية WebSocket.

المراجع الأساسية:

- [Control UI](/ar/web/control-ui) للاستخدام وإمكانات واجهة المستخدم.
- [Tailscale](/ar/gateway/tailscale) لأتمتة Serve/Funnel.
- [أسطح الويب](/ar/web) لأوضاع الربط وملاحظات الأمان.

تُفرض المصادقة عند مصافحة WebSocket عبر مسار مصادقة Gateway
المهيأ:

- `connect.params.auth.token`
- `connect.params.auth.password`
- رؤوس هوية Tailscale Serve عندما تكون `gateway.auth.allowTailscale: true`
- رؤوس الهوية الخاصة بالوكيل الموثوق عندما تكون `gateway.auth.mode: "trusted-proxy"`

راجع `gateway.auth` في [تهيئة Gateway](/ar/gateway/configuration).

ملاحظة أمنية: تمثل Control UI **سطح إدارة** (الدردشة، والتهيئة، وموافقات exec).
لا تعرّضها علنًا. تحتفظ الواجهة برموز URL الخاصة باللوحة في sessionStorage
لجلسة علامة تبويب المتصفح الحالية وعنوان URL المحدد لـ Gateway، وتزيلها من عنوان URL بعد التحميل.
فضّل localhost، أو Tailscale Serve، أو نفق SSH.

## المسار السريع (موصى به)

- بعد الإعداد الأولي، يفتح CLI اللوحة تلقائيًا ويطبع رابطًا نظيفًا (غير مضمَّن فيه رمز).
- أعد الفتح في أي وقت: `openclaw dashboard` (ينسخ الرابط، ويفتح المتصفح إن أمكن، ويعرض تلميح SSH إذا كان النظام عديم الواجهة).
- إذا طلبت الواجهة مصادقة سر مشترك، فألصق الرمز المميز أو
  كلمة المرور المهيأة في إعدادات Control UI.

## أساسيات المصادقة (محلي مقابل بعيد)

- **Localhost**: افتح `http://127.0.0.1:18789/`.
- **Gateway TLS**: عندما تكون `gateway.tls.enabled: true`، تستخدم روابط اللوحة/الحالة
  `https://` وتستخدم روابط WebSocket في Control UI البروتوكول `wss://`.
- **مصدر الرمز المميز للسر المشترك**: `gateway.auth.token` (أو
  `OPENCLAW_GATEWAY_TOKEN`)؛ يمكن للأمر `openclaw dashboard` تمريره عبر جزء URL
  لتمهيد أولي لمرة واحدة، وتحتفظ به Control UI في sessionStorage لجلسة
  علامة التبويب الحالية وعنوان URL المحدد لـ Gateway بدلًا من localStorage.
- إذا كان `gateway.auth.token` مُدارًا عبر SecretRef، فإن `openclaw dashboard`
  يطبع/ينسخ/يفتح عنوان URL غير مضمَّن فيه رمز بحسب التصميم. وهذا يتجنب كشف
  الرموز المميزة المُدارة خارجيًا في سجلات shell، أو سجل الحافظة، أو
  معاملات تشغيل المتصفح.
- إذا كان `gateway.auth.token` مهيأً كـ SecretRef ولم يُحل في
  shell الحالي، فإن `openclaw dashboard` ما يزال يطبع عنوان URL غير مضمَّن فيه رمز
  بالإضافة إلى إرشادات عملية لإعداد المصادقة.
- **كلمة مرور السر المشترك**: استخدم `gateway.auth.password` المهيأة (أو
  `OPENCLAW_GATEWAY_PASSWORD`). ولا تحتفظ اللوحة بكلمات المرور عبر
  إعادة التحميل.
- **الأوضاع الحاملة للهوية**: يمكن لـ Tailscale Serve استيفاء مصادقة Control UI/WebSocket
  عبر رؤوس الهوية عندما تكون `gateway.auth.allowTailscale: true`، ويمكن
  لوكيل عكسي غير loopback واعٍ بالهوية أن يستوفي
  `gateway.auth.mode: "trusted-proxy"`. وفي هذه الأوضاع لا تحتاج اللوحة
  إلى سر مشترك ملصق من أجل WebSocket.
- **ليس localhost**: استخدم Tailscale Serve، أو ربط سر مشترك غير loopback، أو
  وكيلًا عكسيًا غير loopback واعيًا بالهوية مع
  `gateway.auth.mode: "trusted-proxy"`، أو نفق SSH. وما تزال
  HTTP APIs تستخدم مصادقة السر المشترك ما لم تشغّل عمدًا
  `gateway.auth.mode: "none"` للإدخال الخاص أو مصادقة HTTP الخاصة بالوكيل الموثوق. راجع
  [أسطح الويب](/ar/web).

<a id="if-you-see-unauthorized-1008"></a>

## إذا رأيت "unauthorized" / 1008

- تأكد من إمكانية الوصول إلى الـ gateway (محليًا: `openclaw status`؛ وبعيدًا: نفق SSH ‏`ssh -N -L 18789:127.0.0.1:18789 user@host` ثم افتح `http://127.0.0.1:18789/`).
- بالنسبة إلى `AUTH_TOKEN_MISMATCH`، قد تنفذ العملاء إعادة محاولة موثوقة واحدة باستخدام رمز جهاز مخزن مؤقتًا عندما يعيد الـ gateway تلميحات إعادة المحاولة. وتعيد محاولة الرمز المخزن مؤقتًا استخدام النطاقات المعتمدة المخزنة لذلك الرمز؛ بينما تحتفظ استدعاءات `deviceToken` الصريحة / `scopes` الصريحة بمجموعة النطاق المطلوبة. وإذا استمرت المصادقة بالفشل بعد إعادة المحاولة تلك، فقم بحل انجراف الرمز يدويًا.
- خارج مسار إعادة المحاولة هذا، تكون أولوية مصادقة الاتصال: الرمز/كلمة المرور الصريحة المشتركة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز التهيئة الأولية.
- على مسار Control UI غير المتزامن في Tailscale Serve، يتم تسلسل المحاولات الفاشلة للقيمة نفسها
  `{scope, ip}` قبل أن يسجل محدِّد المصادقة الفاشلة هذه المحاولات، لذلك قد تظهر إعادة المحاولة
  الثانية السيئة المتزامنة بالفعل الرسالة `retry later`.
- بالنسبة إلى خطوات إصلاح انجراف الرمز، اتبع [قائمة التحقق من استعادة انجراف الرمز](/ar/cli/devices#token-drift-recovery-checklist).
- استرجع أو وفّر السر المشترك من مضيف gateway:
  - الرمز المميز: `openclaw config get gateway.auth.token`
  - كلمة المرور: حل `gateway.auth.password` المهيأة أو
    `OPENCLAW_GATEWAY_PASSWORD`
  - الرمز المميز المُدار عبر SecretRef: حل موفر الأسرار الخارجي أو صدّر
    `OPENCLAW_GATEWAY_TOKEN` في هذا الـ shell، ثم أعد تشغيل `openclaw dashboard`
  - لا يوجد سر مشترك مهيأ: `openclaw doctor --generate-gateway-token`
- في إعدادات اللوحة، ألصق الرمز المميز أو كلمة المرور في حقل المصادقة،
  ثم اتصل.
- يوجد محدد لغة الواجهة في **Overview -> Gateway Access -> Language**.
  وهو جزء من بطاقة الوصول، وليس من قسم المظهر.

## ذو صلة

- [Control UI](/ar/web/control-ui)
- [WebChat](/ar/web/webchat)
