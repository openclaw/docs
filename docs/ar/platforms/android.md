---
read_when:
    - إقران Node Android أو إعادة توصيله
    - استكشاف أخطاء اكتشاف Gateway أو المصادقة على Android
    - التحقق من تكافؤ سجل الدردشة عبر العملاء
summary: 'تطبيق Android (Node): دليل تشغيل الاتصال + واجهة أوامر Connect/Chat/Voice/Canvas'
title: تطبيق Android
x-i18n:
    generated_at: "2026-06-27T17:56:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
تطبيق Android الرسمي متاح على [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN). إنه عقدة مرافقة ويتطلب Gateway OpenClaw قيد التشغيل. يتوفر كود المصدر أيضًا في [مستودع OpenClaw](https://github.com/openclaw/openclaw) ضمن `apps/android`؛ راجع [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) للحصول على تعليمات البناء.
</Note>

## لقطة الدعم

- الدور: تطبيق عقدة مرافقة (لا يستضيف Android الـ Gateway).
- Gateway مطلوب: نعم (شغّله على macOS أو Linux أو Windows عبر WSL2).
- التثبيت: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) للتطبيق، و[بدء الاستخدام](/ar/start/getting-started) للـ Gateway، ثم [الإقران](/ar/channels/pairing).
- Gateway: [دليل التشغيل](/ar/gateway) + [التكوين](/ar/gateway/configuration).
  - البروتوكولات: [بروتوكول Gateway](/ar/gateway/protocol) (العُقد + مستوى التحكم).

## التحكم في النظام

يوجد التحكم في النظام (launchd/systemd) على مضيف الـ Gateway. راجع [Gateway](/ar/gateway).

## دليل تشغيل الاتصال

تطبيق عقدة Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

يتصل Android مباشرة بـ WebSocket الخاص بالـ Gateway ويستخدم إقران الجهاز (`role: node`).

بالنسبة إلى Tailscale أو المضيفين العامين، يتطلب Android نقطة نهاية آمنة:

- المفضّل: Tailscale Serve / Funnel مع `https://<magicdns>` / `wss://<magicdns>`
- مدعوم أيضًا: أي عنوان URL آخر للـ Gateway بصيغة `wss://` مع نقطة نهاية TLS حقيقية
- يظل النص الصريح `ws://` مدعومًا على عناوين LAN الخاصة / مضيفي `.local`، بالإضافة إلى `localhost` و`127.0.0.1` وجسر محاكي Android (`10.0.2.2`)

### المتطلبات المسبقة

- يمكنك تشغيل الـ Gateway على الجهاز "الرئيسي".
- يمكن لجهاز/محاكي Android الوصول إلى WebSocket الخاص بالـ Gateway:
  - نفس شبكة LAN مع mDNS/NSD، **أو**
  - نفس شبكة Tailscale tailnet باستخدام Wide-Area Bonjour / unicast DNS-SD (انظر أدناه)، **أو**
  - مضيف/منفذ Gateway يدوي (احتياطي)
- لا يستخدم إقران Android عبر tailnet/عام نقاط نهاية raw tailnet IP `ws://`. استخدم Tailscale Serve أو عنوان URL آخر بصيغة `wss://` بدلًا من ذلك.
- يمكنك تشغيل CLI (`openclaw`) على جهاز الـ Gateway (أو عبر SSH).

### 1) ابدأ الـ Gateway

```bash
openclaw gateway --port 18789 --verbose
```

تأكد في السجلات من ظهور شيء مثل:

- `listening on ws://0.0.0.0:18789`

للوصول إلى Android عن بُعد عبر Tailscale، فضّل Serve/Funnel بدلًا من ربط tailnet خام:

```bash
openclaw gateway --tailscale serve
```

يعطي هذا Android نقطة نهاية آمنة `wss://` / `https://`. إعداد `gateway.bind: "tailnet"` عادي لا يكفي لإقران Android عن بُعد للمرة الأولى ما لم تنه TLS بشكل منفصل أيضًا.

### 2) تحقق من الاكتشاف (اختياري)

من جهاز الـ Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

ملاحظات تصحيح أخطاء إضافية: [Bonjour](/ar/gateway/bonjour).

إذا كنت قد كوّنت أيضًا نطاق اكتشاف واسع النطاق، فقارنه مع:

```bash
openclaw gateway discover --json
```

يعرض ذلك `local.` بالإضافة إلى نطاق wide-area المكوّن في مرور واحد، ويستخدم نقطة نهاية الخدمة
المحلولة بدلًا من تلميحات TXT فقط.

#### اكتشاف Tailnet (فيينا ⇄ لندن) عبر unicast DNS-SD

لن يعبر اكتشاف Android NSD/mDNS الشبكات. إذا كانت عقدة Android والـ Gateway على شبكات مختلفة لكنهما متصلان عبر Tailscale، فاستخدم Wide-Area Bonjour / unicast DNS-SD بدلًا من ذلك.

الاكتشاف وحده غير كافٍ لإقران Android عبر tailnet/عام. لا يزال المسار المكتشف يحتاج إلى نقطة نهاية آمنة (`wss://` أو Tailscale Serve):

1. أعدّ منطقة DNS-SD (مثل `openclaw.internal.`) على مضيف الـ Gateway وانشر سجلات `_openclaw-gw._tcp`.
2. كوّن Tailscale split DNS لنطاقك المختار بحيث يشير إلى خادم DNS ذلك.

التفاصيل ومثال تكوين CoreDNS: [Bonjour](/ar/gateway/bonjour).

### 3) اتصل من Android

في تطبيق Android:

- يحافظ التطبيق على اتصال الـ Gateway حيًا عبر **خدمة أمامية** (إشعار مستمر).
- افتح تبويب **الاتصال**.
- استخدم وضع **رمز الإعداد** أو **يدوي**.
- إذا كان الاكتشاف محظورًا، فاستخدم المضيف/المنفذ اليدوي في **عناصر التحكم المتقدمة**. بالنسبة إلى مضيفي LAN الخاصة، يظل `ws://` يعمل. وبالنسبة إلى مضيفي Tailscale/العامة، فعّل TLS واستخدم نقطة نهاية `wss://` / Tailscale Serve.

بعد أول إقران ناجح، يعيد Android الاتصال تلقائيًا عند التشغيل:

- نقطة النهاية اليدوية (إذا كانت مفعّلة)، وإلا
- آخر Gateway مكتشف (بأفضل جهد).

### منارات حضور alive

بعد اتصال جلسة العقدة المصادق عليها، وعندما ينتقل التطبيق إلى الخلفية بينما تكون
الخدمة الأمامية لا تزال متصلة، يستدعي Android `node.event` مع
`event: "node.presence.alive"`. يسجل الـ Gateway هذا كـ `lastSeenAtMs`/`lastSeenReason` في
بيانات تعريف العقدة/الجهاز المقترن فقط بعد معرفة هوية جهاز العقدة المصادق عليها.

يعدّ التطبيق المنارة مسجلة بنجاح فقط عندما تتضمن استجابة الـ Gateway
`handled: true`. قد تقر الـ Gateways الأقدم `node.event` مع `{ "ok": true }`؛ هذه الاستجابة
متوافقة لكنها لا تُحتسب كتحديث دائم لآخر ظهور.

### 4) الموافقة على الإقران (CLI)

على جهاز الـ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

تفاصيل الإقران: [الإقران](/ar/channels/pairing).

اختياري: إذا كانت عقدة Android تتصل دائمًا من شبكة فرعية مضبوطة بإحكام،
يمكنك الاشتراك في الموافقة التلقائية على العقدة للمرة الأولى باستخدام CIDRs صريحة أو عناوين IP دقيقة:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

هذا معطّل افتراضيًا. ينطبق فقط على إقران `role: node` جديد
بلا نطاقات مطلوبة. لا يزال إقران المشغل/المتصفح وأي تغيير في الدور أو النطاق أو البيانات التعريفية أو
المفتاح العام يتطلب موافقة يدوية.

### 5) تحقق من أن العقدة متصلة

- عبر حالة العُقد:

  ```bash
  openclaw nodes status
  ```

- عبر Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) الدردشة + السجل

يدعم تبويب الدردشة في Android اختيار الجلسة (الافتراضية `main`، بالإضافة إلى الجلسات الموجودة الأخرى):

- السجل: `chat.history` (مطبع للعرض؛ تُزال وسوم التعليمات المضمنة
  من النص المرئي، وتُزال حمولات XML لاستدعاءات الأدوات بالنص العادي (بما في ذلك
  `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و
  `<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>`، و
  كتل استدعاء الأدوات المقتطعة) ورموز التحكم بالنموذج المسرّبة ASCII/كاملة العرض،
  وتُحذف صفوف المساعد ذات الرموز الصامتة الخالصة مثل `NO_REPLY` /
  `no_reply` الدقيقة، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة)
- الإرسال: `chat.send`
- تحديثات الدفع (بأفضل جهد): `chat.subscribe` → `event:"chat"`

### 7) Canvas + الكاميرا

#### مضيف Gateway Canvas (موصى به لمحتوى الويب)

إذا كنت تريد أن تعرض العقدة HTML/CSS/JS حقيقيًا يمكن للوكيل تعديله على القرص، فوجه العقدة إلى مضيف canvas الخاص بالـ Gateway.

<Note>
تحمّل العُقد canvas من خادم HTTP الخاص بالـ Gateway (نفس منفذ `gateway.port`، الافتراضي `18789`).
</Note>

1. أنشئ `~/.openclaw/workspace/canvas/index.html` على مضيف الـ Gateway.

2. انتقل بالعقدة إليه (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (اختياري): إذا كان كلا الجهازين على Tailscale، فاستخدم اسم MagicDNS أو عنوان IP للـ tailnet بدلًا من `.local`، مثل `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

يحقن هذا الخادم عميلاً لإعادة التحميل المباشر في HTML ويعيد التحميل عند تغيّر الملفات.
يخدم الـ Gateway أيضًا `/__openclaw__/a2ui/`، لكن تطبيق Android يعامل صفحات A2UI البعيدة كصفحات للعرض فقط. تستخدم أوامر A2UI القادرة على الإجراءات صفحة A2UI المملوكة للتطبيق والمضمنة قبل تطبيق الرسائل.

أوامر Canvas (في الواجهة فقط):

- `canvas.eval`، `canvas.snapshot`، `canvas.navigate` (استخدم `{"url":""}` أو `{"url":"/"}` للعودة إلى السقالة الافتراضية). يعيد `canvas.snapshot` القيمة `{ format, base64 }` (الافتراضي `format="jpeg"`).
- A2UI: `canvas.a2ui.push`، `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` اسم مستعار قديم). تستخدم هذه الأوامر صفحة A2UI المملوكة للتطبيق والمضمنة للعرض القادر على الإجراءات.

أوامر الكاميرا (في الواجهة فقط؛ مقيدة بالإذن):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

راجع [عقدة الكاميرا](/ar/nodes/camera) للمعلمات ومساعدات CLI.

### 8) الصوت + سطح أوامر Android الموسّع

- تبويب الصوت: لدى Android وضعا التقاط صريحان. **الميكروفون** هو جلسة يدوية في تبويب الصوت ترسل كل توقف مؤقت كدورة دردشة وتتوقف عندما يغادر التطبيق الواجهة أو يغادر المستخدم تبويب الصوت. **التحدث** هو وضع Talk مستمر ويواصل الاستماع حتى يتم إيقافه بالتبديل أو تنقطع العقدة.
- يرقّي وضع Talk الخدمة الأمامية الموجودة من `connectedDevice` إلى `connectedDevice|microphone` قبل بدء الالتقاط، ثم يخفضها عند توقف وضع Talk. تعلن خدمة العقدة `FOREGROUND_SERVICE_CONNECTED_DEVICE` مع `CHANGE_NETWORK_STATE`؛ ويتطلب Android 14+ أيضًا تصريح `FOREGROUND_SERVICE_MICROPHONE`، ومنح وقت التشغيل `RECORD_AUDIO`، ونوع خدمة الميكروفون في وقت التشغيل.
- افتراضيًا، يستخدم Android Talk التعرف الأصلي على الكلام، ودردشة Gateway، و`talk.speak` عبر مزود Talk المكوّن في الـ Gateway. يُستخدم TTS المحلي للنظام فقط عندما يكون `talk.speak` غير متاح.
- يستخدم Android Talk ترحيل Gateway بالزمن الحقيقي فقط عندما يكون `talk.realtime.mode` هو `realtime` و`talk.realtime.transport` هو `gateway-relay`.
- يظل تنبيه الصوت معطلًا في تجربة مستخدم Android/وقت التشغيل.
- عائلات أوامر Android إضافية (يعتمد التوفر على الجهاز والأذونات وإعدادات المستخدم):
  - `device.status`، `device.info`، `device.permissions`، `device.health`
  - `device.apps` فقط عندما يكون **الإعدادات > إمكانات الهاتف > التطبيقات المثبتة** مفعّلًا؛ يسرد التطبيقات الظاهرة في المشغّل افتراضيًا.
  - `notifications.list`، `notifications.actions` (راجع [إعادة توجيه الإشعارات](#notification-forwarding) أدناه)
  - `photos.latest`
  - `contacts.search`، `contacts.add`
  - `calendar.events`، `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`، `motion.pedometer`

## نقاط دخول المساعد

يدعم Android تشغيل OpenClaw من مشغّل مساعد النظام (Google
Assistant). عند تكوينه، يؤدي الضغط المطول على زر الصفحة الرئيسية أو قول "يا Google، اطلب من
OpenClaw..." إلى فتح التطبيق وتمرير الطلب إلى محرر الدردشة.

يستخدم هذا بيانات تعريف **إجراءات التطبيق** في Android المعلنة في بيان التطبيق. لا
يلزم أي تكوين إضافي من جهة الـ Gateway -- تتم معالجة نية المساعد بالكامل
بواسطة تطبيق Android وتُمرر كرسالة دردشة عادية.

<Note>
يعتمد توفر App Actions على الجهاز وإصدار Google Play Services،
وما إذا كان المستخدم قد عيّن OpenClaw كتطبيق المساعد الافتراضي.
</Note>

## إعادة توجيه الإشعارات

يمكن لـ Android إعادة توجيه إشعارات الجهاز إلى الـ Gateway كأحداث. تتيح لك عدة عناصر تحكم تحديد نطاق الإشعارات التي تُعاد توجيهها ومتى.

| المفتاح                          | النوع          | الوصف                                                                                             |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | أعد توجيه الإشعارات من أسماء الحزم هذه فقط. إذا ضُبط، فسيتم تجاهل جميع الحزم الأخرى.             |
| `notifications.denyPackages`     | string[]       | لا تعد توجيه الإشعارات أبدًا من أسماء الحزم هذه. يُطبّق بعد `allowPackages`.                      |
| `notifications.quietHours.start` | string (HH:mm) | بداية نافذة ساعات الهدوء (وقت الجهاز المحلي). يتم كتم الإشعارات خلال هذه النافذة.                |
| `notifications.quietHours.end`   | string (HH:mm) | نهاية نافذة ساعات الهدوء.                                                                         |
| `notifications.rateLimit`        | number         | الحد الأقصى للإشعارات المعاد توجيهها لكل حزمة في الدقيقة. تُسقط الإشعارات الزائدة.                |

يستخدم منتقي الإشعارات أيضًا سلوكًا أكثر أمانًا لأحداث الإشعارات المعاد توجيهها، ما يمنع إعادة التوجيه العرضية لإشعارات النظام الحساسة.

مثال على التهيئة:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
يتطلب توجيه الإشعارات إذن Android Notification Listener. يطلب التطبيق هذا الإذن أثناء الإعداد.
</Note>

## ذات صلة

- [تطبيق iOS](/ar/platforms/ios)
- [العُقَد](/ar/nodes)
- [استكشاف أخطاء عقدة Android وإصلاحها](/ar/nodes/troubleshooting)
