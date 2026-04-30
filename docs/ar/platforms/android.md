---
read_when:
    - إقران Node الخاص بـ Android أو إعادة الاتصال به
    - تصحيح أخطاء اكتشاف Gateway أو المصادقة على Android
    - التحقق من تكافؤ سجل الدردشة عبر العملاء
summary: 'تطبيق Android (Node): دليل تشغيل الاتصال + واجهة أوامر الاتصال/الدردشة/الصوت/اللوحة'
title: تطبيق Android
x-i18n:
    generated_at: "2026-04-30T08:10:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae8bec406a006165f124f305e00c848f5527d43dba3cbcd07bd0d7e6f0dcc247
    source_path: platforms/android.md
    workflow: 16
---

<Note>
لم يُصدر تطبيق Android علنًا بعد. يتوفر كود المصدر في [مستودع OpenClaw](https://github.com/openclaw/openclaw) ضمن `apps/android`. يمكنك بناؤه بنفسك باستخدام Java 17 وAndroid SDK (`./gradlew :app:assemblePlayDebug`). راجع [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) للحصول على تعليمات البناء.
</Note>

## لقطة دعم

- الدور: تطبيق عقدة مرافق (لا يستضيف Android الـ Gateway).
- Gateway مطلوب: نعم (شغّله على macOS أو Linux أو Windows عبر WSL2).
- التثبيت: [بدء الاستخدام](/ar/start/getting-started) + [الإقران](/ar/channels/pairing).
- Gateway: [دليل التشغيل](/ar/gateway) + [الإعداد](/ar/gateway/configuration).
  - البروتوكولات: [بروتوكول Gateway](/ar/gateway/protocol) (العقد + مستوى التحكم).

## التحكم في النظام

يوجد التحكم في النظام (launchd/systemd) على مضيف الـ Gateway. راجع [Gateway](/ar/gateway).

## دليل تشغيل الاتصال

تطبيق عقدة Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

يتصل Android مباشرةً بـ WebSocket الخاص بالـ Gateway ويستخدم إقران الجهاز (`role: node`).

بالنسبة إلى مضيفات Tailscale أو المضيفات العامة، يتطلب Android نقطة نهاية آمنة:

- المفضل: Tailscale Serve / Funnel مع `https://<magicdns>` / `wss://<magicdns>`
- مدعوم أيضًا: أي عنوان URL آخر للـ Gateway بصيغة `wss://` مع نقطة نهاية TLS حقيقية
- يظل النص الصريح `ws://` مدعومًا على عناوين LAN الخاصة / مضيفات `.local`، بالإضافة إلى `localhost` و`127.0.0.1` وجسر محاكي Android (`10.0.2.2`)

### المتطلبات الأساسية

- يمكنك تشغيل الـ Gateway على الجهاز “الرئيسي”.
- يمكن لجهاز/محاكي Android الوصول إلى WebSocket الخاص بالـ Gateway:
  - نفس LAN مع mDNS/NSD، **أو**
  - نفس tailnet في Tailscale باستخدام Wide-Area Bonjour / unicast DNS-SD (انظر أدناه)، **أو**
  - مضيف/منفذ Gateway يدوي (احتياطي)
- لا يستخدم إقران الهاتف عبر tailnet/العام نقاط نهاية IP خامة من tailnet بصيغة `ws://`. استخدم Tailscale Serve أو عنوان URL آخر بصيغة `wss://` بدلًا من ذلك.
- يمكنك تشغيل CLI (`openclaw`) على جهاز الـ Gateway (أو عبر SSH).

### 1) بدء الـ Gateway

```bash
openclaw gateway --port 18789 --verbose
```

تأكد في السجلات أنك ترى شيئًا مثل:

- `listening on ws://0.0.0.0:18789`

للوصول إلى Android عن بُعد عبر Tailscale، فضّل Serve/Funnel بدلًا من ربط tailnet خام:

```bash
openclaw gateway --tailscale serve
```

يعطي هذا Android نقطة نهاية آمنة بصيغة `wss://` / `https://`. إعداد `gateway.bind: "tailnet"` العادي ليس كافيًا لإقران Android عن بُعد للمرة الأولى ما لم تُنهِ TLS بشكل منفصل أيضًا.

### 2) التحقق من الاكتشاف (اختياري)

من جهاز الـ Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

ملاحظات تصحيح أخطاء إضافية: [Bonjour](/ar/gateway/bonjour).

إذا كنت قد أعددت أيضًا نطاق اكتشاف واسع النطاق، فقارنه مع:

```bash
openclaw gateway discover --json
```

يعرض ذلك `local.` بالإضافة إلى النطاق واسع النطاق المهيأ في تمريرة واحدة ويستخدم نقطة نهاية الخدمة التي تم حلها بدلًا من تلميحات TXT فقط.

#### اكتشاف Tailnet (فيينا ⇄ لندن) عبر unicast DNS-SD

لن يعبر اكتشاف Android NSD/mDNS الشبكات. إذا كانت عقدة Android والـ Gateway على شبكات مختلفة لكنهما متصلان عبر Tailscale، فاستخدم Wide-Area Bonjour / unicast DNS-SD بدلًا من ذلك.

الاكتشاف وحده لا يكفي لإقران Android عبر tailnet/عام. لا يزال المسار المكتشف يحتاج إلى نقطة نهاية آمنة (`wss://` أو Tailscale Serve):

1. أعدّ منطقة DNS-SD (مثال `openclaw.internal.`) على مضيف الـ Gateway وانشر سجلات `_openclaw-gw._tcp`.
2. اضبط Tailscale split DNS لنطاقك المختار بحيث يشير إلى خادم DNS ذلك.

التفاصيل ومثال إعداد CoreDNS: [Bonjour](/ar/gateway/bonjour).

### 3) الاتصال من Android

في تطبيق Android:

- يحافظ التطبيق على اتصال الـ Gateway نشطًا عبر **خدمة أمامية** (إشعار مستمر).
- افتح تبويب **الاتصال**.
- استخدم وضع **رمز الإعداد** أو **يدوي**.
- إذا كان الاكتشاف محظورًا، فاستخدم المضيف/المنفذ يدويًا في **عناصر التحكم المتقدمة**. بالنسبة إلى مضيفات LAN الخاصة، لا يزال `ws://` يعمل. بالنسبة إلى مضيفات Tailscale/العامة، شغّل TLS واستخدم نقطة نهاية `wss://` / Tailscale Serve.

بعد أول إقران ناجح، يعيد Android الاتصال تلقائيًا عند التشغيل:

- نقطة نهاية يدوية (إذا كانت مفعّلة)، وإلا
- آخر Gateway تم اكتشافه (بأفضل جهد).

### إشارات بقاء الحضور

بعد اتصال جلسة العقدة المصادق عليها، وعندما ينتقل التطبيق إلى الخلفية بينما تكون
الخدمة الأمامية لا تزال متصلة، يستدعي Android `node.event` مع
`event: "node.presence.alive"`. يسجل الـ Gateway هذا كـ `lastSeenAtMs`/`lastSeenReason` في
بيانات تعريف العقدة/الجهاز المقترن فقط بعد معرفة هوية جهاز العقدة المصادق عليها.

يعدّ التطبيق الإشارة مسجلة بنجاح فقط عندما تتضمن استجابة الـ Gateway
`handled: true`. قد تؤكد بوابات Gateway الأقدم `node.event` مع `{ "ok": true }`؛ هذه الاستجابة
متوافقة لكنها لا تُحتسب كتحديث دائم لآخر ظهور.

### 4) الموافقة على الإقران (CLI)

على جهاز الـ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

تفاصيل الإقران: [الإقران](/ar/channels/pairing).

اختياري: إذا كانت عقدة Android تتصل دائمًا من شبكة فرعية محكمة التحكم،
يمكنك الاشتراك في الموافقة التلقائية لأول مرة على العقدة باستخدام CIDRs صريحة أو عناوين IP دقيقة:

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

هذا معطل افتراضيًا. ينطبق فقط على إقران `role: node` جديد
دون نطاقات مطلوبة. لا يزال إقران المشغّل/المتصفح وأي تغيير في الدور أو النطاق أو البيانات الوصفية أو
المفتاح العام يتطلب موافقة يدوية.

### 5) التحقق من أن العقدة متصلة

- عبر حالة العقد:

  ```bash
  openclaw nodes status
  ```

- عبر Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) الدردشة + السجل

يدعم تبويب الدردشة في Android اختيار الجلسة (الافتراضية `main`، بالإضافة إلى الجلسات الموجودة الأخرى):

- السجل: `chat.history` (مطبع للعرض؛ تُزال وسوم التوجيه المضمنة من
  النص المرئي، وتُزال حمولات XML لاستدعاءات الأدوات بالنص العادي (بما في ذلك
  `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و
  `<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>` و
  كتل استدعاء الأدوات المقتطعة) ورموز تحكم النموذج ASCII/كاملة العرض المسرّبة،
  وتُحذف صفوف المساعد ذات الرموز الصامتة الخالصة مثل `NO_REPLY` /
  `no_reply` بالضبط، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة)
- الإرسال: `chat.send`
- تحديثات الدفع (بأفضل جهد): `chat.subscribe` → `event:"chat"`

### 7) Canvas + الكاميرا

#### مضيف Gateway Canvas (موصى به لمحتوى الويب)

إذا كنت تريد من العقدة عرض HTML/CSS/JS حقيقي يمكن للوكيل تعديله على القرص، فوجه العقدة إلى مضيف Canvas في الـ Gateway.

<Note>
تحمّل العقد Canvas من خادم HTTP الخاص بالـ Gateway (نفس منفذ `gateway.port`، الافتراضي `18789`).
</Note>

1. أنشئ `~/.openclaw/workspace/canvas/index.html` على مضيف الـ Gateway.

2. انتقل بالعقدة إليه (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (اختياري): إذا كان الجهازان على Tailscale، فاستخدم اسم MagicDNS أو عنوان IP في tailnet بدلًا من `.local`، مثل `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

يحقن هذا الخادم عميل إعادة تحميل حي في HTML ويعيد التحميل عند تغييرات الملفات.
يوجد مضيف A2UI في `http://<gateway-host>:18789/__openclaw__/a2ui/`.

أوامر Canvas (في المقدمة فقط):

- `canvas.eval` و`canvas.snapshot` و`canvas.navigate` (استخدم `{"url":""}` أو `{"url":"/"}` للعودة إلى القالب الافتراضي). يُرجع `canvas.snapshot` القيمة `{ format, base64 }` (الافتراضي `format="jpeg"`).
- A2UI: `canvas.a2ui.push` و`canvas.a2ui.reset` (الاسم المستعار القديم `canvas.a2ui.pushJSONL`)

أوامر الكاميرا (في المقدمة فقط؛ محكومة بالأذونات):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

راجع [عقدة الكاميرا](/ar/nodes/camera) للمعلمات ومساعدات CLI.

### 8) الصوت + سطح أوامر Android الموسع

- تبويب الصوت: لدى Android وضعا التقاط صريحان. **Mic** هو جلسة يدوية في تبويب الصوت ترسل كل توقف كدور دردشة وتتوقف عندما يغادر التطبيق المقدمة أو يغادر المستخدم تبويب الصوت. **Talk** هو Talk Mode مستمر ويواصل الاستماع حتى يتم إيقافه بالمفتاح أو تنفصل العقدة.
- يرقّي Talk Mode الخدمة الأمامية الحالية من `dataSync` إلى `dataSync|microphone` قبل بدء الالتقاط، ثم يخفضها عند توقف Talk Mode. يتطلب Android 14+ تصريح `FOREGROUND_SERVICE_MICROPHONE` ومنح وقت التشغيل `RECORD_AUDIO` ونوع خدمة الميكروفون في وقت التشغيل.
- تستخدم الردود المنطوقة `talk.speak` عبر موفر Talk المهيأ في الـ Gateway. يُستخدم TTS المحلي للنظام فقط عندما لا يتوفر `talk.speak`.
- يظل إيقاظ الصوت معطلًا في تجربة مستخدم Android/وقت التشغيل.
- عائلات أوامر Android إضافية (يعتمد التوفر على الجهاز + الأذونات):
  - `device.status` و`device.info` و`device.permissions` و`device.health`
  - `notifications.list` و`notifications.actions` (راجع [إعادة توجيه الإشعارات](#notification-forwarding) أدناه)
  - `photos.latest`
  - `contacts.search` و`contacts.add`
  - `calendar.events` و`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity` و`motion.pedometer`

## نقاط دخول المساعد

يدعم Android تشغيل OpenClaw من مشغّل مساعد النظام (Google
Assistant). عند إعداده، يؤدي الضغط مطولًا على زر الصفحة الرئيسية أو قول "Hey Google, ask
OpenClaw..." إلى فتح التطبيق وتسليم الطلب إلى محرر الدردشة.

يستخدم هذا بيانات تعريف Android **App Actions** المعلنة في بيان التطبيق. لا
يلزم إعداد إضافي على جانب الـ Gateway -- تتم معالجة نية المساعد بالكامل بواسطة تطبيق Android وتُمرر كرسالة دردشة عادية.

<Note>
يعتمد توفر App Actions على الجهاز وإصدار Google Play Services
وما إذا كان المستخدم قد عيّن OpenClaw كتطبيق المساعد الافتراضي.
</Note>

## إعادة توجيه الإشعارات

يمكن لـ Android إعادة توجيه إشعارات الجهاز إلى الـ Gateway كأحداث. تتيح لك عدة عناصر تحكم تحديد نطاق الإشعارات التي تُعاد توجيهها ووقت ذلك.

| المفتاح                              | النوع           | الوصف                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | لا تُعد توجيه إلا الإشعارات من أسماء الحزم هذه. إذا ضُبطت، يتم تجاهل جميع الحزم الأخرى.      |
| `notifications.denyPackages`     | string[]       | لا تُعد توجيه الإشعارات من أسماء الحزم هذه أبدًا. يُطبق بعد `allowPackages`.              |
| `notifications.quietHours.start` | string (HH:mm) | بداية نافذة ساعات الهدوء (وقت الجهاز المحلي). تُكبت الإشعارات خلال هذه النافذة. |
| `notifications.quietHours.end`   | string (HH:mm) | نهاية نافذة ساعات الهدوء.                                                                        |
| `notifications.rateLimit`        | number         | الحد الأقصى للإشعارات المعاد توجيهها لكل حزمة في الدقيقة. تُسقط الإشعارات الزائدة.         |

يستخدم منتقي الإشعارات أيضًا سلوكًا أكثر أمانًا لأحداث الإشعارات المعاد توجيهها، مما يمنع إعادة التوجيه العرضية لإشعارات النظام الحساسة.

مثال على الإعداد:

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
تتطلب إعادة توجيه الإشعارات إذن Android Notification Listener. يطلب التطبيق ذلك أثناء الإعداد.
</Note>

## ذات صلة

- [تطبيق iOS](/ar/platforms/ios)
- [العقد](/ar/nodes)
- [استكشاف أخطاء عقدة Android وإصلاحها](/ar/nodes/troubleshooting)
