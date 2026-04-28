---
read_when:
    - إقران أو إعادة توصيل Android Node
    - تصحيح اكتشاف Android Gateway أو المصادقة
    - التحقق من تكافؤ سجل الدردشة عبر العملاء
summary: 'تطبيق Android (node): دليل تشغيل الاتصال + سطح أوامر Connect/Chat/Voice/Canvas'
title: تطبيق Android (Node)
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:35:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a47c07e3301ad7b98f4827c9c34c42b7ba2f92c55aabd7b49606ab688191b66
    source_path: platforms/android.md
    workflow: 15
---

> **ملاحظة:** لم يتم إصدار تطبيق Android للعامة بعد. الشيفرة المصدرية متاحة في [مستودع OpenClaw](https://github.com/openclaw/openclaw) ضمن `apps/android`. يمكنك بناؤه بنفسك باستخدام Java 17 وAndroid SDK عبر (`./gradlew :app:assemblePlayDebug`). راجع [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) للحصول على تعليمات البناء.

## لمحة عن الدعم

- الدور: تطبيق Node مرافق (Android لا يستضيف Gateway).
- Gateway مطلوب: نعم (شغّله على macOS أو Linux أو Windows عبر WSL2).
- التثبيت: [Getting Started](/ar/start/getting-started) + [Pairing](/ar/channels/pairing).
- Gateway: [Runbook](/ar/gateway) + [Configuration](/ar/gateway/configuration).
  - البروتوكولات: [Gateway protocol](/ar/gateway/protocol) (العُقد + مستوى التحكم).

## التحكم في النظام

يوجد التحكم في النظام (launchd/systemd) على مضيف Gateway. راجع [Gateway](/ar/gateway).

## دليل تشغيل الاتصال

تطبيق Android Node ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

يتصل Android مباشرةً بـ Gateway WebSocket ويستخدم إقران الأجهزة (`role: node`).

بالنسبة إلى Tailscale أو المضيفات العامة، يتطلب Android نقطة نهاية آمنة:

- المفضّل: Tailscale Serve / Funnel عبر `https://<magicdns>` / `wss://<magicdns>`
- المدعوم أيضًا: أي عنوان URL آخر لـ Gateway من نوع `wss://` مع نقطة نهاية TLS حقيقية
- ما يزال `ws://` غير المشفر مدعومًا على عناوين LAN الخاصة / مضيفات `.local`، بالإضافة إلى `localhost` و`127.0.0.1` وجسر محاكي Android (`10.0.2.2`)

### المتطلبات الأساسية

- يمكنك تشغيل Gateway على الجهاز “الرئيسي”.
- يستطيع جهاز/محاكي Android الوصول إلى Gateway WebSocket:
  - على شبكة LAN نفسها مع mDNS/NSD، **أو**
  - على Tailnet نفسها باستخدام Wide-Area Bonjour / unicast DNS-SD (انظر أدناه)، **أو**
  - مضيف/منفذ Gateway يدويًا (حل احتياطي)
- لا يستخدم إقران Android المحمول عبر Tailnet/المضيفات العامة نقاط نهاية raw tailnet IP من نوع `ws://`. استخدم Tailscale Serve أو عنوان URL آخر من نوع `wss://` بدلًا من ذلك.
- يمكنك تشغيل CLI (`openclaw`) على جهاز gateway (أو عبر SSH).

### 1) ابدأ Gateway

```bash
openclaw gateway --port 18789 --verbose
```

أكد في السجلات أنك ترى شيئًا مثل:

- `listening on ws://0.0.0.0:18789`

للوصول البعيد من Android عبر Tailscale، فضّل Serve/Funnel بدلًا من raw tailnet bind:

```bash
openclaw gateway --tailscale serve
```

يعطي ذلك Android نقطة نهاية آمنة من نوع `wss://` / `https://`. لا يكفي الإعداد العادي `gateway.bind: "tailnet"` لأول إقران بعيد لـ Android إلا إذا أنهيت TLS بشكل منفصل أيضًا.

### 2) تحقّق من الاكتشاف (اختياري)

من جهاز gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

مزيد من ملاحظات التصحيح: [Bonjour](/ar/gateway/bonjour).

إذا كنت قد هيّأت أيضًا نطاق اكتشاف واسع النطاق، فقارن مع:

```bash
openclaw gateway discover --json
```

يعرض ذلك `local.` بالإضافة إلى النطاق واسع النطاق المكوَّن في مرور واحد ويستخدم
نقطة نهاية الخدمة المحلولة بدلًا من تلميحات TXT فقط.

#### اكتشاف Tailnet ‏(Vienna ⇄ London) عبر unicast DNS-SD

لن يعبر اكتشاف Android NSD/mDNS الشبكات. وإذا كانت Android Node وgateway على شبكتين مختلفتين لكنهما متصلتان عبر Tailscale، فاستخدم Wide-Area Bonjour / unicast DNS-SD بدلًا من ذلك.

لا يكفي الاكتشاف وحده لإقران Android عبر tailnet/المضيفات العامة. فما يزال المسار المكتشف يحتاج إلى نقطة نهاية آمنة (`wss://` أو Tailscale Serve):

1. اضبط منطقة DNS-SD (مثل `openclaw.internal.`) على مضيف gateway وانشر سجلات `_openclaw-gw._tcp`.
2. اضبط Tailscale split DNS للنطاق الذي اخترته بحيث يشير إلى خادم DNS ذلك.

التفاصيل ومثال إعداد CoreDNS: [Bonjour](/ar/gateway/bonjour).

### 3) اتصل من Android

في تطبيق Android:

- يُبقي التطبيق اتصال gateway حيًا عبر **foreground service** (إشعار دائم).
- افتح تبويب **Connect**.
- استخدم وضع **Setup Code** أو **Manual**.
- إذا كان الاكتشاف محجوبًا، فاستخدم المضيف/المنفذ يدويًا في **Advanced controls**. بالنسبة إلى مضيفات LAN الخاصة، ما يزال `ws://` يعمل. أما بالنسبة إلى مضيفات Tailscale/العامة، ففعّل TLS واستخدم نقطة نهاية `wss://` / Tailscale Serve.

بعد أول إقران ناجح، يعيد Android الاتصال تلقائيًا عند التشغيل:

- نقطة النهاية اليدوية (إذا كانت مفعّلة)، وإلا
- آخر Gateway تم اكتشافها (best-effort).

### 4) وافق على الإقران (CLI)

على جهاز gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

تفاصيل الإقران: [Pairing](/ar/channels/pairing).

اختياري: إذا كانت Android Node تتصل دائمًا من شبكة فرعية محكومة بإحكام،
فيمكنك تمكين الموافقة التلقائية لأول إقران للعقدة باستخدام CIDRs صريحة أو عناوين IP مطابقة تمامًا:

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

هذا معطّل افتراضيًا. وينطبق فقط على إقران جديد من نوع `role: node` مع
عدم وجود نطاقات مطلوبة. أما إقران المشغّل/المتصفح وأي تغيير في الدور أو النطاق أو البيانات الوصفية أو
المفتاح العام فيظل يتطلب موافقة يدوية.

### 5) تحقّق من أن العقدة متصلة

- عبر حالة العُقد:

  ```bash
  openclaw nodes status
  ```

- عبر Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) الدردشة + السجل

يدعم تبويب Chat في Android اختيار الجلسة (الافتراضي `main`، بالإضافة إلى الجلسات الموجودة الأخرى):

- السجل: `chat.history` (مطبّع للعرض؛ تتم إزالة وسوم التوجيه المضمنة
  من النص المرئي، كما تتم إزالة حمولات XML النصية العادية الخاصة باستدعاءات الأدوات (بما في ذلك
  `<tool_call>...</tool_call>` و`<function_call>...</function_call>`,
  و`<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>` و
  كتل استدعاء الأدوات المقتطعة) ورموز تحكم النموذج المتسربة بنمط ASCII/العرض الكامل،
  ويتم حذف صفوف المساعد التي تحتوي فقط على رموز صامتة بحتة مثل `NO_REPLY` /
  `no_reply` تمامًا، ويمكن استبدال الصفوف الكبيرة جدًا بعناصر نائبة)
- الإرسال: `chat.send`
- تحديثات الدفع (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + الكاميرا

#### Gateway Canvas Host ‏(موصى به لمحتوى الويب)

إذا كنت تريد أن تعرض العقدة HTML/CSS/JS حقيقيًا يمكن للوكيل تعديله على القرص، فوجّه العقدة إلى Gateway canvas host.

ملاحظة: تقوم العُقد بتحميل canvas من خادم Gateway HTTP (المنفذ نفسه الخاص بـ `gateway.port`، والافتراضي `18789`).

1. أنشئ الملف `~/.openclaw/workspace/canvas/index.html` على مضيف gateway.

2. وجّه العقدة إليه (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (اختياري): إذا كان كلا الجهازين على Tailscale، فاستخدم اسم MagicDNS أو tailnet IP بدل `.local`، مثل `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

يقوم هذا الخادم بحقن عميل live-reload داخل HTML ويعيد التحميل عند تغيّر الملفات.
يعيش مضيف A2UI على `http://<gateway-host>:18789/__openclaw__/a2ui/`.

أوامر Canvas ‏(في الواجهة الأمامية فقط):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (استخدم `{"url":""}` أو `{"url":"/"}` للعودة إلى scaffold الافتراضي). يعيد `canvas.snapshot` القيمة `{ format, base64 }` (الافتراضي `format="jpeg"`).
- A2UI: ‏`canvas.a2ui.push`, `canvas.a2ui.reset` (الاسم المستعار القديم `canvas.a2ui.pushJSONL`)

أوامر الكاميرا (في الواجهة الأمامية فقط؛ محكومة بالأذونات):

- `camera.snap` ‏(jpg)
- `camera.clip` ‏(mp4)

راجع [Camera node](/ar/nodes/camera) للاطلاع على المعلمات ومساعدات CLI.

### 8) الصوت + سطح أوامر Android الموسّع

- تبويب Voice: يحتوي Android على وضعَي التقاط صريحين. **Mic** هو جلسة يدوية ضمن تبويب Voice ترسل كل توقف على أنه دور دردشة وتتوقف عندما يغادر التطبيق الواجهة الأمامية أو يغادر المستخدم تبويب Voice. أما **Talk** فهو Talk Mode مستمر ويواصل الاستماع حتى يتم إيقافه أو تنفصل العقدة.
- يقوم Talk Mode بترقية foreground service الحالية من `dataSync` إلى `dataSync|microphone` قبل بدء الالتقاط، ثم يُرجعها عند توقف Talk Mode. يتطلب Android 14+ تصريح `FOREGROUND_SERVICE_MICROPHONE`، ومنح `RECORD_AUDIO` وقت التشغيل، ونوع خدمة الميكروفون وقت التشغيل.
- تستخدم الردود المنطوقة `talk.speak` عبر Talk provider المكوَّن في gateway. ولا يُستخدم TTS المحلي في النظام إلا عندما يكون `talk.speak` غير متاح.
- يظل التنبيه الصوتي wake معطّلًا في واجهة/وقت تشغيل Android.
- عائلات أوامر Android الإضافية (يعتمد توفرها على الجهاز + الأذونات):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (راجع [Notification forwarding](#notification-forwarding) أدناه)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## نقاط دخول المساعد

يدعم Android تشغيل OpenClaw من مُشغِّل مساعد النظام (Google
Assistant). وعند ضبطه، يؤدي الضغط المطوّل على زر الصفحة الرئيسية أو قول "Hey Google, ask
OpenClaw..." إلى فتح التطبيق وتمرير prompt إلى مؤلف الدردشة.

يستخدم هذا بيانات Android **App Actions** الوصفية المعلنة في manifest التطبيق. ولا حاجة إلى
أي إعداد إضافي من جهة gateway — إذ تتم معالجة نية المساعد بالكامل بواسطة
تطبيق Android وتمريرها كرسالة دردشة عادية.

<Note>
يعتمد توفر App Actions على الجهاز، وإصدار Google Play Services،
وعلى ما إذا كان المستخدم قد ضبط OpenClaw كتطبيق المساعد الافتراضي.
</Note>

## إعادة توجيه الإشعارات

يمكن لـ Android إعادة توجيه إشعارات الجهاز إلى gateway كأحداث. وتتيح لك عدة عناصر تحكم تحديد نطاق الإشعارات التي يُعاد توجيهها ومتى.

| المفتاح                              | النوع           | الوصف                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | `string[]`       | أعد توجيه الإشعارات من أسماء الحزم هذه فقط. إذا تم ضبطه، فسيتم تجاهل كل الحزم الأخرى.      |
| `notifications.denyPackages`     | `string[]`       | لا تُعد توجيه الإشعارات من أسماء الحزم هذه أبدًا. يُطبَّق بعد `allowPackages`.              |
| `notifications.quietHours.start` | `string (HH:mm)` | بداية نافذة الساعات الهادئة (بالتوقيت المحلي للجهاز). تُحجب الإشعارات خلال هذه النافذة. |
| `notifications.quietHours.end`   | `string (HH:mm)` | نهاية نافذة الساعات الهادئة.                                                                        |
| `notifications.rateLimit`        | `number`         | الحد الأقصى لعدد الإشعارات المعاد توجيهها لكل حزمة في الدقيقة. تُسقط الإشعارات الزائدة.         |

كما يستخدم منتقي الإشعارات سلوكًا أكثر أمانًا لأحداث الإشعارات المعاد توجيهها، ما يمنع إعادة التوجيه غير المقصودة لإشعارات النظام الحساسة.

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
يتطلب إعادة توجيه الإشعارات إذن Android Notification Listener. يطلب التطبيق هذا أثناء الإعداد.
</Note>

## ذو صلة

- [iOS app](/ar/platforms/ios)
- [Nodes](/ar/nodes)
- [Android node troubleshooting](/ar/nodes/troubleshooting)
