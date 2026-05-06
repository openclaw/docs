---
read_when:
    - إقران Node الخاص بـ Android أو إعادة توصيله
    - تصحيح أخطاء اكتشاف Gateway أو المصادقة على Android
    - التحقق من تكافؤ سجل المحادثات عبر العملاء
summary: 'تطبيق Android (node): دليل تشغيل الاتصال + سطح أوامر الاتصال/الدردشة/الصوت/اللوحة'
title: تطبيق Android
x-i18n:
    generated_at: "2026-05-06T08:03:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: cce53df4675e01858ced3d58142512ad096ced0ef50cd617e57b65f9cf911c05
    source_path: platforms/android.md
    workflow: 16
---

<Note>
لم يُصدر تطبيق Android علنًا بعد. يتوفر رمز المصدر في [مستودع OpenClaw](https://github.com/openclaw/openclaw) ضمن `apps/android`. يمكنك بناؤه بنفسك باستخدام Java 17 وAndroid SDK (`./gradlew :app:assemblePlayDebug`). راجع [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) للحصول على تعليمات البناء.
</Note>

## لقطة الدعم

- الدور: تطبيق Node مصاحب (لا يستضيف Android الـ Gateway).
- Gateway مطلوب: نعم (شغّله على macOS أو Linux أو Windows عبر WSL2).
- التثبيت: [بدء الاستخدام](/ar/start/getting-started) + [الإقران](/ar/channels/pairing).
- Gateway: [دليل التشغيل](/ar/gateway) + [الإعداد](/ar/gateway/configuration).
  - البروتوكولات: [بروتوكول Gateway](/ar/gateway/protocol) (Nodes + مستوى التحكم).

## التحكم في النظام

يوجد التحكم في النظام (launchd/systemd) على مضيف Gateway. راجع [Gateway](/ar/gateway).

## دليل تشغيل الاتصال

تطبيق Android Node ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

يتصل Android مباشرةً بـ WebSocket الخاص بالـ Gateway ويستخدم إقران الجهاز (`role: node`).

بالنسبة إلى Tailscale أو المضيفين العامين، يتطلب Android نقطة نهاية آمنة:

- المفضّل: Tailscale Serve / Funnel مع `https://<magicdns>` / `wss://<magicdns>`
- مدعوم أيضًا: أي عنوان URL آخر للـ Gateway بصيغة `wss://` مع نقطة نهاية TLS حقيقية
- يبقى النص الصريح `ws://` مدعومًا على عناوين LAN الخاصة / مضيفي `.local`، إضافةً إلى `localhost` و`127.0.0.1` وجسر محاكي Android (`10.0.2.2`)

### المتطلبات المسبقة

- يمكنك تشغيل الـ Gateway على الجهاز "الرئيسي".
- يمكن لجهاز/محاكي Android الوصول إلى WebSocket الخاص بالـ Gateway:
  - نفس LAN مع mDNS/NSD، **أو**
  - نفس شبكة Tailscale tailnet باستخدام Wide-Area Bonjour / unicast DNS-SD (انظر أدناه)، **أو**
  - مضيف/منفذ Gateway يدوي (خيار احتياطي)
- لا يستخدم إقران الهاتف المحمول عبر tailnet/العامة نقاط نهاية IP خامة لـ tailnet بصيغة `ws://`. استخدم Tailscale Serve أو عنوان URL آخر بصيغة `wss://` بدلًا من ذلك.
- يمكنك تشغيل الـ CLI (`openclaw`) على جهاز الـ Gateway (أو عبر SSH).

### 1) بدء الـ Gateway

```bash
openclaw gateway --port 18789 --verbose
```

تأكد من أنك ترى في السجلات شيئًا مثل:

- `listening on ws://0.0.0.0:18789`

للوصول إلى Android عن بُعد عبر Tailscale، يُفضّل استخدام Serve/Funnel بدلًا من ربط tailnet خام:

```bash
openclaw gateway --tailscale serve
```

يمنح هذا Android نقطة نهاية آمنة بصيغة `wss://` / `https://`. إعداد `gateway.bind: "tailnet"` العادي لا يكفي لإقران Android عن بُعد لأول مرة إلا إذا أنهيت TLS بشكل منفصل أيضًا.

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

يعرض ذلك `local.` إضافةً إلى النطاق واسع النطاق المُعدّ في تمريرة واحدة ويستخدم نقطة نهاية الخدمة المحلولة بدلًا من تلميحات TXT فقط.

#### اكتشاف Tailnet (فيينا ⇄ لندن) عبر unicast DNS-SD

لن يعبر اكتشاف Android NSD/mDNS الشبكات. إذا كان Android Node والـ Gateway على شبكات مختلفة لكنهما متصلان عبر Tailscale، فاستخدم Wide-Area Bonjour / unicast DNS-SD بدلًا من ذلك.

الاكتشاف وحده لا يكفي لإقران Android عبر tailnet/العامة. لا يزال المسار المكتشف يحتاج إلى نقطة نهاية آمنة (`wss://` أو Tailscale Serve):

1. أعدّ منطقة DNS-SD (مثال `openclaw.internal.`) على مضيف الـ Gateway وانشر سجلات `_openclaw-gw._tcp`.
2. اضبط Tailscale split DNS لنطاقك المختار بحيث يشير إلى خادم DNS ذلك.

التفاصيل ومثال إعداد CoreDNS: [Bonjour](/ar/gateway/bonjour).

### 3) الاتصال من Android

في تطبيق Android:

- يبقي التطبيق اتصال Gateway حيًا عبر **خدمة أمامية** (إشعار دائم).
- افتح علامة تبويب **الاتصال**.
- استخدم وضع **رمز الإعداد** أو **يدوي**.
- إذا كان الاكتشاف محظورًا، فاستخدم المضيف/المنفذ اليدوي في **عناصر التحكم المتقدمة**. بالنسبة إلى مضيفي LAN الخاصة، لا يزال `ws://` يعمل. بالنسبة إلى مضيفي Tailscale/العامة، فعّل TLS واستخدم نقطة نهاية `wss://` / Tailscale Serve.

بعد أول إقران ناجح، يعيد Android الاتصال تلقائيًا عند التشغيل:

- نقطة النهاية اليدوية (إذا كانت مفعّلة)، وإلا
- آخر Gateway مكتشف (بأفضل جهد).

### إشارات إبقاء الحضور حيًا

بعد اتصال جلسة Node الموثقة، وعندما ينتقل التطبيق إلى الخلفية بينما لا تزال الخدمة الأمامية متصلة، يستدعي Android `node.event` مع
`event: "node.presence.alive"`. يسجل الـ Gateway ذلك كـ `lastSeenAtMs`/`lastSeenReason` في بيانات تعريف الـ Node/الجهاز المقترن فقط بعد معرفة هوية جهاز Node الموثق.

يعدّ التطبيق الإشارة مسجلة بنجاح فقط عندما تتضمن استجابة الـ Gateway
`handled: true`. قد تقر الـ Gateways الأقدم `node.event` باستخدام `{ "ok": true }`؛ هذه الاستجابة متوافقة لكنها لا تُحتسب كتحديث دائم لآخر ظهور.

### 4) الموافقة على الإقران (CLI)

على جهاز الـ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

تفاصيل الإقران: [الإقران](/ar/channels/pairing).

اختياري: إذا كان Android Node يتصل دائمًا من شبكة فرعية مضبوطة بإحكام،
يمكنك الاشتراك في الموافقة التلقائية على Node لأول مرة باستخدام CIDRs صريحة أو عناوين IP دقيقة:

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

هذا معطّل افتراضيًا. ينطبق فقط على إقران `role: node` جديد بلا نطاقات مطلوبة. لا يزال إقران المشغّل/المتصفح وأي تغيير في الدور أو النطاق أو البيانات الوصفية أو المفتاح العام يتطلب موافقة يدوية.

### 5) التحقق من أن الـ Node متصل

- عبر حالة Nodes:

  ```bash
  openclaw nodes status
  ```

- عبر Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) الدردشة + السجل

تدعم علامة تبويب الدردشة في Android اختيار الجلسة (الافتراضية `main`، إضافةً إلى الجلسات الموجودة الأخرى):

- السجل: `chat.history` (مطبّع للعرض؛ تُزال وسوم التوجيه المضمنة
  من النص المرئي، وتُزال حمولات XML لاستدعاءات الأدوات ذات النص العادي (بما في ذلك
  `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و
  `<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>` و
  كتل استدعاء الأدوات المقتطعة) ورموز التحكم في النموذج ASCII/كاملة العرض المتسربة،
  وتُحذف صفوف المساعد التي تحتوي على رموز صامتة فقط مثل `NO_REPLY` /
  `no_reply` بالضبط، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة)
- الإرسال: `chat.send`
- تحديثات الدفع (بأفضل جهد): `chat.subscribe` → `event:"chat"`

### 7) Canvas + الكاميرا

#### مضيف Gateway Canvas (موصى به لمحتوى الويب)

إذا كنت تريد أن يعرض الـ Node HTML/CSS/JS حقيقيًا يمكن للوكيل تعديله على القرص، فوجّه الـ Node إلى مضيف Gateway Canvas.

<Note>
تحمّل Nodes الـ Canvas من خادم HTTP الخاص بالـ Gateway (نفس منفذ `gateway.port`، الافتراضي `18789`).
</Note>

1. أنشئ `~/.openclaw/workspace/canvas/index.html` على مضيف الـ Gateway.

2. انتقل بالـ Node إليه (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (اختياري): إذا كان كلا الجهازين على Tailscale، فاستخدم اسم MagicDNS أو IP الخاص بـ tailnet بدلًا من `.local`، مثل `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

يحقن هذا الخادم عميل إعادة تحميل مباشرة في HTML ويعيد التحميل عند تغيّر الملفات.
يوجد مضيف A2UI على `http://<gateway-host>:18789/__openclaw__/a2ui/`.

أوامر Canvas (في المقدمة فقط):

- `canvas.eval` و`canvas.snapshot` و`canvas.navigate` (استخدم `{"url":""}` أو `{"url":"/"}` للعودة إلى الهيكل الافتراضي). يعيد `canvas.snapshot` القيمة `{ format, base64 }` (القيمة الافتراضية `format="jpeg"`).
- A2UI: `canvas.a2ui.push` و`canvas.a2ui.reset` (الاسم المستعار القديم `canvas.a2ui.pushJSONL`)

أوامر الكاميرا (في المقدمة فقط؛ محكومة بالإذن):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

راجع [Camera node](/ar/nodes/camera) للمعلمات ومساعدات CLI.

### 8) الصوت + سطح أوامر Android الموسع

- علامة تبويب الصوت: لدى Android وضعا التقاط صريحان. **Mic** هو جلسة يدوية في علامة تبويب الصوت ترسل كل توقف مؤقت كدور دردشة وتتوقف عندما يغادر التطبيق المقدمة أو يغادر المستخدم علامة تبويب الصوت. **Talk** هو وضع Talk Mode مستمر ويواصل الاستماع حتى يتم إيقافه أو ينقطع اتصال الـ Node.
- يرقّي Talk Mode الخدمة الأمامية الحالية من `dataSync` إلى `dataSync|microphone` قبل بدء الالتقاط، ثم يخفضها عند توقف Talk Mode. يتطلب Android 14+ تصريح `FOREGROUND_SERVICE_MICROPHONE`، ومنح وقت التشغيل `RECORD_AUDIO`، ونوع خدمة الميكروفون وقت التشغيل.
- تستخدم الردود المنطوقة `talk.speak` عبر موفر Talk المُعدّ في الـ Gateway. لا يُستخدم TTS المحلي للنظام إلا عندما لا يكون `talk.speak` متاحًا.
- يبقى إيقاظ الصوت معطّلًا في تجربة مستخدم Android ووقت التشغيل.
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
Assistant). عند إعداده، يؤدي الضغط المطول على زر الصفحة الرئيسية أو قول "Hey Google, ask
OpenClaw..." إلى فتح التطبيق وتمرير الطلب إلى محرر الدردشة.

يستخدم هذا بيانات Android **App Actions** الوصفية المعلنة في بيان التطبيق. لا حاجة إلى إعداد إضافي على جانب الـ Gateway، إذ يتولى تطبيق Android بالكامل معالجة نية المساعد ويمررها كرسالة دردشة عادية.

<Note>
يعتمد توفر App Actions على الجهاز، وإصدار Google Play Services،
وما إذا كان المستخدم قد عيّن OpenClaw كتطبيق المساعد الافتراضي.
</Note>

## إعادة توجيه الإشعارات

يمكن لـ Android إعادة توجيه إشعارات الجهاز إلى الـ Gateway كأحداث. تتيح لك عدة عناصر تحكم تحديد نطاق الإشعارات التي تُعاد توجيهها ومتى.

| المفتاح                          | النوع          | الوصف                                                                                             |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | لا تُعد توجيه الإشعارات إلا من أسماء الحزم هذه. إذا ضُبط، يتم تجاهل جميع الحزم الأخرى.          |
| `notifications.denyPackages`     | string[]       | لا تُعد توجيه الإشعارات من أسماء الحزم هذه أبدًا. يُطبّق بعد `allowPackages`.                    |
| `notifications.quietHours.start` | string (HH:mm) | بداية نافذة ساعات الهدوء (وقت الجهاز المحلي). تُكتم الإشعارات خلال هذه النافذة.                 |
| `notifications.quietHours.end`   | string (HH:mm) | نهاية نافذة ساعات الهدوء.                                                                        |
| `notifications.rateLimit`        | number         | الحد الأقصى للإشعارات المعاد توجيهها لكل حزمة في الدقيقة. تُسقط الإشعارات الزائدة.              |

يستخدم منتقي الإشعارات أيضًا سلوكًا أكثر أمانًا لأحداث الإشعارات المعاد توجيهها، مما يمنع إعادة التوجيه العرضية لإشعارات النظام الحساسة.

مثال إعداد:

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
- [Nodes](/ar/nodes)
- [استكشاف أخطاء Android Node وإصلاحها](/ar/nodes/troubleshooting)
