---
read_when:
    - استكشاف مشكلات اكتشاف Bonjour على macOS/iOS وإصلاحها
    - تغيير أنواع خدمات mDNS أو سجلات TXT أو تجربة مستخدم الاكتشاف
summary: اكتشاف Bonjour/mDNS + تصحيح الأخطاء (إشارات Gateway، والعملاء، وأنماط الفشل الشائعة)
title: اكتشاف Bonjour
x-i18n:
    generated_at: "2026-05-06T07:52:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7b7d029e6eb6bee90eb96e7ea169ecadf3bda6d969b2450349c5716a950e205
    source_path: gateway/bonjour.md
    workflow: 16
---

يمكن لـ OpenClaw استخدام Bonjour (mDNS / DNS-SD) لاكتشاف Gateway نشط (نقطة نهاية WebSocket).
تصفّح البث المتعدد `local.` هو **وسيلة راحة مخصّصة للشبكة المحلية فقط**. يتولى Plugin `bonjour`
المضمّن الإعلان على الشبكة المحلية. يبدأ تلقائيًا على مضيفات macOS ويكون اختياريًا على
Linux وWindows وعمليات نشر Gateway داخل الحاويات. للاكتشاف عبر الشبكات، يمكن أيضًا
نشر المنارة نفسها عبر نطاق DNS-SD واسع النطاق مُعدّ. يظل الاكتشاف
بأفضل جهد ولا **يستبدل** الاتصال عبر SSH أو الاتصال المستند إلى Tailnet.

## Bonjour واسع النطاق (Unicast DNS-SD) عبر Tailscale

إذا كان Node وGateway على شبكتين مختلفتين، فلن يعبر البث المتعدد mDNS
الحدود. يمكنك الحفاظ على تجربة الاكتشاف نفسها بالتبديل إلى **unicast DNS-SD**
("Wide-Area Bonjour") عبر Tailscale.

الخطوات العامة:

1. شغّل خادم DNS على مضيف Gateway (يمكن الوصول إليه عبر Tailnet).
2. انشر سجلات DNS-SD لـ `_openclaw-gw._tcp` ضمن منطقة مخصصة
   (مثال: `openclaw.internal.`).
3. اضبط Tailscale **split DNS** بحيث يُحلّ نطاقك المختار عبر
   خادم DNS ذلك للعملاء (بما في ذلك iOS).

يدعم OpenClaw أي نطاق اكتشاف؛ `openclaw.internal.` مجرد مثال.
تتصفح عقد iOS/Android كلاً من `local.` ونطاقك واسع النطاق المُعدّ.

### إعدادات Gateway (موصى بها)

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

يثبّت هذا CoreDNS ويضبطه لكي:

- يستمع على المنفذ 53 فقط على واجهات Tailscale الخاصة بـ Gateway
- يخدم نطاقك المختار (مثال: `openclaw.internal.`) من `~/.openclaw/dns/<domain>.db`

تحقق من جهاز متصل بـ tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### إعدادات DNS في Tailscale

في وحدة تحكم إدارة Tailscale:

- أضف nameserver يشير إلى عنوان IP الخاص بـ gateway على tailnet (UDP/TCP 53).
- أضف split DNS بحيث يستخدم نطاق الاكتشاف الخاص بك ذلك nameserver.

بعد قبول العملاء لـ DNS الخاص بـ tailnet، يمكن لعقد iOS واكتشاف CLI تصفّح
`_openclaw-gw._tcp` في نطاق الاكتشاف الخاص بك دون بث متعدد.

### أمان مستمع Gateway (موصى به)

يرتبط منفذ Gateway WS (الافتراضي `18789`) بـ loopback افتراضيًا. للوصول عبر LAN/tailnet،
اربطه صراحةً وأبقِ المصادقة مفعّلة.

لإعدادات tailnet-only:

- عيّن `gateway.bind: "tailnet"` في `~/.openclaw/openclaw.json`.
- أعد تشغيل Gateway (أو أعد تشغيل تطبيق شريط قوائم macOS).

## ما الذي يعلن

يعلن Gateway فقط عن `_openclaw-gw._tcp`. يتم توفير إعلان البث المتعدد على LAN
بواسطة Plugin `bonjour` المضمّن عندما يكون Plugin مفعّلًا؛ ويبقى نشر
DNS-SD واسع النطاق مملوكًا لـ Gateway.

## أنواع الخدمات

- `_openclaw-gw._tcp` - منارة نقل gateway (تستخدمها عقد macOS/iOS/Android).

## مفاتيح TXT (تلميحات غير سرية)

يعلن Gateway عن تلميحات صغيرة غير سرية لجعل تدفقات UI مريحة:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (فقط عندما يكون TLS مفعّلًا)
- `gatewayTlsSha256=<sha256>` (فقط عندما يكون TLS مفعّلًا والبصمة متاحة)
- `canvasPort=<port>` (فقط عندما يكون مضيف canvas مفعّلًا؛ حاليًا هو نفسه `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (وضع mDNS full فقط، تلميح اختياري عندما يكون Tailnet متاحًا)
- `sshPort=<port>` (وضع mDNS full فقط؛ قد يحذفه DNS-SD واسع النطاق)
- `cliPath=<path>` (وضع mDNS full فقط؛ لا يزال DNS-SD واسع النطاق يكتبه كتلميح للتثبيت عن بُعد)

ملاحظات الأمان:

- سجلات Bonjour/mDNS TXT **غير مصادَق عليها**. يجب ألا يتعامل العملاء مع TXT كمصدر موثوق للتوجيه.
- يجب على العملاء التوجيه باستخدام نقطة نهاية الخدمة المحلولة (SRV + A/AAAA). تعامل مع `lanHost` و`tailnetDns` و`gatewayPort` و`gatewayTlsSha256` كتلميحات فقط.
- يجب أن يستخدم الاستهداف التلقائي لـ SSH كذلك مضيف الخدمة المحلول، وليس تلميحات TXT فقط.
- يجب ألا يسمح تثبيت TLS أبدًا لـ `gatewayTlsSha256` مُعلَن بتجاوز تثبيت مخزّن سابقًا.
- يجب أن تتعامل عقد iOS/Android مع الاتصالات المباشرة المستندة إلى الاكتشاف على أنها **TLS-only** وأن تتطلب تأكيدًا صريحًا من المستخدم قبل الوثوق ببصمة لأول مرة.

## تصحيح الأخطاء على macOS

أدوات مدمجة مفيدة:

- تصفّح المثيلات:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- حلّ مثيل واحد (استبدل `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

إذا نجح التصفح وفشل الحل، فأنت عادةً تواجه سياسة LAN أو
مشكلة في محلل mDNS.

## تصحيح الأخطاء في سجلات Gateway

يكتب Gateway ملف سجل متداولًا (يُطبع عند بدء التشغيل بصيغة
`gateway log file: ...`). ابحث عن أسطر `bonjour:`، وخاصة:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

يستخدم Bonjour اسم مضيف النظام لمضيف `.local` المُعلَن عندما يكون
تسمية DNS صالحة. إذا كان اسم مضيف النظام يحتوي على مسافات أو شرطات سفلية أو أي
محرف آخر غير صالح في تسمية DNS، يعود OpenClaw إلى `openclaw.local`. عيّن
`OPENCLAW_MDNS_HOSTNAME=<name>` قبل بدء Gateway عندما تحتاج إلى
تسمية مضيف صريحة.

## تصحيح الأخطاء على عقدة iOS

تستخدم عقدة iOS `NWBrowser` لاكتشاف `_openclaw-gw._tcp`.

لالتقاط السجلات:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → أعد الإنتاج → **Copy**

يتضمن السجل انتقالات حالة المتصفح وتغييرات مجموعة النتائج.

## متى تفعّل Bonjour

يبدأ Bonjour تلقائيًا عند بدء Gateway بإعدادات فارغة على مضيفات macOS لأن
التطبيق المحلي وعقد iOS/Android القريبة يعتمدون عادةً على الاكتشاف ضمن LAN نفسها.

فعّل Bonjour صراحةً عندما يكون الاكتشاف التلقائي ضمن LAN نفسها مفيدًا على Linux
أو Windows أو مضيف آخر غير macOS:

```bash
openclaw plugins enable bonjour
```

عند تفعيله، يستخدم Bonjour `discovery.mdns.mode` لتحديد مقدار بيانات TXT الوصفية
التي سينشرها. الوضع الافتراضي هو `minimal`؛ استخدم `full` فقط عندما يحتاج العملاء المحليون إلى
تلميحات `cliPath` أو `sshPort`، واستخدم `off` لمنع البث المتعدد على LAN دون
تغيير تفعيل Plugin.

## متى تعطل Bonjour

اترك Bonjour معطلًا عندما يكون إعلان البث المتعدد على LAN غير ضروري أو غير متاح
أو ضارًا. الحالات الشائعة هي خوادم غير macOS، وشبكات Docker bridge،
وWSL، أو سياسة شبكة تُسقط بث mDNS المتعدد. في تلك البيئات يظل
Gateway قابلًا للوصول عبر عنوان URL المنشور الخاص به أو SSH أو Tailnet أو DNS-SD
واسع النطاق، لكن الاكتشاف التلقائي عبر LAN غير موثوق.

فضّل تجاوز البيئة الحالي عندما تكون المشكلة مرتبطة بالنشر:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

يعطل ذلك إعلان البث المتعدد على LAN دون تغيير إعدادات Plugin.
وهو آمن لصور Docker وملفات الخدمات وسكربتات التشغيل وتصحيح الأخطاء لمرة واحدة
لأن الإعداد يختفي عند اختفاء البيئة.

استخدم إعدادات Plugin عندما تريد عمدًا إيقاف Plugin اكتشاف LAN
المضمّن لإعدادات OpenClaw تلك:

```bash
openclaw plugins disable bonjour
```

## ملاحظات Docker المهمة

يعطّل Plugin Bonjour المضمّن إعلان البث المتعدد على LAN تلقائيًا في الحاويات
المكتشفة عندما لا يكون `OPENCLAW_DISABLE_BONJOUR` مضبوطًا. عادةً لا تمرر شبكات Docker bridge
بث mDNS المتعدد (`224.0.0.251:5353`) بين الحاوية
وLAN، لذلك نادرًا ما يجعل الإعلان من الحاوية الاكتشاف يعمل.

ملاحظات مهمة:

- يبدأ Bonjour تلقائيًا على مضيفات macOS ويكون اختياريًا في أماكن أخرى. تركه
  معطلًا لا يوقف Gateway؛ بل يتخطى فقط إعلان البث المتعدد على LAN.
- تعطيل Bonjour لا يغيّر `gateway.bind`؛ لا يزال Docker يستخدم افتراضيًا
  `OPENCLAW_GATEWAY_BIND=lan` كي يعمل منفذ المضيف المنشور.
- تعطيل Bonjour لا يعطل DNS-SD واسع النطاق. استخدم الاكتشاف واسع النطاق
  أو Tailnet عندما لا يكون Gateway والعقدة على LAN نفسها.
- إعادة استخدام `OPENCLAW_CONFIG_DIR` نفسه خارج Docker لا تحفظ سياسة
  التعطيل التلقائي للحاوية.
- عيّن `OPENCLAW_DISABLE_BONJOUR=0` فقط لشبكات host أو macvlan أو شبكة أخرى
  يُعرف أن بث mDNS المتعدد يمر عبرها؛ عيّنه إلى `1` لفرض التعطيل.

## استكشاف أخطاء Bonjour المعطل وإصلاحها

إذا لم تعد العقدة تكتشف Gateway تلقائيًا بعد إعداد Docker:

1. تأكد مما إذا كان Gateway يعمل في وضع تلقائي أو مفروض التشغيل أو مفروض الإيقاف:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. تأكد من أن Gateway نفسه قابل للوصول عبر المنفذ المنشور:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. استخدم هدفًا مباشرًا عندما يكون Bonjour معطلًا:
   - Control UI أو الأدوات المحلية: `http://127.0.0.1:18789`
   - عملاء LAN: `http://<gateway-host>:18789`
   - العملاء عبر الشبكات: Tailnet MagicDNS أو Tailnet IP أو نفق SSH أو
     DNS-SD واسع النطاق

4. إذا كنت قد فعّلت Plugin Bonjour عمدًا في Docker وفرضت الإعلان
   باستخدام `OPENCLAW_DISABLE_BONJOUR=0`، فاختبر البث المتعدد من المضيف:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   إذا كان التصفح فارغًا أو أظهرت سجلات Gateway إلغاءات ciao watchdog
   متكررة، فأعد `OPENCLAW_DISABLE_BONJOUR=1` واستخدم مسارًا مباشرًا أو
   عبر Tailnet.

## أوضاع الفشل الشائعة

- **Bonjour لا يعبر الشبكات**: استخدم Tailnet أو SSH.
- **البث المتعدد محظور**: بعض شبكات Wi-Fi تعطل mDNS.
- **المعلِن عالق في الاستقصاء/الإعلان**: المضيفون الذين لديهم بث متعدد محظور،
  أو جسور الحاويات، أو WSL، أو تغيرات الواجهات يمكن أن تترك معلن ciao في
  حالة غير معلنة. يعيد OpenClaw المحاولة بضع مرات ثم يعطل Bonjour
  لعملية Gateway الحالية بدلًا من إعادة تشغيل المعلن إلى الأبد.
- **شبكات Docker bridge**: يتعطل Bonjour تلقائيًا في الحاويات المكتشفة.
  عيّن `OPENCLAW_DISABLE_BONJOUR=0` فقط لشبكة host أو macvlan أو شبكة أخرى
  قادرة على mDNS.
- **السكون / تغيرات الواجهات**: قد يُسقط macOS نتائج mDNS مؤقتًا؛ أعد المحاولة.
- **التصفح يعمل لكن الحل يفشل**: اجعل أسماء الأجهزة بسيطة (تجنب الرموز التعبيرية أو
  علامات الترقيم)، ثم أعد تشغيل Gateway. يُشتق اسم مثيل الخدمة من
  اسم المضيف، لذلك قد تربك الأسماء المعقدة جدًا بعض المحللات.

## أسماء المثيلات المهربة (`\032`)

غالبًا ما يهرب Bonjour/DNS-SD البايتات في أسماء مثيلات الخدمة كتسلسلات عشرية `\DDD`
(مثلًا تصبح المسافات `\032`).

- هذا طبيعي على مستوى البروتوكول.
- يجب أن تفك واجهات UI الترميز للعرض (يستخدم iOS `BonjourEscapes.decode`).

## التفعيل / التعطيل / الإعداد

- تبدأ مضيفات macOS تشغيل Plugin اكتشاف LAN المضمّن تلقائيًا افتراضيًا.
- يفعّل `openclaw plugins enable bonjour` Plugin اكتشاف LAN المضمّن على المضيفات التي لا يكون مفعّلًا عليها افتراضيًا.
- يعطل `openclaw plugins disable bonjour` إعلان البث المتعدد على LAN بتعطيل Plugin المضمّن.
- يعطل `OPENCLAW_DISABLE_BONJOUR=1` إعلان البث المتعدد على LAN دون تغيير إعدادات Plugin؛ القيم المقبولة التي تعني true هي `1` و`true` و`yes` و`on` (قديم: `OPENCLAW_DISABLE_BONJOUR`).
- يفرض `OPENCLAW_DISABLE_BONJOUR=0` تشغيل إعلان البث المتعدد على LAN، بما في ذلك داخل الحاويات المكتشفة؛ القيم المقبولة التي تعني false هي `0` و`false` و`no` و`off`.
- عندما يكون Plugin Bonjour مفعّلًا و`OPENCLAW_DISABLE_BONJOUR` غير مضبوط، يعلن Bonjour على المضيفات العادية ويتعطل تلقائيًا داخل الحاويات المكتشفة.
- يتحكم `gateway.bind` في `~/.openclaw/openclaw.json` بوضع ربط Gateway.
- يتجاوز `OPENCLAW_SSH_PORT` منفذ SSH عندما يُعلَن `sshPort` (قديم: `OPENCLAW_SSH_PORT`).
- ينشر `OPENCLAW_TAILNET_DNS` تلميح MagicDNS في TXT عندما يكون وضع mDNS full مفعّلًا (قديم: `OPENCLAW_TAILNET_DNS`).
- يتجاوز `OPENCLAW_CLI_PATH` مسار CLI المُعلَن (قديم: `OPENCLAW_CLI_PATH`).

## مستندات ذات صلة

- سياسة الاكتشاف واختيار النقل: [الاكتشاف](/ar/gateway/discovery)
- إقران Node والموافقات: [إقران Gateway](/ar/gateway/pairing)
