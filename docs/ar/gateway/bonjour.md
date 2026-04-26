---
read_when:
    - تصحيح مشكلات اكتشاف Bonjour على macOS/iOS
    - تغيير أنواع خدمة mDNS أو سجلات TXT أو تجربة الاكتشاف
summary: اكتشاف Bonjour/mDNS + تصحيح الأخطاء (إشارات Gateway والعملاء وأوضاع الفشل الشائعة)
title: اكتشاف Bonjour
x-i18n:
    generated_at: "2026-04-26T11:28:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: b055021bdcd92740934823dea2acf758c6ec991a15c0a315426dc359a7eea093
    source_path: gateway/bonjour.md
    workflow: 15
---

# اكتشاف Bonjour / mDNS

يستخدم OpenClaw بروتوكول Bonjour ‏(mDNS / DNS‑SD) لاكتشاف Gateway نشط (نقطة نهاية WebSocket).
ويُعد التصفح متعدد الإرسال `local.` **وسيلة راحة داخل الشبكة المحلية فقط**. يتولى Plugin
`bonjour` المضمّن مسؤولية الإعلان داخل الشبكة المحلية، وهو مفعّل افتراضيًا. أما بالنسبة للاكتشاف عبر الشبكات،
فيمكن أيضًا نشر الإشارة نفسها من خلال نطاق DNS-SD واسع النطاق مهيأ.
ويظل الاكتشاف مع ذلك بأفضل جهد ممكن ولا **يستبدل** الاتصال عبر SSH أو Tailnet.

## Bonjour واسع النطاق (Unicast DNS-SD) عبر Tailscale

إذا كانت العقدة وGateway على شبكتين مختلفتين، فلن يعبر mDNS متعدد الإرسال
هذا الحد. ويمكنك الحفاظ على تجربة الاكتشاف نفسها بالانتقال إلى **Unicast DNS‑SD**
("Wide‑Area Bonjour") عبر Tailscale.

الخطوات العامة:

1. شغّل خادم DNS على مضيف Gateway (يمكن الوصول إليه عبر Tailnet).
2. انشر سجلات DNS‑SD لـ `_openclaw-gw._tcp` تحت نطاق مخصص
   (مثال: `openclaw.internal.`).
3. هيّئ **split DNS** في Tailscale بحيث يُحل النطاق الذي اخترته عبر
   خادم DNS هذا للعملاء (بما في ذلك iOS).

يدعم OpenClaw أي نطاق اكتشاف؛ و`openclaw.internal.` مجرد مثال.
تتصفح عقد iOS/Android كلًا من `local.` والنطاق واسع النطاق الذي قمت بتهيئته.

### إعدادات Gateway (موصى بها)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### إعداد خادم DNS لمرة واحدة (على مضيف Gateway)

```bash
openclaw dns setup --apply
```

يؤدي هذا إلى تثبيت CoreDNS وتهيئته من أجل:

- الاستماع على المنفذ 53 فقط على واجهات Tailscale الخاصة بـ Gateway
- خدمة النطاق الذي اخترته (مثال: `openclaw.internal.`) من `~/.openclaw/dns/<domain>.db`

تحقق من جهاز متصل بـ tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### إعدادات DNS في Tailscale

في وحدة تحكم إدارة Tailscale:

- أضف nameserver يشير إلى عنوان tailnet IP الخاص بـ Gateway ‏(UDP/TCP 53).
- أضف split DNS بحيث يستخدم نطاق الاكتشاف الذي اخترته ذلك الـ nameserver.

بمجرد أن تقبل الأجهزة العميلة DNS الخاص بـ tailnet، يمكن لعقد iOS واكتشاف CLI
تصفح `_openclaw-gw._tcp` في نطاق الاكتشاف لديك دون استخدام البث متعدد الإرسال.

### أمان مستمع Gateway (موصى به)

يرتبط منفذ WebSocket الخاص بـ Gateway ‏(الافتراضي `18789`) بالـ loopback افتراضيًا. وللوصول عبر الشبكة المحلية/‏tailnet،
اربطه صراحةً وأبقِ المصادقة مفعلة.

بالنسبة لإعدادات tailnet فقط:

- اضبط `gateway.bind: "tailnet"` في `~/.openclaw/openclaw.json`.
- أعد تشغيل Gateway (أو أعد تشغيل تطبيق شريط القائمة على macOS).

## ما الذي يعلن

فقط Gateway هو الذي يعلن عن `_openclaw-gw._tcp`. ويتم توفير إعلان
البث متعدد الإرسال داخل الشبكة المحلية بواسطة Plugin `bonjour` المضمّن؛ بينما يظل نشر DNS-SD واسع النطاق
مملوكًا لـ Gateway.

## أنواع الخدمة

- `_openclaw-gw._tcp` — إشارة نقل Gateway (تستخدمها عقد macOS/iOS/Android).

## مفاتيح TXT (تلميحات غير سرية)

يعلن Gateway عن تلميحات صغيرة غير سرية لتسهيل تدفقات واجهة المستخدم:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (فقط عند تفعيل TLS)
- `gatewayTlsSha256=<sha256>` (فقط عند تفعيل TLS وتوفر البصمة)
- `canvasPort=<port>` (فقط عند تفعيل مضيف canvas؛ وهو حاليًا نفس `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (فقط في وضع mDNS الكامل، تلميح اختياري عند توفر Tailnet)
- `sshPort=<port>` (فقط في وضع mDNS الكامل؛ وقد يحذفه DNS-SD واسع النطاق)
- `cliPath=<path>` (فقط في وضع mDNS الكامل؛ وما يزال DNS-SD واسع النطاق يكتبه كتلميح للتثبيت عن بُعد)

ملاحظات الأمان:

- سجلات TXT في Bonjour/mDNS **غير موثقة**. يجب ألا تتعامل الأجهزة العميلة مع TXT على أنه توجيه موثوق.
- يجب على الأجهزة العميلة التوجيه باستخدام نقطة نهاية الخدمة المحلولة (SRV + A/AAAA). وتعامل مع `lanHost` و`tailnetDns` و`gatewayPort` و`gatewayTlsSha256` على أنها تلميحات فقط.
- يجب كذلك أن يستخدم الاستهداف التلقائي لـ SSH مضيف الخدمة المحلول، وليس تلميحات TXT فقط.
- يجب ألا يسمح تثبيت TLS أبدًا لـ `gatewayTlsSha256` المُعلن عنه بتجاوز بصمة مثبتة مخزنة سابقًا.
- يجب على عقد iOS/Android التعامل مع الاتصالات المباشرة القائمة على الاكتشاف على أنها **TLS-only** وأن تطلب تأكيدًا صريحًا من المستخدم قبل الوثوق ببصمة لأول مرة.

## تصحيح الأخطاء على macOS

أدوات مدمجة مفيدة:

- استعراض المثيلات:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- تحليل مثيل واحد (استبدل `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

إذا كان الاستعراض يعمل ولكن التحليل يفشل، فعادةً ما تكون المشكلة في سياسة الشبكة المحلية أو
في محلل mDNS.

## تصحيح الأخطاء في سجلات Gateway

يكتب Gateway ملف سجل متجددًا (يُطبع عند بدء التشغيل بصيغة
`gateway log file: ...`). ابحث عن أسطر `bonjour:`، وبخاصة:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

## تصحيح الأخطاء على عقدة iOS

تستخدم عقدة iOS المكوّن `NWBrowser` لاكتشاف `_openclaw-gw._tcp`.

لالتقاط السجلات:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → أعد إنتاج المشكلة → **Copy**

يتضمن السجل انتقالات حالة المتصفح وتغييرات مجموعة النتائج.

## متى يجب تعطيل Bonjour

عطّل Bonjour فقط عندما يكون إعلان البث متعدد الإرسال داخل الشبكة المحلية غير متاح أو مسببًا للمشكلات.
والحالة الشائعة هي تشغيل Gateway خلف Docker bridge networking أو WSL أو
سياسة شبكة تُسقط البث متعدد الإرسال لـ mDNS. في هذه البيئات يظل Gateway
قابلًا للوصول عبر عنوان URL المنشور أو SSH أو Tailnet أو DNS-SD واسع النطاق،
لكن الاكتشاف التلقائي داخل الشبكة المحلية لا يكون موثوقًا.

فضّل استخدام تجاوز البيئة الحالي عندما تكون المشكلة خاصة بالنشر:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

يؤدي هذا إلى تعطيل إعلان البث متعدد الإرسال داخل الشبكة المحلية دون تغيير إعدادات Plugin.
وهو آمن لصور Docker وملفات الخدمة ونصوص التشغيل وتصحيح الأخطاء لمرة واحدة
لأن الإعداد يختفي عند اختفاء البيئة.

استخدم إعدادات Plugin فقط عندما تريد عمدًا إيقاف
Plugin الاكتشاف المحلي المضمّن لهذا الإعداد في OpenClaw:

```bash
openclaw plugins disable bonjour
```

## مشكلات Docker الشائعة

يضبط Docker Compose المضمّن القيمة `OPENCLAW_DISABLE_BONJOUR=1` لخدمة Gateway
افتراضيًا. فعادةً لا تمرر شبكات Docker bridge البث متعدد الإرسال لـ mDNS
(`224.0.0.251:5353`) بين الحاوية والشبكة المحلية، لذا فإن إبقاء Bonjour مفعّلًا قد
ينتج عنه إخفاقات متكررة من ciao في `probing` أو `announcing` دون أن يجعل الاكتشاف
يعمل.

ملاحظات مهمة:

- لا يؤدي تعطيل Bonjour إلى إيقاف Gateway. بل يوقف فقط
  الإعلان متعدد الإرسال داخل الشبكة المحلية.
- لا يؤدي تعطيل Bonjour إلى تغيير `gateway.bind`؛ إذ لا يزال Docker يستخدم افتراضيًا
  `OPENCLAW_GATEWAY_BIND=lan` حتى يعمل منفذ المضيف المنشور.
- لا يؤدي تعطيل Bonjour إلى تعطيل DNS-SD واسع النطاق. استخدم الاكتشاف واسع النطاق
  أو Tailnet عندما لا يكون Gateway والعقدة على الشبكة المحلية نفسها.
- لا تؤدي إعادة استخدام `OPENCLAW_CONFIG_DIR` نفسه خارج Docker إلى وراثة
  افتراضي Compose إلا إذا كانت البيئة لا تزال تضبط `OPENCLAW_DISABLE_BONJOUR`.
- اضبط `OPENCLAW_DISABLE_BONJOUR=0` فقط عند استخدام host networking أو macvlan أو شبكة أخرى
  معروف أنها تمرر البث متعدد الإرسال لـ mDNS.

## استكشاف أخطاء Bonjour المعطّل وإصلاحها

إذا لم تعد العقدة تكتشف Gateway تلقائيًا بعد إعداد Docker:

1. تأكد مما إذا كان Gateway يوقف الإعلان المحلي عمدًا:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. تأكد من أن Gateway نفسه يمكن الوصول إليه عبر المنفذ المنشور:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. استخدم هدفًا مباشرًا عندما يكون Bonjour معطّلًا:
   - Control UI أو الأدوات المحلية: `http://127.0.0.1:18789`
   - عملاء الشبكة المحلية: `http://<gateway-host>:18789`
   - العملاء عبر الشبكات: Tailnet MagicDNS أو Tailnet IP أو SSH tunnel أو
     DNS-SD واسع النطاق

4. إذا كنت قد فعّلت Bonjour عمدًا في Docker باستخدام
   `OPENCLAW_DISABLE_BONJOUR=0`، فاختبر البث متعدد الإرسال من المضيف:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   إذا كان الاستعراض فارغًا أو أظهرت سجلات Gateway عمليات إلغاء متكررة من
   ciao watchdog، فأعد `OPENCLAW_DISABLE_BONJOUR=1` واستخدم مسارًا مباشرًا أو
   عبر Tailnet.

## أوضاع الفشل الشائعة

- **لا يعبر Bonjour بين الشبكات**: استخدم Tailnet أو SSH.
- **البث متعدد الإرسال محظور**: بعض شبكات Wi‑Fi تعطل mDNS.
- **تعطل المعلن في probing/announcing**: يمكن للمضيفين الذين لديهم بث متعدد الإرسال محظور،
  أو جسور الحاويات، أو WSL، أو تغيّر الواجهات أن يتركوا معلن ciao في
  حالة غير مُعلن عنها. يحاول OpenClaw عدة مرات ثم يعطّل Bonjour
  لعملية Gateway الحالية بدلًا من إعادة تشغيل المعلن إلى ما لا نهاية.
- **Docker bridge networking**: يعطّل Docker Compose المضمّن Bonjour
  افتراضيًا باستخدام `OPENCLAW_DISABLE_BONJOUR=1`. اضبطه على `0` فقط عند استخدام host
  أو macvlan أو شبكة أخرى تدعم mDNS.
- **السكون / تغيّر الواجهة**: قد يقوم macOS مؤقتًا بإسقاط نتائج mDNS؛ أعد المحاولة.
- **الاستعراض يعمل لكن التحليل يفشل**: اجعل أسماء الأجهزة بسيطة (تجنب الرموز التعبيرية أو
  علامات الترقيم)، ثم أعد تشغيل Gateway. فاسم مثيل الخدمة مشتق من
  اسم المضيف، لذا يمكن للأسماء المعقدة جدًا أن تربك بعض المحللات.

## أسماء المثيلات المُهربة (`\032`)

غالبًا ما يقوم Bonjour/DNS‑SD بتهريب البايتات في أسماء مثيلات الخدمة كسلاسل
عشرية من الشكل `\DDD` (مثلًا تتحول المسافات إلى `\032`).

- هذا أمر طبيعي على مستوى البروتوكول.
- يجب على واجهات المستخدم فك ترميزها للعرض (يستخدم iOS `BonjourEscapes.decode`).

## التعطيل / الإعدادات

- يؤدي `openclaw plugins disable bonjour` إلى تعطيل الإعلان متعدد الإرسال داخل الشبكة المحلية عبر تعطيل Plugin المضمّن.
- يؤدي `openclaw plugins enable bonjour` إلى استعادة Plugin الاكتشاف المحلي الافتراضي.
- يؤدي `OPENCLAW_DISABLE_BONJOUR=1` إلى تعطيل الإعلان متعدد الإرسال داخل الشبكة المحلية دون تغيير إعدادات Plugin؛ والقيم المقبولة التي تعني true هي `1` و`true` و`yes` و`on` (الاسم القديم: `OPENCLAW_DISABLE_BONJOUR`).
- يضبط Docker Compose القيمة `OPENCLAW_DISABLE_BONJOUR=1` افتراضيًا عند استخدام bridge networking؛ تجاوزها باستخدام `OPENCLAW_DISABLE_BONJOUR=0` فقط عندما يكون البث متعدد الإرسال لـ mDNS متاحًا.
- يتحكم `gateway.bind` في `~/.openclaw/openclaw.json` في وضع ربط Gateway.
- يتجاوز `OPENCLAW_SSH_PORT` منفذ SSH عندما يتم الإعلان عن `sshPort` (الاسم القديم: `OPENCLAW_SSH_PORT`).
- ينشر `OPENCLAW_TAILNET_DNS` تلميح MagicDNS في TXT عند تفعيل وضع mDNS الكامل (الاسم القديم: `OPENCLAW_TAILNET_DNS`).
- يتجاوز `OPENCLAW_CLI_PATH` مسار CLI المُعلن عنه (الاسم القديم: `OPENCLAW_CLI_PATH`).

## وثائق ذات صلة

- سياسة الاكتشاف واختيار النقل: [الاكتشاف](/ar/gateway/discovery)
- اقتران العقدة + الموافقات: [اقتران Gateway](/ar/gateway/pairing)
