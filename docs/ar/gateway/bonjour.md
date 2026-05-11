---
read_when:
    - استكشاف مشكلات اكتشاف Bonjour وإصلاحها على macOS/iOS
    - تغيير أنواع خدمات mDNS أو سجلات TXT أو تجربة مستخدم الاكتشاف
summary: اكتشاف Bonjour/mDNS وتصحيح الأخطاء (إشارات Gateway والعملاء وأنماط الفشل الشائعة)
title: اكتشاف Bonjour
x-i18n:
    generated_at: "2026-05-11T20:31:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03bd9403591a389c06d3131e4c110d4ccf711eee56cbe9a5c9baed2b6df8fb80
    source_path: gateway/bonjour.md
    workflow: 16
---

يمكن لـ OpenClaw استخدام Bonjour (mDNS / DNS-SD) لاكتشاف Gateway نشط (نقطة نهاية WebSocket).
يُعد تصفح البث المتعدد `local.` **ميزة ملائمة داخل LAN فقط**. يمتلك Plugin المضمّن `bonjour`
إعلانات LAN. يبدأ تلقائيا على مضيفي macOS، ويكون اختياريا على
Linux وWindows وعمليات نشر Gateway داخل الحاويات. للاكتشاف عبر الشبكات، يمكن أيضا
نشر الإشارة نفسها عبر نطاق DNS-SD واسع النطاق مهيأ. يظل الاكتشاف
بأفضل جهد ولا يحل **محل** الاتصال عبر SSH أو Tailnet.

## Bonjour واسع النطاق (Unicast DNS-SD) عبر Tailscale

إذا كان Node والبوابة على شبكتين مختلفتين، فلن يعبر بث mDNS المتعدد
الحد الفاصل. يمكنك إبقاء تجربة الاكتشاف نفسها بالتبديل إلى **unicast DNS-SD**
("Bonjour واسع النطاق") عبر Tailscale.

الخطوات العامة:

1. شغّل خادم DNS على مضيف البوابة (يمكن الوصول إليه عبر Tailnet).
2. انشر سجلات DNS-SD لـ `_openclaw-gw._tcp` ضمن منطقة مخصصة
   (مثال: `openclaw.internal.`).
3. هيّئ **split DNS** في Tailscale بحيث يُحل النطاق الذي اخترته عبر
   خادم DNS ذلك للعملاء (بما في ذلك iOS).

يدعم OpenClaw أي نطاق اكتشاف؛ `openclaw.internal.` مجرد مثال.
تتصفح عُقد iOS/Android كلا من `local.` ونطاقك واسع النطاق المهيأ.

### تهيئة Gateway (موصى بها)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### إعداد خادم DNS لمرة واحدة (مضيف البوابة)

```bash
openclaw dns setup --apply
```

يثبت هذا CoreDNS ويهيئه من أجل:

- الاستماع على المنفذ 53 فقط على واجهات Tailscale الخاصة بالبوابة
- تقديم نطاقك المختار (مثال: `openclaw.internal.`) من `~/.openclaw/dns/<domain>.db`

تحقق من جهاز متصل بـ tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### إعدادات DNS في Tailscale

في وحدة تحكم إدارة Tailscale:

- أضف خادم أسماء يشير إلى عنوان IP الخاص بالبوابة على tailnet‏ (UDP/TCP 53).
- أضف split DNS بحيث يستخدم نطاق الاكتشاف خادم الأسماء ذلك.

بمجرد قبول العملاء لـ DNS الخاص بـ tailnet، يمكن لعُقد iOS واكتشاف CLI تصفح
`_openclaw-gw._tcp` في نطاق الاكتشاف لديك دون بث متعدد.

### أمان مستمع Gateway (موصى به)

يرتبط منفذ Gateway WS (الافتراضي `18789`) بـ local loopback افتراضيا. للوصول عبر LAN/tailnet،
اربطه صراحة وأبق المصادقة مفعلة.

لإعدادات tailnet فقط:

- اضبط `gateway.bind: "tailnet"` في `~/.openclaw/openclaw.json`.
- أعد تشغيل Gateway (أو أعد تشغيل تطبيق شريط قوائم macOS).

## ما الذي يعلن

تعلن Gateway فقط عن `_openclaw-gw._tcp`. يوفر Plugin المضمّن `bonjour`
إعلانات البث المتعدد على LAN عندما يكون Plugin مفعلا؛ ويظل نشر
DNS-SD واسع النطاق مملوكا لـ Gateway.

## أنواع الخدمات

- `_openclaw-gw._tcp` - إشارة نقل البوابة (تستخدمها عُقد macOS/iOS/Android).

## مفاتيح TXT (تلميحات غير سرية)

تعلن Gateway تلميحات صغيرة غير سرية لتسهيل تدفقات واجهة المستخدم:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (فقط عند تفعيل TLS)
- `gatewayTlsSha256=<sha256>` (فقط عند تفعيل TLS وتوفر البصمة)
- `canvasPort=<port>` (فقط عند تفعيل مضيف اللوحة؛ حاليا هو نفسه `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (وضع mDNS الكامل فقط، تلميح اختياري عند توفر Tailnet)
- `sshPort=<port>` (وضع mDNS الكامل فقط؛ قد يحذفه DNS-SD واسع النطاق)
- `cliPath=<path>` (وضع mDNS الكامل فقط؛ لا يزال DNS-SD واسع النطاق يكتبه كتلميح تثبيت عن بعد)

ملاحظات أمنية:

- سجلات TXT في Bonjour/mDNS **غير مصادق عليها**. يجب ألا يتعامل العملاء مع TXT كمصدر موثوق للتوجيه.
- يجب على العملاء التوجيه باستخدام نقطة نهاية الخدمة المحلولة (SRV + A/AAAA). تعامل مع `lanHost` و`tailnetDns` و`gatewayPort` و`gatewayTlsSha256` كتلميحات فقط.
- ينبغي أن يستخدم الاستهداف التلقائي عبر SSH مضيف الخدمة المحلول أيضا، وليس تلميحات TXT فقط.
- يجب ألا يسمح تثبيت TLS أبدا بأن تتجاوز قيمة `gatewayTlsSha256` المعلن عنها تثبيتا مخزنا سابقا.
- ينبغي لعُقد iOS/Android التعامل مع الاتصالات المباشرة القائمة على الاكتشاف على أنها **TLS فقط** وطلب تأكيد صريح من المستخدم قبل الوثوق ببصمة للمرة الأولى.

## التصحيح على macOS

أدوات مدمجة مفيدة:

- تصفح النسخ:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- حل نسخة واحدة (استبدل `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

إذا نجح التصفح وفشل الحل، فأنت غالبا تواجه سياسة LAN أو
مشكلة في محلل mDNS.

## التصحيح في سجلات Gateway

تكتب Gateway ملف سجل دائريا (يُطبع عند بدء التشغيل بصيغة
`gateway log file: ...`). ابحث عن أسطر `bonjour:`، وخاصة:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

يتعامل المراقب مع حالات `probing` و`announcing` النشطة وإعادة التسمية الحديثة بسبب التعارض
كحالات قيد التنفيذ. إذا لم تصل الخدمة أبدا إلى `announced`، يعيد OpenClaw في النهاية
إنشاء المُعلن، وبعد الإخفاقات المتكررة، يعطل Bonjour لعملية
Gateway تلك بدلا من إعادة الإعلان إلى الأبد.

يستخدم Bonjour اسم مضيف النظام لمضيف `.local` المعلن عندما يكون
تسمية DNS صالحة. إذا كان اسم مضيف النظام يحتوي على مسافات أو شرطات سفلية أو أي
حرف آخر غير صالح لتسمية DNS، يعود OpenClaw إلى `openclaw.local`. اضبط
`OPENCLAW_MDNS_HOSTNAME=<name>` قبل بدء Gateway عندما تحتاج إلى
تسمية مضيف صريحة.

## التصحيح على عقدة iOS

تستخدم عقدة iOS `NWBrowser` لاكتشاف `_openclaw-gw._tcp`.

لالتقاط السجلات:

- الإعدادات → Gateway → متقدم → **سجلات تصحيح الاكتشاف**
- الإعدادات → Gateway → متقدم → **سجلات الاكتشاف** → أعد الإنتاج → **نسخ**

يتضمن السجل انتقالات حالة المتصفح وتغييرات مجموعة النتائج.

## متى تفعّل Bonjour

يبدأ Bonjour تلقائيا عند بدء تشغيل Gateway بتكوين فارغ على مضيفي macOS لأن
التطبيق المحلي وعُقد iOS/Android القريبة تعتمد عادة على الاكتشاف ضمن LAN نفسه.

فعّل Bonjour صراحة عندما يكون الاكتشاف التلقائي ضمن LAN نفسه مفيدا على Linux
أو Windows أو مضيف آخر غير macOS:

```bash
openclaw plugins enable bonjour
```

عند تفعيله، يستخدم Bonjour `discovery.mdns.mode` لتحديد مقدار بيانات TXT الوصفية
التي سينشرها. الوضع الافتراضي هو `minimal`؛ استخدم `full` فقط عندما يحتاج العملاء المحليون إلى
تلميحات `cliPath` أو `sshPort`، واستخدم `off` لمنع بث LAN المتعدد دون
تغيير تفعيل Plugin.

## متى تعطّل Bonjour

اترك Bonjour معطلا عندما تكون إعلانات البث المتعدد على LAN غير ضرورية أو غير متاحة
أو ضارة. الحالات الشائعة هي الخوادم غير macOS، وشبكات Docker bridge،
وWSL، أو سياسة شبكة تسقط بث mDNS المتعدد. في تلك البيئات تظل
Gateway قابلة للوصول عبر عنوان URL المنشور أو SSH أو Tailnet أو DNS-SD
واسع النطاق، لكن الاكتشاف التلقائي عبر LAN غير موثوق.

فضّل التجاوز البيئي الموجود عندما تكون المشكلة مرتبطة بالنشر:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

يعطل ذلك إعلانات البث المتعدد على LAN دون تغيير تهيئة Plugin.
وهو آمن لصور Docker وملفات الخدمة وسكربتات التشغيل والتصحيح لمرة واحدة
لأن الإعداد يختفي عندما تختفي البيئة.

استخدم تهيئة Plugin عندما تريد عمدا إيقاف Plugin اكتشاف LAN
المضمّن لذلك التكوين في OpenClaw:

```bash
openclaw plugins disable bonjour
```

## ملاحظات Docker

يعطل Plugin Bonjour المضمّن تلقائيا إعلانات البث المتعدد على LAN داخل
الحاويات المكتشفة عندما لا يكون `OPENCLAW_DISABLE_BONJOUR` مضبوطا. عادة لا
تمرر شبكات Docker bridge بث mDNS المتعدد (`224.0.0.251:5353`) بين الحاوية
وLAN، لذلك نادرا ما يجعل الإعلان من الحاوية الاكتشاف يعمل.

ملاحظات مهمة:

- يبدأ Bonjour تلقائيا على مضيفي macOS ويكون اختياريا في الأماكن الأخرى. تركه
  معطلا لا يوقف Gateway؛ بل يتخطى فقط إعلانات البث المتعدد على LAN.
- تعطيل Bonjour لا يغير `gateway.bind`؛ لا يزال Docker يستخدم افتراضيا
  `OPENCLAW_GATEWAY_BIND=lan` حتى يعمل منفذ المضيف المنشور.
- تعطيل Bonjour لا يعطل DNS-SD واسع النطاق. استخدم الاكتشاف واسع النطاق
  أو Tailnet عندما لا تكون Gateway والعقدة على LAN نفسه.
- إعادة استخدام `OPENCLAW_CONFIG_DIR` نفسه خارج Docker لا تستبقي
  سياسة التعطيل التلقائي للحاوية.
- اضبط `OPENCLAW_DISABLE_BONJOUR=0` فقط لشبكة المضيف أو macvlan أو شبكة أخرى
  يُعرف أن بث mDNS المتعدد يمر عبرها؛ واضبطه على `1` لفرض التعطيل.

## استكشاف أخطاء Bonjour المعطل وإصلاحها

إذا لم تعد العقدة تكتشف Gateway تلقائيا بعد إعداد Docker:

1. أكد ما إذا كانت Gateway تعمل في وضع تلقائي أو مفعل قسرا أو معطل قسرا:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. أكد أن Gateway نفسها قابلة للوصول عبر المنفذ المنشور:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. استخدم هدفا مباشرا عندما يكون Bonjour معطلا:
   - واجهة التحكم أو الأدوات المحلية: `http://127.0.0.1:18789`
   - عملاء LAN: `http://<gateway-host>:18789`
   - العملاء عبر الشبكات: Tailnet MagicDNS أو عنوان IP الخاص بـ Tailnet أو نفق SSH أو
     DNS-SD واسع النطاق

4. إذا فعّلت Plugin Bonjour عمدا في Docker وفرضت الإعلان
   باستخدام `OPENCLAW_DISABLE_BONJOUR=0`، فاختبر البث المتعدد من المضيف:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   إذا كان التصفح فارغا أو أظهرت سجلات Gateway إلغاءات متكررة من مراقب ciao،
   فأعد `OPENCLAW_DISABLE_BONJOUR=1` واستخدم مسارا مباشرا أو
   مسارا عبر Tailnet.

## أوضاع الفشل الشائعة

- **Bonjour لا يعبر الشبكات**: استخدم Tailnet أو SSH.
- **البث المتعدد محظور**: بعض شبكات Wi-Fi تعطل mDNS.
- **المُعلن عالق في probing/announcing**: يمكن للمضيفين ذوي البث المتعدد المحظور،
  وجسور الحاويات، وWSL، أو تغيرات الواجهات أن تترك معلن ciao في
  حالة غير معلنة. يعيد OpenClaw المحاولة بضع مرات ثم يعطل Bonjour
  لعملية Gateway الحالية بدلا من إعادة تشغيل المُعلن إلى الأبد.
- **شبكات Docker bridge**: يتعطل Bonjour تلقائيا داخل الحاويات المكتشفة.
  اضبط `OPENCLAW_DISABLE_BONJOUR=0` فقط للمضيف أو macvlan أو شبكة أخرى
  قادرة على mDNS.
- **السكون / تغيرات الواجهات**: قد يسقط macOS نتائج mDNS مؤقتا؛ أعد المحاولة.
- **التصفح يعمل لكن الحل يفشل**: أبق أسماء الأجهزة بسيطة (تجنب الرموز التعبيرية أو
  علامات الترقيم)، ثم أعد تشغيل Gateway. يُشتق اسم نسخة الخدمة من
  اسم المضيف، لذلك قد تربك الأسماء شديدة التعقيد بعض المحللات.

## أسماء النسخ المهربة (`\032`)

غالبا ما يهرب Bonjour/DNS-SD البايتات في أسماء نسخ الخدمة كسلاسل عشرية `\DDD`
(مثلا تصبح المسافات `\032`).

- هذا طبيعي على مستوى البروتوكول.
- يجب على واجهات المستخدم فك الترميز للعرض (يستخدم iOS `BonjourEscapes.decode`).

## التفعيل / التعطيل / التهيئة

- يبدأ مضيفو macOS تشغيل Plugin اكتشاف LAN المضمّن تلقائياً بشكل افتراضي.
- يفعّل `openclaw plugins enable bonjour` ‏Plugin اكتشاف LAN المضمّن على المضيفين حيث لا يكون مفعّلاً افتراضياً.
- يعطّل `openclaw plugins disable bonjour` الإعلان عبر البث المتعدد في LAN عن طريق تعطيل Plugin المضمّن.
- يعطّل `OPENCLAW_DISABLE_BONJOUR=1` الإعلان عبر البث المتعدد في LAN دون تغيير إعدادات Plugin؛ القيم الصادقة المقبولة هي `1` و`true` و`yes` و`on` (قديم: `OPENCLAW_DISABLE_BONJOUR`).
- يفرض `OPENCLAW_DISABLE_BONJOUR=0` تشغيل الإعلان عبر البث المتعدد في LAN، بما في ذلك داخل الحاويات المكتشفة؛ القيم الكاذبة المقبولة هي `0` و`false` و`no` و`off`.
- عندما يكون Plugin Bonjour مفعّلاً و`OPENCLAW_DISABLE_BONJOUR` غير معيّن، يعلن Bonjour على المضيفين العاديين ويتعطّل تلقائياً داخل الحاويات المكتشفة.
- يتحكم `gateway.bind` في `~/.openclaw/openclaw.json` في وضع ربط Gateway.
- يتجاوز `OPENCLAW_SSH_PORT` منفذ SSH عندما يتم الإعلان عن `sshPort` (قديم: `OPENCLAW_SSH_PORT`).
- ينشر `OPENCLAW_TAILNET_DNS` تلميح MagicDNS في TXT عندما يكون وضع mDNS الكامل مفعّلاً (قديم: `OPENCLAW_TAILNET_DNS`).
- يتجاوز `OPENCLAW_CLI_PATH` مسار CLI المعلن (قديم: `OPENCLAW_CLI_PATH`).

## المستندات ذات الصلة

- سياسة الاكتشاف واختيار النقل: [الاكتشاف](/ar/gateway/discovery)
- إقران Node + الموافقات: [إقران Gateway](/ar/gateway/pairing)
