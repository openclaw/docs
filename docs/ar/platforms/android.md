---
read_when:
    - إقران Node على Android أو إعادة توصيلها
    - تصحيح أخطاء اكتشاف gateway أو المصادقة على Android
    - التحقق من تطابق سجل الدردشة عبر العملاء المختلفين
summary: 'تطبيق Android ‏(node): دليل تشغيل الاتصال + سطح أوامر Connect/Chat/Voice/Canvas'
title: تطبيق Android
x-i18n:
    generated_at: "2026-04-24T07:51:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31b538a5bf45e78fde34e77a31384295b3e96f2fff6b3adfe37e5c569d858472
    source_path: platforms/android.md
    workflow: 15
---

> **ملاحظة:** لم يتم إصدار تطبيق Android للعامة بعد. الشيفرة المصدرية متاحة في [مستودع OpenClaw](https://github.com/openclaw/openclaw) تحت `apps/android`. يمكنك بناءه بنفسك باستخدام Java 17 وAndroid SDK ‏(`./gradlew :app:assemblePlayDebug`). راجع [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) للحصول على تعليمات البناء.

## لمحة عن الدعم

- الدور: تطبيق node مرافق (لا يستضيف Android الـ Gateway).
- Gateway مطلوبة: نعم (شغّلها على macOS أو Linux أو Windows عبر WSL2).
- التثبيت: [البدء](/ar/start/getting-started) + [الاقتران](/ar/channels/pairing).
- Gateway: [دليل التشغيل](/ar/gateway) + [الإعداد](/ar/gateway/configuration).
  - البروتوكولات: [بروتوكول Gateway](/ar/gateway/protocol) ‏(nodes + طبقة التحكم).

## التحكم بالنظام

يوجد التحكم بالنظام (`launchd/systemd`) على مضيف Gateway. راجع [Gateway](/ar/gateway).

## دليل تشغيل الاتصال

تطبيق Android node ⇄ ‏(mDNS/NSD + WebSocket) ⇄ **Gateway**

يتصل Android مباشرة بـ Gateway WebSocket ويستخدم اقتران الجهاز (`role: node`).

بالنسبة إلى Tailscale أو المضيفات العامة، يتطلب Android نقطة نهاية آمنة:

- المفضل: Tailscale Serve / Funnel مع `https://<magicdns>` / `wss://<magicdns>`
- مدعوم أيضًا: أي عنوان URL آخر لـ Gateway باستخدام `wss://` مع نقطة نهاية TLS حقيقية
- يظل `ws://` النصي الصريح مدعومًا على عناوين LAN الخاصة / مضيفات `.local`، بالإضافة إلى `localhost` و`127.0.0.1` وجسر محاكي Android ‏(`10.0.2.2`)

### المتطلبات الأساسية

- يمكنك تشغيل Gateway على الجهاز "الأساسي".
- يمكن لجهاز/محاكي Android الوصول إلى Gateway WebSocket:
  - على شبكة LAN نفسها مع mDNS/NSD، **أو**
  - على Tailscale tailnet نفسها باستخدام Wide-Area Bonjour / unicast DNS-SD ‏(انظر أدناه)، **أو**
  - مضيف/منفذ Gateway يدويًا (احتياطي)
- لا يستخدم اقتران Android عبر tailnet/العامة نقاط نهاية `ws://` الخام لعناوين tailnet IP. استخدم Tailscale Serve أو عنوان `wss://` آخر بدلًا من ذلك.
- يمكنك تشغيل CLI ‏(`openclaw`) على جهاز gateway (أو عبر SSH).

### 1) ابدأ Gateway

```bash
openclaw gateway --port 18789 --verbose
```

أكد في السجلات أنك ترى شيئًا مثل:

- `listening on ws://0.0.0.0:18789`

للوصول البعيد من Android عبر Tailscale، فضّل Serve/Funnel بدلًا من ربط tailnet خام:

```bash
openclaw gateway --tailscale serve
```

يمنح هذا Android نقطة نهاية آمنة `wss://` / `https://`. ولا يكفي إعداد `gateway.bind: "tailnet"` العادي للاقتران البعيد الأول على Android ما لم تُنهِ TLS بشكل منفصل أيضًا.

### 2) تحقّق من الاكتشاف (اختياري)

من جهاز gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

ملاحظات تصحيح إضافية: [Bonjour](/ar/gateway/bonjour).

إذا كنت قد أعددت أيضًا نطاق اكتشاف واسع، فقارن مع:

```bash
openclaw gateway discover --json
```

يعرض هذا `local.` بالإضافة إلى النطاق الواسع المضبوط في تمريرة واحدة ويستخدم
نقطة نهاية الخدمة المحلولة بدلًا من التلميحات المعتمدة على TXT فقط.

#### اكتشاف tailnet ‏(فيينا ⇄ لندن) عبر unicast DNS-SD

لن يعبر اكتشاف Android NSD/mDNS الشبكات. إذا كانت Android node والـ gateway على شبكتين مختلفتين لكنهما متصلتان عبر Tailscale، فاستخدم Wide-Area Bonjour / unicast DNS-SD بدلًا من ذلك.

لا يكفي الاكتشاف وحده لاقتران Android عبر tailnet/العامة. فلا يزال المسار المكتشف يحتاج إلى نقطة نهاية آمنة (`wss://` أو Tailscale Serve):

1. أعد إعداد منطقة DNS-SD ‏(مثل `openclaw.internal.`) على جهاز gateway وانشر سجلات `_openclaw-gw._tcp`.
2. اضبط Tailscale split DNS للنطاق الذي اخترته بحيث يشير إلى خادم DNS ذاك.

التفاصيل ومثال إعداد CoreDNS: [Bonjour](/ar/gateway/bonjour).

### 3) اتصل من Android

في تطبيق Android:

- يحافظ التطبيق على اتصال gateway حيًا عبر **خدمة foreground** ‏(إشعار دائم).
- افتح تبويب **Connect**.
- استخدم وضع **Setup Code** أو **Manual**.
- إذا كان الاكتشاف محظورًا، فاستخدم المضيف/المنفذ يدويًا في **Advanced controls**. بالنسبة إلى مضيفات LAN الخاصة، لا يزال `ws://` يعمل. أما بالنسبة إلى مضيفات Tailscale/العامة، ففعّل TLS واستخدم نقطة نهاية `wss://` / Tailscale Serve.

بعد أول اقتران ناجح، يعيد Android الاتصال تلقائيًا عند التشغيل:

- نقطة نهاية يدوية (إذا كانت مفعلة)، وإلا
- آخر Gateway مكتشفة (بأفضل جهد).

### 4) وافق على الاقتران (CLI)

على جهاز gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

تفاصيل الاقتران: [الاقتران](/ar/channels/pairing).

### 5) تحقّق من أن node متصلة

- عبر حالة nodes:

  ```bash
  openclaw nodes status
  ```

- عبر Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) الدردشة + السجل

يدعم تبويب Chat في Android اختيار الجلسة (الافتراضية `main`، بالإضافة إلى الجلسات الموجودة الأخرى):

- السجل: `chat.history` ‏(مطبع للعرض؛ تتم إزالة وسوم التوجيه المضمنة من النص المرئي، كما تتم إزالة حمولات XML النصية العادية الخاصة باستدعاءات الأدوات (بما في ذلك
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`,
  وكتل استدعاء الأدوات المبتورة) وعناصر التحكم الخاصة بالنموذج المتسربة بصيغة ASCII/العرض الكامل،
  كما تُحذف صفوف المساعد الصامتة البحتة مثل `NO_REPLY` / `no_reply` المطابقة تمامًا،
  ويمكن استبدال الصفوف الكبيرة جدًا بعناصر نائبة)
- الإرسال: `chat.send`
- تحديثات الدفع (بأفضل جهد): `chat.subscribe` → `event:"chat"`

### 7) Canvas + الكاميرا

#### Gateway Canvas Host ‏(موصى به لمحتوى الويب)

إذا كنت تريد أن تعرض node محتوى HTML/CSS/JS حقيقيًا يمكن للوكيل تحريره على القرص، فوجه node إلى Gateway canvas host.

ملاحظة: تقوم nodes بتحميل canvas من خادم Gateway HTTP ‏(المنفذ نفسه لـ `gateway.port`، والافتراضي `18789`).

1. أنشئ `~/.openclaw/workspace/canvas/index.html` على جهاز gateway.

2. وجّه node إليه (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

tailnet ‏(اختياري): إذا كان كلا الجهازين على Tailscale، فاستخدم اسم MagicDNS أو عنوان tailnet IP بدلًا من `.local`، مثل `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

يقوم هذا الخادم بحقن عميل إعادة تحميل مباشر في HTML ويعيد التحميل عند تغيّر الملفات.
يوجد مضيف A2UI عند `http://<gateway-host>:18789/__openclaw__/a2ui/`.

أوامر Canvas ‏(foreground فقط):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` ‏(استخدم `{"url":""}` أو `{"url":"/"}` للعودة إلى الهيكل الافتراضي). يعيد `canvas.snapshot` القيمة `{ format, base64 }` ‏(الافتراضي `format="jpeg"`).
- A2UI: ‏`canvas.a2ui.push`, `canvas.a2ui.reset` ‏(`canvas.a2ui.pushJSONL` اسم مستعار قديم)

أوامر الكاميرا (foreground فقط؛ ومقيدة بالأذونات):

- `camera.snap` ‏(jpg)
- `camera.clip` ‏(mp4)

راجع [Camera node](/ar/nodes/camera) للحصول على المعلمات ومساعدات CLI.

### 8) Voice + سطح أوامر Android الموسّع

- الصوت: يستخدم Android تدفق تشغيل/إيقاف واحدًا للميكروفون في تبويب Voice مع التقاط النص المفرغ وتشغيل `talk.speak`. ويُستخدم TTS النظام المحلي فقط عندما لا تكون `talk.speak` متاحة. ويتوقف الصوت عندما يغادر التطبيق الواجهة الأمامية.
- تمت إزالة مفاتيح تبديل Voice wake/talk-mode حاليًا من واجهة وتجهيز Android.
- عائلات أوامر Android الإضافية (يتوقف توفرها على الجهاز + الأذونات):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` ‏(راجع [إعادة توجيه الإشعارات](#notification-forwarding) أدناه)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## نقاط دخول المساعد

يدعم Android تشغيل OpenClaw من مشغل المساعد في النظام (Google
Assistant). وعند الضبط، يؤدي الضغط المطول على زر الصفحة الرئيسية أو قول "Hey Google, ask
OpenClaw..." إلى فتح التطبيق وتمرير المطالبة إلى محرر الدردشة.

يستخدم هذا بيانات **App Actions** الوصفية المعلنة في ملف manifest الخاص بالتطبيق. ولا
يلزم أي إعداد إضافي من جهة gateway — إذ يتم التعامل مع نية المساعد بالكامل
داخل تطبيق Android وتمريرها كرسالة دردشة عادية.

<Note>
يتوقف توفر App Actions على الجهاز، وإصدار Google Play Services،
وعلى ما إذا كان المستخدم قد ضبط OpenClaw بوصفه تطبيق المساعد الافتراضي.
</Note>

## إعادة توجيه الإشعارات

يمكن لـ Android إعادة توجيه إشعارات الجهاز إلى gateway كأحداث. وتسمح لك عدة عناصر تحكم بتحديد نطاق الإشعارات التي تُعاد توجيهها ومتى.

| المفتاح                         | النوع          | الوصف                                                                                       |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`   | string[]       | أعد توجيه الإشعارات فقط من أسماء هذه الحزم. وإذا تم ضبطه، فسيتم تجاهل جميع الحزم الأخرى.    |
| `notifications.denyPackages`    | string[]       | لا تُعد توجيه الإشعارات مطلقًا من أسماء هذه الحزم. ويُطبّق بعد `allowPackages`.            |
| `notifications.quietHours.start` | string (HH:mm) | بداية نافذة الساعات الهادئة (بالتوقيت المحلي للجهاز). يتم كبت الإشعارات خلال هذه النافذة. |
| `notifications.quietHours.end`  | string (HH:mm) | نهاية نافذة الساعات الهادئة.                                                                |
| `notifications.rateLimit`       | number         | الحد الأقصى للإشعارات المُعادة توجيهها لكل حزمة في الدقيقة. ويتم إسقاط الإشعارات الزائدة.   |

يستخدم منتقي الإشعارات أيضًا سلوكًا أكثر أمانًا لأحداث الإشعارات المُعادة توجيهها، مما يمنع إعادة توجيه الإشعارات النظامية الحساسة عن طريق الخطأ.

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
يتطلب إعادة توجيه الإشعارات إذن Android Notification Listener. ويطلب التطبيق ذلك أثناء الإعداد.
</Note>

## ذو صلة

- [تطبيق iOS](/ar/platforms/ios)
- [Nodes](/ar/nodes)
- [استكشاف أخطاء Android node وإصلاحها](/ar/nodes/troubleshooting)
