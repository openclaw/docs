---
read_when:
    - تغيير مصادقة لوحة المعلومات أو أوضاع إتاحتها
summary: الوصول إلى لوحة معلومات Gateway (واجهة التحكم) والمصادقة
title: لوحة المعلومات
x-i18n:
    generated_at: "2026-07-16T15:16:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 34d7ab6c5f503f2dd3ab212a1fc6b47c84fcd47c5ad88aa9cdbbbbc73b7ef90e
    source_path: web/dashboard.md
    workflow: 16
---

لوحة معلومات Gateway هي واجهة Control UI في المتصفح التي تُخدَّم افتراضيًا على `/` (يمكن تجاوز ذلك باستخدام `gateway.controlUi.basePath`).

فتح سريع (Gateway محلي):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (أو [http://localhost:18789/](http://localhost:18789/))
- مع `gateway.tls.enabled: true`، استخدم `https://127.0.0.1:18789/` و`wss://127.0.0.1:18789` لنقطة نهاية WebSocket.

المراجع الرئيسية:

- [واجهة Control UI](/ar/web/control-ui) للاستخدام وإمكانات واجهة المستخدم.
- [Tailscale](/ar/gateway/tailscale) لأتمتة Serve/Funnel.
- [واجهات الويب](/ar/web) لأوضاع الربط وملاحظات الأمان.

يُفرض الاستيثاق أثناء مصافحة WebSocket عبر مسار استيثاق Gateway المُهيأ:

- `connect.params.auth.token`
- `connect.params.auth.password`
- ترويسات هوية Tailscale Serve عندما `gateway.auth.allowTailscale: true`
- ترويسات هوية الوكيل الموثوق عندما `gateway.auth.mode: "trusted-proxy"`

راجع `gateway.auth` في [تهيئة Gateway](/ar/gateway/configuration).

<Warning>
واجهة Control UI هي **واجهة إدارية** (الدردشة والتهيئة والموافقات على التنفيذ). لا تعرضها للعامة. تحتفظ الواجهة برموز URL الخاصة بلوحة المعلومات في sessionStorage لعلامة تبويب المتصفح الحالية وعنوان URL المحدد لـ Gateway، وتزيلها من عنوان URL بعد التحميل. يُفضَّل استخدام localhost أو Tailscale Serve أو نفق SSH.
</Warning>

## المسار السريع (موصى به)

- بعد الإعداد الأولي، تفتح CLI لوحة المعلومات تلقائيًا وتطبع رابطًا نظيفًا (من دون رمز).
- أعِد فتحها في أي وقت: `openclaw dashboard` (ينسخ الرابط، ويفتح متصفحًا إن أمكن، ويطبع تلميحًا لاستخدام SSH إذا كانت البيئة بلا واجهة رسومية).
- إذا فشل كل من التسليم عبر الحافظة والمتصفح، فسيظل `openclaw dashboard` يطبع عنوان URL النظيف ويطلب منك إلحاق رمزك (من `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.token`) كمفتاح جزء URL‏ `token`؛ ولا يطبع قيمة الرمز في السجلات مطلقًا.
- إذا طلبت الواجهة استيثاقًا بسر مشترك، فألصق الرمز أو كلمة المرور المُهيأة في إعدادات Control UI.

## أساسيات الاستيثاق (محلي مقابل بعيد)

- **المضيف المحلي**: افتح `http://127.0.0.1:18789/`.
- **TLS لـ Gateway**: عندما `gateway.tls.enabled: true`، تستخدم روابط لوحة المعلومات/الحالة `https://`، وتستخدم روابط WebSocket الخاصة بـ Control UI‏ `wss://`.
- **مصدر رمز السر المشترك**: `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`). يمكن لـ `openclaw dashboard` تمريره عبر جزء URL للتمهيد لمرة واحدة؛ وتحتفظ به Control UI في sessionStorage لعلامة التبويب الحالية وعنوان URL المحدد لـ Gateway، وليس في localStorage.
- إذا كانت `gateway.auth.token` مُدارة بواسطة SecretRef، فإن `openclaw dashboard` يطبع/ينسخ/يفتح عنوان URL من دون رمز عن قصد، لتجنب كشف الرموز المُدارة خارجيًا في سجلات الصدفة أو سجل الحافظة أو وسائط تشغيل المتصفح. وإذا تعذر حل المرجع في الصدفة الحالية، فسيظل يطبع عنوان URL من دون رمز بالإضافة إلى إرشادات عملية لإعداد الاستيثاق.
- **كلمة مرور السر المشترك**: استخدم `gateway.auth.password` المُهيأة (أو `OPENCLAW_GATEWAY_PASSWORD`). لا تحتفظ لوحة المعلومات بكلمات المرور بعد إعادة التحميل.
- **الأوضاع الحاملة للهوية**: يستوفي Tailscale Serve استيثاق Control UI/WebSocket عبر ترويسات الهوية عندما `gateway.auth.allowTailscale: true`؛ ويستوفي وكيل عكسي مدرك للهوية وغير مرتبط بواجهة الاسترجاع `gateway.auth.mode: "trusted-proxy"`. ولا يتطلب أي منهما لصق سر مشترك من أجل WebSocket.
- **ليس المضيف المحلي**: استخدم Tailscale Serve، أو ربطًا بسر مشترك خارج واجهة الاسترجاع، أو وكيلًا عكسيًا مدركًا للهوية خارج واجهة الاسترجاع مع `gateway.auth.mode: "trusted-proxy"`، أو نفق SSH. تظل واجهات HTTP API تستخدم استيثاق السر المشترك ما لم تُشغّل عمدًا `gateway.auth.mode: "none"` عبر إدخال خاص أو استيثاق HTTP بالوكيل الموثوق. راجع [واجهات الويب](/ar/web).

## الفتح في Telegram

يمكن لروبوتات Telegram فتح لوحة المعلومات كتطبيق Telegram مصغر باستخدام `/dashboard`.

المتطلبات:

- `gateway.tailscale.mode: "serve"` أو `"funnel"` لكي يحصل Telegram على عنوان URL بتنسيق HTTPS للتطبيق المصغر.
- يجب أن يكون مُرسِل Telegram هو مالك الروبوت: معرّف مستخدم Telegram رقمي في `commands.ownerAllowFrom` أو القيمة الفعلية لـ `channels.telegram.allowFrom` للحساب المحدد.
- شغّل `/dashboard` في رسالة خاصة مع الروبوت. أما الاستدعاءات في المجموعات فتطلب منك فقط فتح الأمر في رسالة خاصة ولا تتضمن زرًا.
- عمليات تثبيت Docker: تتطلب أوضاع Serve/Funnel ربط Gateway بواجهة الاسترجاع بجوار `tailscaled`، وهو ما لا يمكن لشبكات الجسر ذات المنافذ المنشورة استيفاؤه. شغّل حاوية Gateway باستخدام `network_mode: host`، وثبّت مقبس المضيف `tailscaled` ‏(`/var/run/tailscale`) بالإضافة إلى CLI‏ `tailscale` داخل الحاوية.

ينفّذ التطبيق المصغر عملية تسليم لمرة واحدة إلى المالك ويعيد التوجيه إلى Control UI باستخدام رمز تمهيد قصير الأجل. ولا يكشف رمز Gateway مشتركًا في عنوان URL.

ما لا يستهدفه الإصدار v1:

- إطار iframe الخاص بـ Telegram Web غير مدعوم.
- Tailscale Serve/Funnel هو مسار عنوان URL المنشور الوحيد المدعوم.

<a id="if-you-see-unauthorized-1008"></a>

## إذا رأيت "unauthorized" / 1008

- تأكد من إمكانية الوصول إلى Gateway: محليًا عبر `openclaw status`؛ وعن بُعد، أنشئ نفق SSH باستخدام `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host` ثم افتح `http://127.0.0.1:18789/`.
- بالنسبة إلى `AUTH_TOKEN_MISMATCH`، قد تُجري البرامج العميلة إعادة محاولة موثوقة واحدة باستخدام رمز جهاز مخزّن مؤقتًا عندما يعيد Gateway تلميحات لإعادة المحاولة؛ وتعيد هذه المحاولة استخدام النطاقات المعتمدة المخزنة مؤقتًا للرمز (يحتفظ مستدعو `deviceToken`/`scopes` الصريحون بمجموعة النطاقات المطلوبة لديهم). وإذا ظل الاستيثاق يفشل بعد تلك المحاولة، فقم بحل انحراف الرمز يدويًا.
- بالنسبة إلى `AUTH_SCOPE_MISMATCH`، تم التعرّف على رمز الجهاز لكنه لا يتضمن النطاقات المطلوبة؛ فأعِد الاقتران أو وافق على مجموعة النطاقات الجديدة بدلًا من تدوير رمز Gateway المشترك.
- خارج مسار إعادة المحاولة هذا، تكون أسبقية استيثاق الاتصال كما يلي: الرمز/كلمة المرور المشتركة الصريحة، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزّن، ثم رمز التمهيد.
- في مسار Tailscale Serve غير المتزامن، تُسلسل المحاولات الفاشلة للقيمة نفسها من `{scope, ip}` قبل أن يسجلها محدِّد محاولات الاستيثاق الفاشلة، لذلك قد تعرض إعادة محاولة سيئة ثانية متزامنة بالفعل `retry later`.
- لخطوات إصلاح انحراف الرمز، راجع [قائمة التحقق من استعادة انحراف الرمز](/ar/cli/devices#token-drift-recovery-checklist).
- استرجع السر المشترك أو قدّمه من مضيف Gateway:
  - الرمز: `openclaw config get gateway.auth.token`
  - كلمة المرور: قم بحل `gateway.auth.password` أو `OPENCLAW_GATEWAY_PASSWORD` المُهيأة
  - الرمز المُدار بواسطة SecretRef: قم بحل موفّر الأسرار الخارجي، أو صدّر `OPENCLAW_GATEWAY_TOKEN` في هذه الصدفة وأعِد تشغيل `openclaw dashboard`
  - لا يوجد سر مشترك مُهيأ: `openclaw doctor --generate-gateway-token`
- في إعدادات لوحة المعلومات، ألصق الرمز أو كلمة المرور في حقل الاستيثاق، ثم اتصل.
- يوجد منتقي لغة الواجهة في **Settings -> General -> Language**، وليس ضمن Appearance.

## ذو صلة

- [واجهة Control UI](/ar/web/control-ui)
- [WebChat](/ar/web/webchat)
