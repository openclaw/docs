---
read_when:
    - استكشاف مشكلات اكتشاف Bonjour وإصلاحها على macOS/iOS
    - تغيير أنواع خدمات mDNS أو سجلات TXT أو تجربة مستخدم الاكتشاف
summary: اكتشاف Bonjour/mDNS + تصحيح الأخطاء (إشارات Gateway، والعملاء، وأنماط الفشل الشائعة)
title: اكتشاف Bonjour
x-i18n:
    generated_at: "2026-04-30T07:56:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0720451843aae0509949324e51f3a23dc69e366e68de851c595ce76c8ab0eec9
    source_path: gateway/bonjour.md
    workflow: 16
---

# اكتشاف Bonjour / mDNS

يستخدم OpenClaw خدمة Bonjour (mDNS / DNS‑SD) لاكتشاف Gateway نشط (نقطة نهاية WebSocket).
يُعد تصفح البث المتعدد `local.` **وسيلة مريحة خاصة بالشبكة المحلية فقط**. يتولى Plugin المضمّن `bonjour`
إعلانات الشبكة المحلية ويكون مفعّلا افتراضيا. للاكتشاف عبر الشبكات،
يمكن أيضا نشر المنارة نفسها عبر نطاق DNS-SD واسع النطاق مُهيأ.
يبقى الاكتشاف قائما على أفضل محاولة ولا يستبدل الاتصال عبر SSH أو الاتصال المستند إلى Tailnet.

## Bonjour واسع النطاق (Unicast DNS-SD) عبر Tailscale

إذا كانت Node وGateway على شبكتين مختلفتين، فلن يتجاوز mDNS متعدد البث هذا
الحد. يمكنك الحفاظ على تجربة الاكتشاف نفسها بالانتقال إلى **unicast DNS‑SD**
("Wide‑Area Bonjour") عبر Tailscale.

الخطوات العامة:

1. شغّل خادم DNS على مضيف Gateway (يمكن الوصول إليه عبر Tailnet).
2. انشر سجلات DNS‑SD لـ `_openclaw-gw._tcp` ضمن منطقة مخصصة
   (مثال: `openclaw.internal.`).
3. هيّئ Tailscale **split DNS** بحيث يُحل نطاقك المختار عبر ذلك
   الخادم DNS للعملاء (بما في ذلك iOS).

يدعم OpenClaw أي نطاق اكتشاف؛ `openclaw.internal.` مجرد مثال.
تتصفح Node الخاصة بـ iOS/Android كلا من `local.` ونطاقك واسع النطاق المُهيأ.

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

يثبّت هذا CoreDNS ويهيئه من أجل:

- الاستماع على المنفذ 53 فقط على واجهات Tailscale الخاصة بـ Gateway
- تقديم نطاقك المختار (مثال: `openclaw.internal.`) من `~/.openclaw/dns/<domain>.db`

تحقق من جهاز متصل بـ tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### إعدادات DNS في Tailscale

في وحدة إدارة Tailscale:

- أضف خادم أسماء يشير إلى عنوان IP الخاص بـ Gateway على tailnet (UDP/TCP 53).
- أضف split DNS بحيث يستخدم نطاق الاكتشاف ذلك خادم الأسماء.

بمجرد أن يقبل العملاء DNS الخاص بـ tailnet، يمكن لـ Node الخاصة بـ iOS واكتشاف CLI تصفح
`_openclaw-gw._tcp` في نطاق الاكتشاف لديك من دون بث متعدد.

### أمان مستمع Gateway (موصى به)

يرتبط منفذ WS الخاص بـ Gateway (الافتراضي `18789`) بـ loopback افتراضيا. للوصول عبر LAN/tailnet،
اربطه صراحة وأبق المصادقة مفعّلة.

لإعدادات tailnet فقط:

- اضبط `gateway.bind: "tailnet"` في `~/.openclaw/openclaw.json`.
- أعد تشغيل Gateway (أو أعد تشغيل تطبيق شريط قوائم macOS).

## ما الذي يعلن

يعلن Gateway فقط عن `_openclaw-gw._tcp`. يوفّر Plugin المضمّن `bonjour` إعلانات البث المتعدد على LAN؛ أما نشر DNS-SD واسع النطاق فيبقى
مملوكا لـ Gateway.

## أنواع الخدمات

- `_openclaw-gw._tcp` — منارة نقل Gateway (تستخدمها Node الخاصة بـ macOS/iOS/Android).

## مفاتيح TXT (تلميحات غير سرية)

يعلن Gateway عن تلميحات صغيرة غير سرية لتسهيل مسارات واجهة المستخدم:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (فقط عند تمكين TLS)
- `gatewayTlsSha256=<sha256>` (فقط عند تمكين TLS وتوفر البصمة)
- `canvasPort=<port>` (فقط عند تمكين مضيف canvas؛ حاليا هو نفسه `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (وضع mDNS الكامل فقط، تلميح اختياري عند توفر Tailnet)
- `sshPort=<port>` (وضع mDNS الكامل فقط؛ قد يحذفه DNS-SD واسع النطاق)
- `cliPath=<path>` (وضع mDNS الكامل فقط؛ لا يزال DNS-SD واسع النطاق يكتبه كتلميح تثبيت عن بُعد)

ملاحظات الأمان:

- سجلات Bonjour/mDNS TXT **غير موثقة**. يجب ألا يتعامل العملاء مع TXT كمصدر موثوق للتوجيه.
- ينبغي للعملاء التوجيه باستخدام نقطة نهاية الخدمة التي تم حلها (SRV + A/AAAA). تعامل مع `lanHost` و`tailnetDns` و`gatewayPort` و`gatewayTlsSha256` كتلميحات فقط.
- ينبغي كذلك أن يستخدم الاستهداف التلقائي عبر SSH مضيف الخدمة الذي تم حله، لا التلميحات الموجودة في TXT فقط.
- يجب ألا يسمح تثبيت TLS أبدا لقيمة `gatewayTlsSha256` معلنة بتجاوز pin مخزّن مسبقا.
- ينبغي أن تتعامل Node الخاصة بـ iOS/Android مع الاتصالات المباشرة المستندة إلى الاكتشاف على أنها **TLS فقط** وأن تتطلب تأكيدا صريحا من المستخدم قبل الوثوق ببصمة للمرة الأولى.

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

إذا كان التصفح يعمل لكن الحل يفشل، فأنت غالبا تواجه سياسة LAN أو
مشكلة في محلل mDNS.

## التصحيح في سجلات Gateway

يكتب Gateway ملف سجل دوارا (يُطبع عند بدء التشغيل بصيغة
`gateway log file: ...`). ابحث عن أسطر `bonjour:`، خصوصا:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

يستخدم Bonjour اسم مضيف النظام للمضيف `.local` المعلن عنه عندما يكون
تسمية DNS صالحة. إذا كان اسم مضيف النظام يحتوي على مسافات أو شرطات سفلية أو أي
محرف آخر غير صالح لتسمية DNS، يعود OpenClaw إلى `openclaw.local`. اضبط
`OPENCLAW_MDNS_HOSTNAME=<name>` قبل بدء Gateway عندما تحتاج إلى
تسمية مضيف صريحة.

## التصحيح على Node في iOS

تستخدم Node الخاصة بـ iOS `NWBrowser` لاكتشاف `_openclaw-gw._tcp`.

لالتقاط السجلات:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → أعد الإنتاج → **Copy**

يتضمن السجل انتقالات حالة المتصفح وتغييرات مجموعة النتائج.

## متى تعطل Bonjour

عطّل Bonjour فقط عندما تكون إعلانات البث المتعدد على LAN غير متاحة أو ضارة.
الحالة الشائعة هي Gateway يعمل خلف شبكة Docker bridge أو WSL أو
سياسة شبكة تُسقط بث mDNS المتعدد. في تلك البيئات يبقى Gateway
قابلا للوصول عبر عنوان URL المنشور أو SSH أو Tailnet أو DNS-SD واسع النطاق،
لكن الاكتشاف التلقائي عبر LAN لا يكون موثوقا.

فضّل تجاوز البيئة الحالي عندما تكون المشكلة مرتبطة بالنشر:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

يعطّل ذلك إعلانات البث المتعدد على LAN من دون تغيير إعدادات Plugin.
وهو آمن لصور Docker وملفات الخدمة وسكربتات التشغيل والتصحيح لمرة واحدة
لأن الإعداد يختفي عندما تختفي البيئة.

استخدم إعدادات Plugin فقط عندما تريد عمدا إيقاف تشغيل
Plugin اكتشاف LAN المضمّن لذلك إعداد OpenClaw:

```bash
openclaw plugins disable bonjour
```

## ملاحظات Docker المهمة

يعطّل Plugin Bonjour المضمّن تلقائيا إعلانات البث المتعدد على LAN في الحاويات
المكتشفة عندما لا يكون `OPENCLAW_DISABLE_BONJOUR` مضبوطا. شبكات Docker bridge
عادة لا تعيد توجيه بث mDNS المتعدد (`224.0.0.251:5353`) بين الحاوية
وLAN، لذلك نادرا ما يجعل الإعلان من الحاوية الاكتشاف يعمل.

ملاحظات مهمة:

- تعطيل Bonjour لا يوقف Gateway. إنه يوقف فقط إعلانات البث المتعدد على LAN.
- تعطيل Bonjour لا يغيّر `gateway.bind`؛ لا يزال Docker يستخدم افتراضيا
  `OPENCLAW_GATEWAY_BIND=lan` لكي يعمل منفذ المضيف المنشور.
- تعطيل Bonjour لا يعطّل DNS-SD واسع النطاق. استخدم الاكتشاف واسع النطاق
  أو Tailnet عندما لا يكون Gateway وNode على LAN نفسها.
- إعادة استخدام `OPENCLAW_CONFIG_DIR` نفسه خارج Docker لا تجعل
  سياسة التعطيل التلقائي للحاوية مستمرة.
- اضبط `OPENCLAW_DISABLE_BONJOUR=0` فقط للشبكات المضيفة أو macvlan أو أي
  شبكة أخرى يُعرف أن بث mDNS المتعدد يمر عبرها؛ اضبطه على `1` لفرض التعطيل.

## استكشاف أخطاء Bonjour المعطّل

إذا لم تعد Node تكتشف Gateway تلقائيا بعد إعداد Docker:

1. تأكد مما إذا كان Gateway يعمل في وضع تلقائي أو مفروض التشغيل أو مفروض الإيقاف:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. تأكد من أن Gateway نفسه قابل للوصول عبر المنفذ المنشور:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. استخدم هدفا مباشرا عندما يكون Bonjour معطلا:
   - Control UI أو الأدوات المحلية: `http://127.0.0.1:18789`
   - عملاء LAN: `http://<gateway-host>:18789`
   - العملاء عبر الشبكات: Tailnet MagicDNS أو عنوان IP الخاص بـ Tailnet أو نفق SSH أو
     DNS-SD واسع النطاق

4. إذا مكّنت Bonjour عمدا في Docker باستخدام
   `OPENCLAW_DISABLE_BONJOUR=0`، فاختبر البث المتعدد من المضيف:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   إذا كان التصفح فارغا أو أظهرت سجلات Gateway إلغاءات متكررة من مراقب ciao،
   فأعد `OPENCLAW_DISABLE_BONJOUR=1` واستخدم مسارا مباشرا أو
   مسارا عبر Tailnet.

## أوضاع الفشل الشائعة

- **Bonjour لا يعبر الشبكات**: استخدم Tailnet أو SSH.
- **البث المتعدد محجوب**: تعطل بعض شبكات Wi‑Fi خدمة mDNS.
- **المعلِن عالق في الفحص/الإعلان**: يمكن للمضيفين ذوي البث المتعدد المحجوب،
  وجسور الحاويات، وWSL، أو تغيّر الواجهات أن تترك معلن ciao في
  حالة غير معلنة. يعيد OpenClaw المحاولة عدة مرات ثم يعطل Bonjour
  لعملية Gateway الحالية بدلا من إعادة تشغيل المعلن إلى الأبد.
- **شبكات Docker bridge**: يتعطل Bonjour تلقائيا في الحاويات المكتشفة.
  اضبط `OPENCLAW_DISABLE_BONJOUR=0` فقط للمضيف أو macvlan أو شبكة أخرى
  قادرة على mDNS.
- **السكون / تغيّر الواجهات**: قد يسقط macOS نتائج mDNS مؤقتا؛ أعد المحاولة.
- **التصفح يعمل لكن الحل يفشل**: أبق أسماء الأجهزة بسيطة (تجنب الرموز التعبيرية أو
  علامات الترقيم)، ثم أعد تشغيل Gateway. يُشتق اسم نسخة الخدمة من
  اسم المضيف، لذلك قد تربك الأسماء المعقدة للغاية بعض المحللات.

## أسماء النسخ المهربة (`\032`)

غالبا ما يهرّب Bonjour/DNS‑SD البايتات في أسماء نسخ الخدمة كسلاسل عشرية `\DDD`
(مثلا تتحول المسافات إلى `\032`).

- هذا طبيعي على مستوى البروتوكول.
- ينبغي لواجهات المستخدم فك الترميز للعرض (يستخدم iOS `BonjourEscapes.decode`).

## التعطيل / الإعدادات

- `openclaw plugins disable bonjour` يعطل إعلانات البث المتعدد على LAN بتعطيل Plugin المضمّن.
- `openclaw plugins enable bonjour` يستعيد Plugin اكتشاف LAN الافتراضي.
- `OPENCLAW_DISABLE_BONJOUR=1` يعطل إعلانات البث المتعدد على LAN من دون تغيير إعدادات Plugin؛ القيم المقبولة التي تعني true هي `1` و`true` و`yes` و`on` (قديم: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` يفرض تشغيل إعلانات البث المتعدد على LAN، بما في ذلك داخل الحاويات المكتشفة؛ القيم المقبولة التي تعني false هي `0` و`false` و`no` و`off`.
- عندما لا يكون `OPENCLAW_DISABLE_BONJOUR` مضبوطا، يعلن Bonjour على المضيفين العاديين ويتعطل تلقائيا داخل الحاويات المكتشفة.
- يتحكم `gateway.bind` في `~/.openclaw/openclaw.json` بوضع ربط Gateway.
- يتجاوز `OPENCLAW_SSH_PORT` منفذ SSH عندما يتم الإعلان عن `sshPort` (قديم: `OPENCLAW_SSH_PORT`).
- ينشر `OPENCLAW_TAILNET_DNS` تلميح MagicDNS في TXT عند تمكين وضع mDNS الكامل (قديم: `OPENCLAW_TAILNET_DNS`).
- يتجاوز `OPENCLAW_CLI_PATH` مسار CLI المعلن عنه (قديم: `OPENCLAW_CLI_PATH`).

## مستندات ذات صلة

- سياسة الاكتشاف واختيار النقل: [Discovery](/ar/gateway/discovery)
- إقران Node + الموافقات: [إقران Gateway](/ar/gateway/pairing)
