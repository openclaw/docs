---
read_when:
    - تصحيح مشكلات اكتشاف Bonjour على macOS/iOS
    - تغيير أنواع خدمة mDNS أو سجلات TXT أو تجربة استخدام الاكتشاف
summary: اكتشاف Bonjour/mDNS + تصحيح الأخطاء (إشارات Gateway، والعملاء، وأوضاع الفشل الشائعة)
title: اكتشاف Bonjour
x-i18n:
    generated_at: "2026-04-24T07:40:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62961714a0c9880be457c254e1cfc1701020ea51b89f2582757cddc8b3dd2113
    source_path: gateway/bonjour.md
    workflow: 15
---

# اكتشاف Bonjour / mDNS

يستخدم OpenClaw Bonjour ‏(mDNS / DNS‑SD) لاكتشاف Gateway نشط (نقطة نهاية WebSocket).
ويُعد الاستعراض عبر البث المتعدد لـ `local.` **وسيلة مريحة على الشبكة المحلية فقط**. يمتلك
Plugin ‏`bonjour` المضمّن عملية الإعلان على الشبكة المحلية، ويكون مفعّلًا افتراضيًا. أما للاكتشاف عبر الشبكات،
فيمكن أيضًا نشر الإشارة نفسها عبر نطاق DNS-SD واسع النطاق مهيأ.
ويظل الاكتشاف قائمًا على أفضل جهد، ولا **يستبدل** الاتصال عبر SSH أو Tailnet.

## Bonjour واسع النطاق (Unicast DNS-SD) عبر Tailscale

إذا كانت العقدة وGateway على شبكتين مختلفتين، فلن يعبر mDNS متعدد البث
هذا الحد. ويمكنك الاحتفاظ بتجربة الاكتشاف نفسها عبر التحول إلى **Unicast DNS‑SD**
("Wide‑Area Bonjour") فوق Tailscale.

الخطوات عالية المستوى:

1. شغّل خادم DNS على مضيف Gateway (يمكن الوصول إليه عبر Tailnet).
2. انشر سجلات DNS‑SD للخدمة `_openclaw-gw._tcp` تحت نطاق مخصص
   (مثال: `openclaw.internal.`).
3. اضبط **split DNS** في Tailscale بحيث يُحل نطاقك المختار عبر
   خادم DNS هذا للعملاء (بما في ذلك iOS).

يدعم OpenClaw أي نطاق اكتشاف؛ و`openclaw.internal.` مجرد مثال.
تستعرض عقد iOS/Android كلاً من `local.` ونطاقك واسع النطاق المهيأ.

### إعداد Gateway (مستحسن)

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

يؤدي ذلك إلى تثبيت CoreDNS وضبطه بحيث:

- يستمع على المنفذ 53 فقط على واجهات Tailscale الخاصة بـ Gateway
- يخدم نطاقك المختار (مثال: `openclaw.internal.`) من `~/.openclaw/dns/<domain>.db`

تحقق من ذلك من جهاز متصل بـ tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### إعدادات DNS في Tailscale

في وحدة تحكم إدارة Tailscale:

- أضف nameserver يشير إلى عنوان tailnet IP الخاص بـ Gateway (UDP/TCP 53).
- أضف split DNS بحيث يستخدم نطاق الاكتشاف لديك هذا nameserver.

بمجرد أن تقبل الأجهزة العميلة DNS الخاص بـ tailnet، يمكن لعقد iOS واكتشاف CLI
استعراض `_openclaw-gw._tcp` في نطاق الاكتشاف لديك من دون البث المتعدد.

### أمان مستمع Gateway (مستحسن)

يرتبط منفذ WS الخاص بـ Gateway (الافتراضي `18789`) بالـ loopback افتراضيًا. وللوصول عبر الشبكة المحلية/tailnet،
قم بالربط صراحةً مع إبقاء المصادقة مفعّلة.

لإعدادات tailnet-only:

- اضبط `gateway.bind: "tailnet"` في `~/.openclaw/openclaw.json`.
- أعد تشغيل Gateway (أو أعد تشغيل تطبيق شريط القوائم في macOS).

## ما الذي يعلن

يعلن Gateway فقط عن `_openclaw-gw._tcp`. ويتم توفير الإعلان المتعدد على الشبكة المحلية
عبر Plugin ‏`bonjour` المضمّن؛ بينما يبقى نشر DNS-SD واسع النطاق
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
- `canvasPort=<port>` (فقط عند تفعيل مضيف canvas؛ ويكون حاليًا هو نفسه `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (فقط في وضع mDNS الكامل، وتلميح اختياري عند توفر Tailnet)
- `sshPort=<port>` (فقط في وضع mDNS الكامل؛ وقد يهمل DNS-SD واسع النطاق هذا الحقل)
- `cliPath=<path>` (فقط في وضع mDNS الكامل؛ وما زال DNS-SD واسع النطاق يكتبه كتلميح للتثبيت البعيد)

ملاحظات أمان:

- سجلات TXT في Bonjour/mDNS **غير موثقة**. ولا يجب على العملاء التعامل مع TXT كمسار موثوق.
- ينبغي على العملاء التوجيه باستخدام نقطة نهاية الخدمة المحلولة (SRV + A/AAAA). وتعامل مع `lanHost` و`tailnetDns` و`gatewayPort` و`gatewayTlsSha256` على أنها مجرد تلميحات.
- ينبغي كذلك أن يستخدم الاستهداف التلقائي لـ SSH مضيف الخدمة المحلول، لا التلميحات المستندة إلى TXT فقط.
- يجب ألا يسمح تثبيت TLS pinning مطلقًا لقيمة `gatewayTlsSha256` المُعلَن عنها بأن تتجاوز pin مخزنة مسبقًا.
- ينبغي لعقد iOS/Android التعامل مع الاتصالات المباشرة المستندة إلى الاكتشاف على أنها **TLS-only** وأن تتطلب تأكيدًا صريحًا من المستخدم قبل الوثوق ببصمة تُرى لأول مرة.

## التصحيح على macOS

أدوات مدمجة مفيدة:

- استعراض المثيلات:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- حل مثيل واحد (استبدل `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

إذا كان الاستعراض يعمل لكن الحل يفشل، فأنت غالبًا تواجه سياسة شبكة محلية أو
مشكلة في محلل mDNS.

## التصحيح في سجلات Gateway

يكتب Gateway ملف سجل متجددًا (يُطبع عند بدء التشغيل بالشكل
`gateway log file: ...`). ابحث عن أسطر `bonjour:`، وخاصة:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## التصحيح على عقدة iOS

تستخدم عقدة iOS الأداة `NWBrowser` لاكتشاف `_openclaw-gw._tcp`.

لالتقاط السجلات:

- الإعدادات → Gateway → متقدم → **Discovery Debug Logs**
- الإعدادات → Gateway → متقدم → **Discovery Logs** → أعد إنتاج المشكلة → **Copy**

يتضمن السجل انتقالات حالة المستعرض وتغييرات مجموعة النتائج.

## أوضاع الفشل الشائعة

- **Bonjour لا يعبر الشبكات**: استخدم Tailnet أو SSH.
- **البث المتعدد محجوب**: بعض شبكات Wi‑Fi تعطل mDNS.
- **السكون / تغيّر الواجهة**: قد يسقط macOS نتائج mDNS مؤقتًا؛ أعد المحاولة.
- **الاستعراض يعمل لكن الحل يفشل**: أبقِ أسماء الأجهزة بسيطة (تجنب الرموز التعبيرية أو
  علامات الترقيم)، ثم أعد تشغيل Gateway. يشتق اسم مثيل الخدمة من
  اسم المضيف، لذا قد تربك الأسماء المعقدة جدًا بعض المحللات.

## أسماء المثيلات المُهربة (`\032`)

غالبًا ما يقوم Bonjour/DNS‑SD بتهريب البايتات في أسماء مثيلات الخدمة كسلاسل عشرية `\DDD`
(مثلًا تتحول المسافات إلى `\032`).

- هذا طبيعي على مستوى البروتوكول.
- ينبغي لواجهات المستخدم فك هذا الترميز عند العرض (يستخدم iOS الدالة `BonjourEscapes.decode`).

## التعطيل / الإعداد

- يؤدي `openclaw plugins disable bonjour` إلى تعطيل الإعلان المتعدد على الشبكة المحلية عبر تعطيل Plugin المضمّن.
- يؤدي `openclaw plugins enable bonjour` إلى استعادة Plugin الاكتشاف المحلي الافتراضي.
- يؤدي `OPENCLAW_DISABLE_BONJOUR=1` إلى تعطيل الإعلان المتعدد على الشبكة المحلية من دون تغيير إعداد Plugin؛ والقيم المقبولة التي تعني التفعيل هي `1` و`true` و`yes` و`on` (القديم: `OPENCLAW_DISABLE_BONJOUR`).
- يتحكم `gateway.bind` في `~/.openclaw/openclaw.json` في وضع ربط Gateway.
- يتجاوز `OPENCLAW_SSH_PORT` منفذ SSH عند الإعلان عن `sshPort` (القديم: `OPENCLAW_SSH_PORT`).
- ينشر `OPENCLAW_TAILNET_DNS` تلميح MagicDNS في TXT عندما يكون وضع mDNS الكامل مفعّلًا (القديم: `OPENCLAW_TAILNET_DNS`).
- يتجاوز `OPENCLAW_CLI_PATH` مسار CLI المُعلَن عنه (القديم: `OPENCLAW_CLI_PATH`).

## وثائق ذات صلة

- سياسة الاكتشاف واختيار النقل: [الاكتشاف](/ar/gateway/discovery)
- اقتران العقد + الموافقات: [اقتران Gateway](/ar/gateway/pairing)
