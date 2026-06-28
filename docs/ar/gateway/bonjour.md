---
read_when:
    - استكشاف أخطاء مشكلات اكتشاف Bonjour وإصلاحها على macOS/iOS
    - تغيير أنواع خدمة mDNS وسجلات TXT وتجربة مستخدم الاكتشاف
summary: اكتشاف Bonjour/mDNS + تصحيح الأخطاء (إشارات بث Gateway والعملاء وأوضاع الفشل الشائعة)
title: اكتشاف Bonjour
x-i18n:
    generated_at: "2026-05-12T12:50:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05892ee8f0dc880f68f7cf024de9452b8d999ff1af3c7ca9850fb4f2d732af0c
    source_path: gateway/bonjour.md
    workflow: 16
    postprocess_version: locale-links-v1
---

يمكن لـ OpenClaw استخدام Bonjour (mDNS / DNS-SD) لاكتشاف Gateway نشط (نقطة نهاية WebSocket).
يُعد تصفح Multicast `local.` **وسيلة ملائمة داخل LAN فقط**. يتولى Plugin `bonjour`
المضمّن مسؤولية الإعلان داخل LAN. يبدأ تلقائيًا على مضيفات macOS ويكون اختياريًا على
Linux وWindows وعمليات نشر Gateway داخل الحاويات. لاكتشاف الشبكات المتقاطعة، يمكن أيضًا
نشر المنارة نفسها عبر نطاق DNS-SD واسع النطاق مُهيأ. يظل الاكتشاف
أفضل جهد ولا **يستبدل** الاتصال عبر SSH أو الاتصال المستند إلى Tailnet.

## Bonjour واسع النطاق (Unicast DNS-SD) عبر Tailscale

إذا كانت العقدة وGateway على شبكتين مختلفتين، فلن يعبر mDNS متعدد البث
الحدود. يمكنك الاحتفاظ بتجربة الاكتشاف نفسها بالتبديل إلى **unicast DNS-SD**
("Bonjour واسع النطاق") عبر Tailscale.

الخطوات العامة:

1. شغّل خادم DNS على مضيف Gateway (يمكن الوصول إليه عبر Tailnet).
2. انشر سجلات DNS-SD لـ `_openclaw-gw._tcp` ضمن نطاق مخصص
   (مثال: `openclaw.internal.`).
3. هيّئ Tailscale **split DNS** بحيث يُحل نطاقك المختار عبر خادم
   DNS ذلك للعملاء (بما في ذلك iOS).

يدعم OpenClaw أي نطاق اكتشاف؛ `openclaw.internal.` مجرد مثال.
تتصفح عُقد iOS/Android كلًا من `local.` ونطاقك واسع النطاق المُهيأ.

### إعداد Gateway (موصى به)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### إعداد خادم DNS لمرة واحدة (مضيف Gateway)

```bash
openclaw dns setup --apply
```

يثبّت هذا CoreDNS ويهيئه لكي:

- يستمع على المنفذ 53 فقط على واجهات Tailscale الخاصة بـ Gateway
- يخدم نطاقك المختار (مثال: `openclaw.internal.`) من `~/.openclaw/dns/<domain>.db`

تحقق من جهاز متصل بـ tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### إعدادات DNS في Tailscale

في وحدة تحكم مشرف Tailscale:

- أضف خادم أسماء يشير إلى عنوان IP الخاص بـ gateway على tailnet (UDP/TCP 53).
- أضف split DNS بحيث يستخدم نطاق الاكتشاف خادم الأسماء ذلك.

بمجرد أن يقبل العملاء DNS الخاص بـ tailnet، يمكن لعُقد iOS واكتشاف CLI تصفح
`_openclaw-gw._tcp` في نطاق الاكتشاف لديك دون Multicast.

### أمان مستمع Gateway (موصى به)

يرتبط منفذ Gateway WS (الافتراضي `18789`) بـ loopback افتراضيًا. للوصول عبر LAN/tailnet،
اربطه صراحةً وأبقِ المصادقة مفعّلة.

لإعدادات tailnet-only:

- عيّن `gateway.bind: "tailnet"` في `~/.openclaw/openclaw.json`.
- أعد تشغيل Gateway (أو أعد تشغيل تطبيق شريط القوائم في macOS).

## ما الذي يعلن

وحده Gateway يعلن عن `_openclaw-gw._tcp`. يتم توفير إعلان LAN متعدد البث
بواسطة Plugin `bonjour` المضمّن عند تمكين Plugin؛ بينما يظل نشر
DNS-SD واسع النطاق مملوكًا لـ Gateway.

## أنواع الخدمات

- `_openclaw-gw._tcp` - منارة نقل Gateway (تستخدمها عُقد macOS/iOS/Android).

## مفاتيح TXT (تلميحات غير سرية)

يعلن Gateway عن تلميحات صغيرة غير سرية لتسهيل تدفقات واجهة المستخدم:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (فقط عند تمكين TLS)
- `gatewayTlsSha256=<sha256>` (فقط عند تمكين TLS وتوفر البصمة)
- `canvasPort=<port>` (فقط عند تمكين مضيف اللوحة؛ حاليًا هو نفسه `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (وضع mDNS الكامل فقط، تلميح اختياري عند توفر Tailnet)
- `sshPort=<port>` (الوضع الكامل فقط؛ يُحذف في وضعي minimal وoff)
- `cliPath=<path>` (الوضع الكامل فقط؛ يُحذف في وضعي minimal وoff)

ملاحظات أمنية:

- سجلات TXT في Bonjour/mDNS **غير موثقة**. يجب ألا يتعامل العملاء مع TXT كمصدر موثوق للتوجيه.
- ينبغي للعملاء التوجيه باستخدام نقطة نهاية الخدمة المحلولة (SRV + A/AAAA). تعامل مع `lanHost` و`tailnetDns` و`gatewayPort` و`gatewayTlsSha256` كتلميحات فقط.
- يجب أن يستخدم الاستهداف التلقائي لـ SSH مضيف الخدمة المحلول أيضًا، لا التلميحات المعتمدة على TXT فقط.
- يجب ألا يسمح تثبيت TLS مطلقًا لقيمة `gatewayTlsSha256` مُعلنة بتجاوز تثبيت محفوظ سابقًا.
- ينبغي لعُقد iOS/Android التعامل مع الاتصالات المباشرة القائمة على الاكتشاف على أنها **TLS-only** وطلب تأكيد صريح من المستخدم قبل الوثوق ببصمة للمرة الأولى.

## تصحيح الأخطاء على macOS

أدوات مضمّنة مفيدة:

- تصفح المثيلات:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- حل مثيل واحد (استبدل `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

إذا نجح التصفح وفشل الحل، فأنت غالبًا تواجه سياسة LAN أو
مشكلة في محلل mDNS.

## تصحيح الأخطاء في سجلات Gateway

يكتب Gateway ملف سجل متدوّرًا (يُطبع عند بدء التشغيل كـ
`gateway log file: ...`). ابحث عن أسطر `bonjour:`، وخاصةً:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

يتعامل المراقب مع حالات `probing` و`announcing` النشطة وإعادة التسمية الحديثة بسبب التعارض
كحالات قيد التقدم. إذا لم تصل الخدمة أبدًا إلى `announced`، يعيد OpenClaw في النهاية
إنشاء المُعلِن، وبعد تكرار الإخفاقات، يعطّل Bonjour لعملية
Gateway تلك بدلًا من إعادة الإعلان إلى الأبد.

يستخدم Bonjour اسم مضيف النظام لمضيف `.local` المُعلن عندما يكون
تسمية DNS صالحة. إذا احتوى اسم مضيف النظام على مسافات أو شرطات سفلية أو أي
محرف آخر غير صالح في تسمية DNS، يعود OpenClaw إلى `openclaw.local`. عيّن
`OPENCLAW_MDNS_HOSTNAME=<name>` قبل بدء Gateway عندما تحتاج إلى
تسمية مضيف صريحة.

## تصحيح الأخطاء على عقدة iOS

تستخدم عقدة iOS `NWBrowser` لاكتشاف `_openclaw-gw._tcp`.

لالتقاط السجلات:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → أعد الإنتاج → **Copy**

يتضمن السجل انتقالات حالة المتصفح وتغييرات مجموعة النتائج.

## متى تُفعّل Bonjour

يبدأ Bonjour تلقائيًا عند بدء Gateway بإعداد فارغ على مضيفات macOS لأن
التطبيق المحلي وعُقد iOS/Android القريبة تعتمد عادةً على الاكتشاف ضمن LAN نفسها.

فعّل Bonjour صراحةً عندما يكون الاكتشاف التلقائي ضمن LAN نفسها مفيدًا على Linux
أو Windows أو مضيف آخر غير macOS:

```bash
openclaw plugins enable bonjour
```

عند التمكين، يستخدم Bonjour `discovery.mdns.mode` لتحديد مقدار بيانات TXT الوصفية
التي سينشرها. يتحكم الوضع نفسه في تلميحات TXT الاختيارية في سجلات DNS-SD واسعة النطاق.
الوضع الافتراضي هو `minimal`؛ استخدم `full` فقط عندما يحتاج العملاء إلى تلميحات `cliPath` أو
`sshPort`. استخدم `off` لكبت LAN Multicast دون تغيير تمكين Plugin؛ يمكن لـ DNS-SD واسع النطاق
مع ذلك نشر منارة Gateway الدنيا عندما تكون
`discovery.wideArea.enabled` صحيحة.

## متى تُعطّل Bonjour

اترك Bonjour معطّلًا عندما يكون إعلان LAN متعدد البث غير ضروري أو غير متاح
أو ضارًا. الحالات الشائعة هي خوادم غير macOS، وشبكات Docker bridge،
وWSL، أو سياسة شبكة تُسقط mDNS متعدد البث. في تلك البيئات يظل
Gateway قابلًا للوصول عبر عنوان URL المنشور أو SSH أو Tailnet أو DNS-SD واسع النطاق،
لكن الاكتشاف التلقائي عبر LAN غير موثوق.

فضّل تجاوز البيئة الحالي عندما تكون المشكلة مرتبطة بالنشر:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

يعطّل ذلك إعلان LAN متعدد البث دون تغيير إعدادات Plugin.
وهو آمن لصور Docker وملفات الخدمة وسكربتات التشغيل وتصحيح الأخطاء لمرة واحدة
لأن الإعداد يختفي عندما تختفي البيئة.

استخدم إعدادات Plugin عندما تريد عمدًا إيقاف Plugin اكتشاف LAN
المضمّن لذلك إعداد OpenClaw:

```bash
openclaw plugins disable bonjour
```

## تنبيهات Docker

يعطّل Plugin Bonjour المضمّن إعلان LAN متعدد البث تلقائيًا في الحاويات
المكتشفة عندما لا يكون `OPENCLAW_DISABLE_BONJOUR` معيّنًا. لا تمرر شبكات Docker bridge
عادةً mDNS متعدد البث (`224.0.0.251:5353`) بين الحاوية
وLAN، لذلك نادرًا ما يجعل الإعلان من الحاوية الاكتشاف يعمل.

تنبيهات مهمة:

- يبدأ Bonjour تلقائيًا على مضيفات macOS ويكون اختياريًا في غيرها. تركه
  معطّلًا لا يوقف Gateway؛ بل يتجاوز إعلان LAN متعدد البث فقط.
- لا يؤدي تعطيل Bonjour إلى تغيير `gateway.bind`؛ يظل Docker افتراضيًا على
  `OPENCLAW_GATEWAY_BIND=lan` لكي يعمل منفذ المضيف المنشور.
- لا يؤدي تعطيل Bonjour إلى تعطيل DNS-SD واسع النطاق. استخدم الاكتشاف واسع النطاق
  أو Tailnet عندما لا يكون Gateway والعقدة على LAN نفسها.
- لا تؤدي إعادة استخدام `OPENCLAW_CONFIG_DIR` نفسه خارج Docker إلى استمرار
  سياسة التعطيل التلقائي للحاوية.
- عيّن `OPENCLAW_DISABLE_BONJOUR=0` فقط للشبكات المضيفة أو macvlan أو شبكة أخرى
  يُعرف أن mDNS متعدد البث يمر عبرها؛ عيّنه إلى `1` لفرض التعطيل.

## استكشاف أخطاء Bonjour المعطّل وإصلاحها

إذا لم تعد عقدة تكتشف Gateway تلقائيًا بعد إعداد Docker:

1. تأكد مما إذا كان Gateway يعمل في وضع auto أو forced-on أو forced-off:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. تأكد من أن Gateway نفسه قابل للوصول عبر المنفذ المنشور:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. استخدم هدفًا مباشرًا عندما يكون Bonjour معطّلًا:
   - واجهة التحكم أو الأدوات المحلية: `http://127.0.0.1:18789`
   - عملاء LAN: `http://<gateway-host>:18789`
   - العملاء عبر الشبكات: Tailnet MagicDNS أو Tailnet IP أو نفق SSH أو
     DNS-SD واسع النطاق

4. إذا فعّلت Plugin Bonjour عمدًا في Docker وفرضت الإعلان
   باستخدام `OPENCLAW_DISABLE_BONJOUR=0`، فاختبر Multicast من المضيف:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   إذا كان التصفح فارغًا أو أظهرت سجلات Gateway إلغاءات متكررة من مراقب ciao،
   فاستعد `OPENCLAW_DISABLE_BONJOUR=1` واستخدم مسارًا مباشرًا أو
   عبر Tailnet.

## أنماط الفشل الشائعة

- **Bonjour لا يعبر الشبكات**: استخدم Tailnet أو SSH.
- **Multicast محظور**: تعطّل بعض شبكات Wi-Fi mDNS.
- **المُعلِن عالق في probing/announcing**: يمكن للمضيفات ذات Multicast المحظور،
  وجسور الحاويات، وWSL، أو تقلب الواجهات أن تترك مُعلِن ciao في
  حالة غير معلنة. يعيد OpenClaw المحاولة بضع مرات ثم يعطّل Bonjour
  لعملية Gateway الحالية بدلًا من إعادة تشغيل المُعلِن إلى الأبد.
- **شبكات Docker bridge**: يتعطل Bonjour تلقائيًا في الحاويات المكتشفة.
  عيّن `OPENCLAW_DISABLE_BONJOUR=0` فقط لشبكة مضيفة أو macvlan أو شبكة أخرى
  تدعم mDNS.
- **السكون / تقلب الواجهات**: قد يُسقط macOS نتائج mDNS مؤقتًا؛ أعد المحاولة.
- **ينجح التصفح ويفشل الحل**: اجعل أسماء الأجهزة بسيطة (تجنب الرموز التعبيرية أو
  علامات الترقيم)، ثم أعد تشغيل Gateway. يُشتق اسم مثيل الخدمة من
  اسم المضيف، لذلك قد تربك الأسماء شديدة التعقيد بعض المحللات.

## أسماء المثيلات المُهربة (`\032`)

غالبًا ما يهرب Bonjour/DNS-SD البايتات في أسماء مثيلات الخدمة كتسلسلات عشرية `\DDD`
(مثلًا، تتحول المسافات إلى `\032`).

- هذا طبيعي على مستوى البروتوكول.
- ينبغي لواجهات المستخدم فك الترميز للعرض (يستخدم iOS `BonjourEscapes.decode`).

## التمكين / التعطيل / الإعداد

- تبدأ مضيفات macOS تشغيل Plugin اكتشاف LAN المضمّن تلقائيًا بشكل افتراضي.
- يفعّل `openclaw plugins enable bonjour` Plugin اكتشاف LAN المضمّن على المضيفات التي لا يكون فيها مفعّلًا افتراضيًا.
- يعطّل `openclaw plugins disable bonjour` الإعلان متعدد البث عبر LAN بتعطيل Plugin المضمّن.
- يعطّل `OPENCLAW_DISABLE_BONJOUR=1` الإعلان متعدد البث عبر LAN من دون تغيير إعدادات Plugin؛ القيم الصادقة المقبولة هي `1` و`true` و`yes` و`on` (قديم: `OPENCLAW_DISABLE_BONJOUR`).
- يفرض `OPENCLAW_DISABLE_BONJOUR=0` تشغيل الإعلان متعدد البث عبر LAN، بما في ذلك داخل الحاويات المكتشفة؛ القيم الكاذبة المقبولة هي `0` و`false` و`no` و`off`.
- عندما يكون Plugin Bonjour مفعّلًا ويكون `OPENCLAW_DISABLE_BONJOUR` غير مضبوط، يعلن Bonjour على المضيفات العادية ويتعطّل تلقائيًا داخل الحاويات المكتشفة.
- يتحكم `gateway.bind` في `~/.openclaw/openclaw.json` في وضع ربط Gateway.
- يتجاوز `OPENCLAW_SSH_PORT` منفذ SSH عندما يُعلَن `sshPort` (قديم: `OPENCLAW_SSH_PORT`).
- ينشر `OPENCLAW_TAILNET_DNS` تلميح MagicDNS في TXT عندما يكون وضع mDNS الكامل مفعّلًا (قديم: `OPENCLAW_TAILNET_DNS`).
- يتجاوز `OPENCLAW_CLI_PATH` مسار CLI المُعلَن (قديم: `OPENCLAW_CLI_PATH`).

## الوثائق ذات الصلة

- سياسة الاكتشاف واختيار النقل: [الاكتشاف](/ar/gateway/discovery)
- إقران Node + الموافقات: [إقران Gateway](/ar/gateway/pairing)
