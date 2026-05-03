---
read_when:
    - استكشاف أخطاء اكتشاف Bonjour على macOS/iOS وإصلاحها
    - تغيير أنواع خدمات mDNS أو سجلات TXT أو تجربة مستخدم الاكتشاف
summary: اكتشاف Bonjour/mDNS وتصحيح الأخطاء (إشارات Gateway والعملاء وأنماط الفشل الشائعة)
title: اكتشاف Bonjour
x-i18n:
    generated_at: "2026-05-03T21:32:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2975fea03bc8fe8ccbd57f7a4ca8c15a59fb21b3f92c2b77b9a57ae4ebd5d374
    source_path: gateway/bonjour.md
    workflow: 16
---

# اكتشاف Bonjour / mDNS

يمكن لـ OpenClaw استخدام Bonjour ‏(mDNS / DNS-SD) لاكتشاف Gateway نشط (نقطة نهاية WebSocket).
يُعد تصفح البث المتعدد `local.` **وسيلة مريحة خاصة بالشبكة المحلية فقط**. يتولى Plugin المضمن `bonjour`
إعلانات الشبكة المحلية. يبدأ تلقائيًا على مضيفات macOS ويكون اختياريًا على
Linux وWindows وعمليات نشر Gateway داخل الحاويات. للاكتشاف عبر الشبكات، يمكن أيضًا
نشر المنارة نفسها من خلال نطاق DNS-SD واسع النطاق مُكوَّن. يظل الاكتشاف
بأفضل جهد ولا يحل **محل** الاتصال عبر SSH أو Tailnet.

## Bonjour واسع النطاق (Unicast DNS-SD) عبر Tailscale

إذا كانت العقدة وGateway على شبكات مختلفة، فلن يعبر mDNS متعدد البث
الحدود. يمكنك الحفاظ على تجربة الاكتشاف نفسها بالتبديل إلى **unicast DNS‑SD**
("Wide‑Area Bonjour") عبر Tailscale.

الخطوات العامة:

1. شغّل خادم DNS على مضيف Gateway (يمكن الوصول إليه عبر Tailnet).
2. انشر سجلات DNS‑SD لـ `_openclaw-gw._tcp` ضمن منطقة مخصصة
   (مثال: `openclaw.internal.`).
3. كوّن **split DNS** في Tailscale بحيث يُحل النطاق الذي اخترته عبر
   خادم DNS ذلك للعملاء (بما في ذلك iOS).

يدعم OpenClaw أي نطاق اكتشاف؛ `openclaw.internal.` مجرد مثال.
تتصفح عقد iOS/Android كلًا من `local.` ونطاقك واسع النطاق المُكوَّن.

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

يثبت هذا CoreDNS ويكوّنه من أجل:

- الاستماع على المنفذ 53 فقط على واجهات Tailscale الخاصة بـ Gateway
- خدمة النطاق الذي اخترته (مثال: `openclaw.internal.`) من `~/.openclaw/dns/<domain>.db`

تحقق من جهاز متصل بـ tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### إعدادات DNS في Tailscale

في وحدة تحكم مسؤول Tailscale:

- أضف خادم أسماء يشير إلى عنوان IP الخاص بـ gateway على tailnet ‏(UDP/TCP 53).
- أضف split DNS بحيث يستخدم نطاق الاكتشاف الخاص بك خادم الأسماء ذلك.

بمجرد قبول العملاء DNS الخاص بـ tailnet، يمكن لعقد iOS واكتشاف CLI تصفح
`_openclaw-gw._tcp` في نطاق الاكتشاف الخاص بك دون بث متعدد.

### أمان مستمع Gateway (موصى به)

يرتبط منفذ Gateway WS (الافتراضي `18789`) بـ loopback افتراضيًا. للوصول عبر الشبكة المحلية/tailnet،
اربطه صراحةً وأبقِ المصادقة مفعلة.

لإعدادات tailnet فقط:

- عيّن `gateway.bind: "tailnet"` في `~/.openclaw/openclaw.json`.
- أعد تشغيل Gateway (أو أعد تشغيل تطبيق شريط القوائم في macOS).

## ما الذي يعلن

يعلن Gateway فقط عن `_openclaw-gw._tcp`. يوفّر Plugin المضمن `bonjour`
إعلان البث المتعدد على الشبكة المحلية عندما يكون Plugin مفعّلًا؛ بينما يظل نشر
DNS-SD واسع النطاق مملوكًا لـ Gateway.

## أنواع الخدمات

- `_openclaw-gw._tcp` — منارة نقل gateway (تستخدمها عقد macOS/iOS/Android).

## مفاتيح TXT (تلميحات غير سرية)

يعلن Gateway عن تلميحات صغيرة غير سرية لتسهيل تدفقات واجهة المستخدم:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (فقط عند تفعيل TLS)
- `gatewayTlsSha256=<sha256>` (فقط عند تفعيل TLS وتوفر البصمة)
- `canvasPort=<port>` (فقط عند تفعيل مضيف canvas؛ حاليًا هو نفسه `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (وضع mDNS الكامل فقط، تلميح اختياري عند توفر Tailnet)
- `sshPort=<port>` (وضع mDNS الكامل فقط؛ قد يحذفه DNS-SD واسع النطاق)
- `cliPath=<path>` (وضع mDNS الكامل فقط؛ لا يزال DNS-SD واسع النطاق يكتبه كتلميح تثبيت عن بُعد)

ملاحظات أمنية:

- سجلات Bonjour/mDNS TXT **غير مصادَق عليها**. يجب ألا يتعامل العملاء مع TXT كمصدر موثوق للتوجيه.
- يجب أن يوجّه العملاء باستخدام نقطة نهاية الخدمة المحلولة (SRV + A/AAAA). تعامل مع `lanHost` و`tailnetDns` و`gatewayPort` و`gatewayTlsSha256` كتلميحات فقط.
- يجب أن يستخدم الاستهداف التلقائي لـ SSH كذلك مضيف الخدمة المحلول، لا تلميحات TXT فقط.
- يجب ألا يسمح تثبيت TLS أبدًا لـ `gatewayTlsSha256` المعلن بتجاوز بصمة محفوظة سابقًا.
- يجب أن تتعامل عقد iOS/Android مع الاتصالات المباشرة القائمة على الاكتشاف على أنها **TLS فقط** وأن تتطلب تأكيدًا صريحًا من المستخدم قبل الوثوق ببصمة لأول مرة.

## تصحيح الأخطاء على macOS

أدوات مدمجة مفيدة:

- تصفح المثيلات:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- حل مثيل واحد (استبدل `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

إذا نجح التصفح وفشل الحل، فأنت غالبًا تواجه سياسة شبكة محلية أو
مشكلة في محلل mDNS.

## تصحيح الأخطاء في سجلات Gateway

يكتب Gateway ملف سجل دوّارًا (يُطبع عند بدء التشغيل باسم
`gateway log file: ...`). ابحث عن أسطر `bonjour:`، خصوصًا:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

يستخدم Bonjour اسم مضيف النظام لمضيف `.local` المعلن عندما يكون
تسمية DNS صالحة. إذا احتوى اسم مضيف النظام على مسافات أو شرطات سفلية أو أي
حرف آخر غير صالح في تسمية DNS، يعود OpenClaw إلى `openclaw.local`. عيّن
`OPENCLAW_MDNS_HOSTNAME=<name>` قبل بدء Gateway عندما تحتاج إلى
تسمية مضيف صريحة.

## تصحيح الأخطاء على عقدة iOS

تستخدم عقدة iOS ‏`NWBrowser` لاكتشاف `_openclaw-gw._tcp`.

لالتقاط السجلات:

- Settings → Gateway → Advanced → **سجلات تصحيح أخطاء الاكتشاف**
- Settings → Gateway → Advanced → **سجلات الاكتشاف** → أعد الإنتاج → **نسخ**

يتضمن السجل انتقالات حالة المتصفح وتغييرات مجموعة النتائج.

## متى تفعّل Bonjour

يبدأ Bonjour تلقائيًا عند بدء Gateway بتكوين فارغ على مضيفات macOS لأن
التطبيق المحلي وعقد iOS/Android القريبة تعتمد عادةً على اكتشاف الشبكة المحلية نفسها.

فعّل Bonjour صراحةً عندما يكون الاكتشاف التلقائي على الشبكة المحلية نفسها مفيدًا على Linux أو
Windows أو مضيف آخر غير macOS:

```bash
openclaw plugins enable bonjour
```

عند تفعيله، يستخدم Bonjour ‏`discovery.mdns.mode` لتحديد مقدار بيانات TXT الوصفية
المراد نشرها. الوضع الافتراضي هو `minimal`؛ استخدم `full` فقط عندما يحتاج العملاء المحليون إلى
تلميحات `cliPath` أو `sshPort`، واستخدم `off` لكبت بث الشبكة المحلية المتعدد دون
تغيير تفعيل Plugin.

## متى تعطّل Bonjour

اترك Bonjour معطلًا عندما يكون إعلان البث المتعدد على الشبكة المحلية غير ضروري أو غير متاح
أو ضارًا. الحالات الشائعة هي الخوادم غير macOS، وشبكات Docker bridge،
وWSL، أو سياسة شبكة تسقط بث mDNS المتعدد. في تلك البيئات يظل
Gateway قابلًا للوصول عبر عنوان URL المنشور أو SSH أو Tailnet أو DNS-SD واسع النطاق،
لكن الاكتشاف التلقائي عبر الشبكة المحلية غير موثوق.

فضّل تجاوز البيئة الحالي عندما تكون المشكلة خاصة بالنشر:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

يعطّل ذلك إعلان البث المتعدد على الشبكة المحلية دون تغيير تكوين Plugin.
وهو آمن لصور Docker وملفات الخدمات وسكربتات التشغيل وتصحيح الأخطاء لمرة واحدة
لأن الإعداد يختفي عندما تختفي البيئة.

استخدم تكوين Plugin عندما تريد عمدًا إيقاف Plugin اكتشاف الشبكة المحلية المضمن
لذلك التكوين من OpenClaw:

```bash
openclaw plugins disable bonjour
```

## ملاحظات Docker المهمة

يعطّل Plugin Bonjour المضمن إعلان البث المتعدد على الشبكة المحلية تلقائيًا في الحاويات المكتشفة
عندما لا يكون `OPENCLAW_DISABLE_BONJOUR` معيّنًا. عادةً لا تمرر شبكات Docker bridge
بث mDNS المتعدد (`224.0.0.251:5353`) بين الحاوية
والشبكة المحلية، لذلك نادرًا ما يجعل الإعلان من الحاوية الاكتشاف يعمل.

ملاحظات مهمة:

- يبدأ Bonjour تلقائيًا على مضيفات macOS ويكون اختياريًا في غيرها. إبقاؤه
  معطلًا لا يوقف Gateway؛ بل يتخطى فقط إعلان البث المتعدد على الشبكة المحلية.
- لا يغيّر تعطيل Bonjour ‏`gateway.bind`؛ لا يزال Docker يستخدم افتراضيًا
  `OPENCLAW_GATEWAY_BIND=lan` حتى يعمل منفذ المضيف المنشور.
- لا يعطّل تعطيل Bonjour ‏DNS-SD واسع النطاق. استخدم الاكتشاف واسع النطاق
  أو Tailnet عندما لا يكون Gateway والعقدة على الشبكة المحلية نفسها.
- لا يؤدي إعادة استخدام `OPENCLAW_CONFIG_DIR` نفسه خارج Docker إلى استمرار
  سياسة التعطيل التلقائي للحاوية.
- عيّن `OPENCLAW_DISABLE_BONJOUR=0` فقط لشبكات المضيف أو macvlan أو شبكة أخرى
  يُعرف أن بث mDNS المتعدد يمر عبرها؛ عيّنه إلى `1` لفرض التعطيل.

## استكشاف أخطاء Bonjour المعطل وإصلاحها

إذا لم تعد عقدة تكتشف Gateway تلقائيًا بعد إعداد Docker:

1. تأكد مما إذا كان Gateway يعمل في وضع تلقائي أو مفروض التشغيل أو مفروض الإيقاف:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. تأكد أن Gateway نفسه قابل للوصول عبر المنفذ المنشور:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. استخدم هدفًا مباشرًا عندما يكون Bonjour معطلًا:
   - Control UI أو الأدوات المحلية: `http://127.0.0.1:18789`
   - عملاء الشبكة المحلية: `http://<gateway-host>:18789`
   - العملاء عبر الشبكات: Tailnet MagicDNS، أو عنوان IP في Tailnet، أو نفق SSH، أو
     DNS-SD واسع النطاق

4. إذا فعّلت Plugin Bonjour عمدًا في Docker وفرضت الإعلان
   باستخدام `OPENCLAW_DISABLE_BONJOUR=0`، فاختبر البث المتعدد من المضيف:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   إذا كان التصفح فارغًا أو أظهرت سجلات Gateway إلغاءات مراقبة ciao متكررة،
   فأعد `OPENCLAW_DISABLE_BONJOUR=1` واستخدم مسارًا مباشرًا أو
   عبر Tailnet.

## أوضاع الفشل الشائعة

- **Bonjour لا يعبر الشبكات**: استخدم Tailnet أو SSH.
- **البث المتعدد محظور**: تعطل بعض شبكات Wi‑Fi ‏mDNS.
- **المعلن عالق في الفحص/الإعلان**: قد تترك المضيفات ذات البث المتعدد المحظور،
  أو جسور الحاويات، أو WSL، أو تغيّر الواجهات معلن ciao في حالة
  غير معلنة. يعيد OpenClaw المحاولة عدة مرات ثم يعطّل Bonjour
  لعملية Gateway الحالية بدلًا من إعادة تشغيل المعلن إلى الأبد.
- **شبكات Docker bridge**: يتعطل Bonjour تلقائيًا في الحاويات المكتشفة.
  عيّن `OPENCLAW_DISABLE_BONJOUR=0` فقط للمضيف أو macvlan أو شبكة أخرى
  قادرة على mDNS.
- **السكون / تغيّر الواجهات**: قد يسقط macOS نتائج mDNS مؤقتًا؛ أعد المحاولة.
- **التصفح يعمل لكن الحل يفشل**: أبقِ أسماء الأجهزة بسيطة (تجنب الرموز التعبيرية أو
  علامات الترقيم)، ثم أعد تشغيل Gateway. يُشتق اسم مثيل الخدمة من
  اسم المضيف، لذلك يمكن أن تربك الأسماء المعقدة جدًا بعض المحللات.

## أسماء المثيلات المهربة (`\032`)

غالبًا ما يهرب Bonjour/DNS‑SD البايتات في أسماء مثيلات الخدمة كتسلسلات عشرية `\DDD`
(مثلًا تتحول المسافات إلى `\032`).

- هذا طبيعي على مستوى البروتوكول.
- يجب أن تفك واجهات المستخدم الترميز للعرض (يستخدم iOS ‏`BonjourEscapes.decode`).

## التفعيل / التعطيل / التكوين

- تبدأ مضيفات macOS تشغيل Plugin اكتشاف الشبكة المحلية المضمن تلقائيًا افتراضيًا.
- `openclaw plugins enable bonjour` يفعّل Plugin اكتشاف الشبكة المحلية المضمن على المضيفات التي لا يكون مفعّلًا عليها افتراضيًا.
- `openclaw plugins disable bonjour` يعطّل إعلان البث المتعدد على الشبكة المحلية بتعطيل Plugin المضمن.
- `OPENCLAW_DISABLE_BONJOUR=1` يعطّل إعلان البث المتعدد على الشبكة المحلية دون تغيير تكوين Plugin؛ القيم المقبولة التي تعني الصواب هي `1` و`true` و`yes` و`on` (قديم: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` يفرض تشغيل إعلان البث المتعدد على الشبكة المحلية، بما في ذلك داخل الحاويات المكتشفة؛ القيم المقبولة التي تعني الخطأ هي `0` و`false` و`no` و`off`.
- عندما يكون Plugin Bonjour مفعّلًا و`OPENCLAW_DISABLE_BONJOUR` غير معيّن، يعلن Bonjour على المضيفات العادية ويتعطل تلقائيًا داخل الحاويات المكتشفة.
- يتحكم `gateway.bind` في `~/.openclaw/openclaw.json` في وضع ربط Gateway.
- يتجاوز `OPENCLAW_SSH_PORT` منفذ SSH عندما يُعلن عن `sshPort` (قديم: `OPENCLAW_SSH_PORT`).
- ينشر `OPENCLAW_TAILNET_DNS` تلميح MagicDNS في TXT عندما يكون وضع mDNS الكامل مفعّلًا (قديم: `OPENCLAW_TAILNET_DNS`).
- يتجاوز `OPENCLAW_CLI_PATH` مسار CLI المعلن (قديم: `OPENCLAW_CLI_PATH`).

## مستندات ذات صلة

- سياسة الاكتشاف واختيار النقل: [الاكتشاف](/ar/gateway/discovery)
- إقران Node + الموافقات: [إقران Gateway](/ar/gateway/pairing)
