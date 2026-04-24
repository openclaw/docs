---
read_when:
    - تشغيل إعدادات gateway البعيدة أو استكشاف أخطائها وإصلاحها
summary: الوصول البعيد باستخدام أنفاق SSH ‏(Gateway WS) وtailnets
title: الوصول البعيد
x-i18n:
    generated_at: "2026-04-24T07:43:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eebbe3762134f29f982201d7e79a789624b96042bd931e07d9855710d64bfe
    source_path: gateway/remote.md
    workflow: 15
---

# الوصول البعيد (SSH والأنفاق وtailnets)

يدعم هذا المستودع وضع "عن بُعد عبر SSH" من خلال إبقاء Gateway واحدة (الأساسية) تعمل على مضيف مخصص (سطح مكتب/خادم) وربط العملاء بها.

- بالنسبة إلى **المشغلين (أنت / تطبيق macOS)**: تُعد أنفاق SSH الحل الاحتياطي العام.
- بالنسبة إلى **Nodes ‏(iOS/Android والأجهزة المستقبلية)**: اتصل بـ **Gateway WebSocket** ‏(LAN/tailnet أو نفق SSH عند الحاجة).

## الفكرة الأساسية

- ترتبط Gateway WebSocket بـ **loopback** على المنفذ المضبوط لديك (الافتراضي 18789).
- للاستخدام البعيد، تقوم بتمرير منفذ loopback هذا عبر SSH (أو تستخدم tailnet/VPN وتقلل الحاجة إلى الأنفاق).

## إعدادات VPN/tailnet الشائعة (مكان وجود الوكيل)

فكّر في **مضيف Gateway** على أنه "المكان الذي يعيش فيه الوكيل". فهو يملك الجلسات وملفات المصادقة والقنوات والحالة.
ويتصل حاسوبك المحمول/سطح المكتب (والـ Nodes) بهذا المضيف.

### 1) Gateway تعمل دائمًا في tailnet لديك (VPS أو خادم منزلي)

شغّل Gateway على مضيف دائم الوصول وادخل إليه عبر **Tailscale** أو SSH.

- **أفضل تجربة استخدام:** أبقِ `gateway.bind: "loopback"` واستخدم **Tailscale Serve** من أجل Control UI.
- **الرجوع الاحتياطي:** أبقِ loopback + نفق SSH من أي جهاز يحتاج إلى الوصول.
- **أمثلة:** [exe.dev](/ar/install/exe-dev) ‏(آلة افتراضية سهلة) أو [Hetzner](/ar/install/hetzner) ‏(VPS للإنتاج).

هذا مثالي عندما ينام حاسوبك المحمول كثيرًا لكنك تريد الوكيل دائم التشغيل.

### 2) سطح المكتب المنزلي يشغّل Gateway، والحاسوب المحمول هو جهاز التحكم البعيد

لا يشغّل الحاسوب المحمول الوكيل. بل يتصل عن بُعد:

- استخدم وضع **Remote over SSH** في تطبيق macOS ‏(Settings → General → “OpenClaw runs”).
- يفتح التطبيق النفق ويديره، لذا يعمل WebChat + فحوصات الصحة "ببساطة".

دليل التشغيل: [الوصول البعيد على macOS](/ar/platforms/mac/remote).

### 3) الحاسوب المحمول يشغّل Gateway، والوصول البعيد يتم من أجهزة أخرى

أبقِ Gateway محلية لكن اكشفها بأمان:

- نفق SSH إلى الحاسوب المحمول من الأجهزة الأخرى، أو
- استخدم Tailscale Serve لـ Control UI وأبقِ Gateway مقتصرة على loopback.

الدليل: [Tailscale](/ar/gateway/tailscale) و[نظرة عامة على الويب](/ar/web).

## تدفق الأوامر (ما الذي يعمل وأين)

خدمة gateway واحدة تملك الحالة + القنوات. أما Nodes فهي أجهزة طرفية.

مثال على التدفق (Telegram → node):

- تصل رسالة Telegram إلى **Gateway**.
- تشغّل Gateway **الوكيل** وتقرر ما إذا كانت ستستدعي أداة node.
- تستدعي Gateway **node** عبر Gateway WebSocket ‏(`node.*` RPC).
- تعيد Node النتيجة؛ وترد Gateway مرة أخرى إلى Telegram.

ملاحظات:

- **لا تقوم Nodes بتشغيل خدمة gateway.** يجب تشغيل gateway واحدة فقط لكل مضيف ما لم تكن تشغّل profiles معزولة عمدًا (راجع [Gateways متعددة](/ar/gateway/multiple-gateways)).
- إن "وضع node" في تطبيق macOS هو مجرد عميل node عبر Gateway WebSocket.

## نفق SSH ‏(CLI + الأدوات)

أنشئ نفقًا محليًا إلى Gateway WS البعيدة:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

مع رفع النفق:

- أصبح `openclaw health` و`openclaw status --deep` يصلان الآن إلى gateway البعيدة عبر `ws://127.0.0.1:18789`.
- كما يمكن للأوامر `openclaw gateway status` و`openclaw gateway health` و`openclaw gateway probe` و`openclaw gateway call` استهداف عنوان URL المُمرَّر عبر `--url` عند الحاجة.

ملاحظة: استبدل `18789` بالقيمة المضبوطة في `gateway.port` ‏(أو `--port`/`OPENCLAW_GATEWAY_PORT`).
ملاحظة: عندما تمرر `--url`، لا يرجع CLI إلى بيانات الاعتماد من الإعدادات أو environment.
ضمّن `--token` أو `--password` صراحةً. ويُعد غياب بيانات الاعتماد الصريحة خطأ.

## القيم الافتراضية البعيدة في CLI

يمكنك حفظ هدف بعيد بحيث تستخدمه أوامر CLI افتراضيًا:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

عندما تكون gateway مقتصرة على loopback فقط، أبقِ عنوان URL عند `ws://127.0.0.1:18789` وافتح نفق SSH أولًا.

## أسبقية بيانات الاعتماد

يتبع حل بيانات اعتماد Gateway عقدًا مشتركًا واحدًا عبر مسارات call/probe/status ومراقبة موافقات exec في Discord. ويستخدم node-host العقد الأساسي نفسه مع استثناء واحد في الوضع المحلي (إذ يتجاهل عمدًا `gateway.remote.*`):

- تفوز بيانات الاعتماد الصريحة (`--token` أو `--password` أو `gatewayToken` الخاصة بالأداة) دائمًا في مسارات الاستدعاء التي تقبل مصادقة صريحة.
- أمان تجاوز عنوان URL:
  - لا تعيد تجاوزات عنوان URL في CLI ‏(`--url`) استخدام بيانات الاعتماد الضمنية من config/env مطلقًا.
  - يمكن لتجاوزات عنوان URL في environment ‏(`OPENCLAW_GATEWAY_URL`) استخدام بيانات اعتماد environment فقط (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- القيم الافتراضية للوضع المحلي:
  - الرمز المميز: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` ‏(ينطبق الرجوع إلى remote فقط عندما تكون قيمة token المحلية غير مضبوطة)
  - كلمة المرور: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` ‏(ينطبق الرجوع إلى remote فقط عندما تكون قيمة password المحلية غير مضبوطة)
- القيم الافتراضية للوضع البعيد:
  - الرمز المميز: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - كلمة المرور: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- استثناء الوضع المحلي في node-host: يتم تجاهل `gateway.remote.token` / `gateway.remote.password`.
- تكون فحوصات token الخاصة بـ remote probe/status صارمة افتراضيًا: إذ تستخدم `gateway.remote.token` فقط (من دون رجوع إلى token المحلية) عند استهداف الوضع البعيد.
- تستخدم تجاوزات environment الخاصة بـ Gateway القيم `OPENCLAW_GATEWAY_*` فقط.

## واجهة الدردشة عبر SSH

لم يعد WebChat يستخدم منفذ HTTP منفصلًا. تتصل واجهة الدردشة SwiftUI مباشرةً بـ Gateway WebSocket.

- مرّر المنفذ `18789` عبر SSH ‏(انظر أعلاه)، ثم اربط العملاء بـ `ws://127.0.0.1:18789`.
- على macOS، فضّل وضع "Remote over SSH" في التطبيق، لأنه يدير النفق تلقائيًا.

## "Remote over SSH" في تطبيق macOS

يمكن لتطبيق شريط القائمة في macOS تشغيل الإعداد نفسه من البداية إلى النهاية (فحوصات حالة بعيدة، وWebChat، وتمرير Voice Wake).

دليل التشغيل: [الوصول البعيد على macOS](/ar/platforms/mac/remote).

## قواعد الأمان (البعيد/VPN)

باختصار: **أبقِ Gateway مقتصرة على loopback** ما لم تكن متأكدًا أنك تحتاج إلى ربط آخر.

- **Loopback + SSH/Tailscale Serve** هو الخيار الافتراضي الأكثر أمانًا (من دون تعرض عام).
- يكون `ws://` النصي الصريح مقتصرًا على loopback افتراضيًا. وبالنسبة إلى الشبكات الخاصة الموثوقة،
  اضبط `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` على عملية العميل
  كإجراء كسر زجاج. ولا يوجد مقابل لهذا في `openclaw.json`؛ إذ يجب أن يكون
  في environment الخاصة بعملية العميل التي تنشئ اتصال WebSocket.
- **الربط غير loopback** ‏(`lan`/`tailnet`/`custom`، أو `auto` عندما لا تكون loopback متاحة) يجب أن يستخدم مصادقة gateway: رمزًا مميزًا، أو كلمة مرور، أو reverse proxy واعية بالهوية مع `gateway.auth.mode: "trusted-proxy"`.
- تُعد `gateway.remote.token` / `.password` مصادر بيانات اعتماد للعميل. وهي **لا** تضبط مصادقة الخادم بمفردها.
- يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كرجوع احتياطي فقط عندما تكون `gateway.auth.*` غير مضبوطة.
- إذا كانت `gateway.auth.token` / `gateway.auth.password` مضبوطة صراحةً عبر SecretRef وكانت غير محلولة، فإن الحل يفشل بشكل مغلق (من دون إخفاء الرجوع إلى remote).
- تقوم `gateway.remote.tlsFingerprint` بتثبيت شهادة TLS البعيدة عند استخدام `wss://`.
- يمكن لـ **Tailscale Serve** مصادقة حركة مرور Control UI/WebSocket عبر رؤوس الهوية
  عندما تكون `gateway.auth.allowTailscale: true`؛ أما نقاط نهاية HTTP API فلا
  تستخدم مصادقة رؤوس Tailscale تلك، بل تتبع وضع HTTP العادي الخاص بالـ gateway.
  ويفترض هذا التدفق من دون token أن مضيف gateway موثوق. اضبطه على
  `false` إذا كنت تريد مصادقة السر المشترك في كل مكان.
- تُستخدم مصادقة **trusted-proxy** فقط في إعدادات non-loopback identity-aware proxy.
  ولا تستوفي reverse proxy المحلية على المضيف نفسه وضع `gateway.auth.mode: "trusted-proxy"`.
- تعامل مع تحكم المتصفح على أنه وصول مشغّل: tailnet فقط + اقتران Node مقصود.

للتفاصيل المتعمقة: [الأمان](/ar/gateway/security).

### macOS: نفق SSH دائم عبر LaunchAgent

بالنسبة إلى عملاء macOS الذين يتصلون بـ gateway بعيدة، فإن أسهل إعداد دائم يستخدم إدخال `LocalForward` في إعداد SSH بالإضافة إلى LaunchAgent للإبقاء على النفق حيًا عبر إعادة التشغيل والأعطال.

#### الخطوة 1: إضافة إعداد SSH

حرّر `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

استبدل `<REMOTE_IP>` و`<REMOTE_USER>` بقيمك.

#### الخطوة 2: نسخ مفتاح SSH ‏(مرة واحدة)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### الخطوة 3: ضبط رمز gateway المميز

خزّن الرمز المميز في الإعدادات حتى يستمر عبر عمليات إعادة التشغيل:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### الخطوة 4: إنشاء LaunchAgent

احفظ ما يلي في `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### الخطوة 5: تحميل LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

سيبدأ النفق تلقائيًا عند تسجيل الدخول، ويُعاد تشغيله عند التعطل، وسيبقي المنفذ المُمرَّر حيًا.

ملاحظة: إذا كان لديك LaunchAgent قديم باسم `com.openclaw.ssh-tunnel` من إعداد أقدم، فقم بإلغاء تحميله وحذفه.

#### استكشاف الأخطاء وإصلاحها

تحقق مما إذا كان النفق يعمل:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

أعد تشغيل النفق:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

أوقف النفق:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| إدخال الإعداد                         | ما الذي يفعله                                                 |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | يمرّر المنفذ المحلي 18789 إلى المنفذ البعيد 18789             |
| `ssh -N`                             | SSH من دون تنفيذ أوامر بعيدة (تمرير المنافذ فقط)              |
| `KeepAlive`                          | يعيد تشغيل النفق تلقائيًا إذا تعطل                           |
| `RunAtLoad`                          | يبدأ النفق عند تحميل LaunchAgent عند تسجيل الدخول             |

## ذو صلة

- [Tailscale](/ar/gateway/tailscale)
- [المصادقة](/ar/gateway/authentication)
- [إعداد gateway البعيدة](/ar/gateway/remote-gateway-readme)
