---
read_when:
    - تشغيل إعدادات Gateway البعيدة أو استكشاف أخطائها وإصلاحها
summary: الوصول عن بُعد باستخدام أنفاق SSH ‏(Gateway WS) وtailnets
title: الوصول عن بُعد
x-i18n:
    generated_at: "2026-04-26T11:30:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 208f0e6a4dbb342df878ea99d70606327efdfd3df36b07dfa3e68aafcae98e5c
    source_path: gateway/remote.md
    workflow: 15
---

يدعم هذا المستودع وضع "الوصول البعيد عبر SSH" من خلال إبقاء Gateway واحد (الرئيسي) يعمل على مضيف مخصص (سطح مكتب/خادم) وربط العملاء به.

- بالنسبة إلى **المشغّلين (أنت / تطبيق macOS)**: يُعد نفق SSH الحل الاحتياطي العام.
- بالنسبة إلى **العُقد (iOS/Android والأجهزة المستقبلية)**: يتم الاتصال بـ **Gateway WebSocket** (عبر LAN/tailnet أو نفق SSH حسب الحاجة).

## الفكرة الأساسية

- يرتبط Gateway WebSocket بـ **loopback** على المنفذ المهيأ لديك (الافتراضي 18789).
- للاستخدام البعيد، تقوم بتمرير منفذ loopback هذا عبر SSH (أو تستخدم tailnet/VPN وتقلل الحاجة إلى الأنفاق).

## إعدادات VPN/tailnet الشائعة (حيث يعيش الوكيل)

فكّر في **مضيف Gateway** على أنه "المكان الذي يعيش فيه الوكيل". فهو يملك الجلسات وملفات المصادقة والقنوات والحالة.
ويتصل الكمبيوتر المحمول/المكتبي لديك (والعُقد) بذلك المضيف.

### 1) Gateway دائم التشغيل في tailnet الخاصة بك (VPS أو خادم منزلي)

شغّل Gateway على مضيف دائم الوصول وبلغ إليه عبر **Tailscale** أو SSH.

- **أفضل تجربة استخدام:** أبقِ `gateway.bind: "loopback"` واستخدم **Tailscale Serve** مع Control UI.
- **الحل الاحتياطي:** أبقِ loopback + نفق SSH من أي جهاز يحتاج إلى الوصول.
- **أمثلة:** [exe.dev](/ar/install/exe-dev) (آلة افتراضية سهلة) أو [Hetzner](/ar/install/hetzner) (VPS للإنتاج).

وهذا مثالي عندما يدخل الكمبيوتر المحمول في السكون كثيرًا لكنك تريد بقاء الوكيل قيد التشغيل دائمًا.

### 2) سطح المكتب المنزلي يشغّل Gateway، والكمبيوتر المحمول يستخدمه عن بُعد

الكمبيوتر المحمول **لا** يشغّل الوكيل. بل يتصل عن بُعد:

- استخدم وضع **Remote over SSH** في تطبيق macOS (Settings → General → “OpenClaw runs”).
- يفتح التطبيق النفق ويديره، لذا يعمل WebChat + فحوصات السلامة تلقائيًا.

دليل التشغيل: [الوصول البعيد على macOS](/ar/platforms/mac/remote).

### 3) الكمبيوتر المحمول يشغّل Gateway، مع وصول بعيد من أجهزة أخرى

أبقِ Gateway محليًا لكن اكشفه بأمان:

- نفق SSH إلى الكمبيوتر المحمول من أجهزة أخرى، أو
- استخدم Tailscale Serve مع Control UI وأبقِ Gateway مقصورًا على loopback.

الدليل: [Tailscale](/ar/gateway/tailscale) و[نظرة عامة على الويب](/ar/web).

## تدفق الأوامر (ما الذي يعمل وأين)

تمتلك خدمة Gateway واحدة الحالة + القنوات. والعُقد مجرد أجهزة طرفية.

مثال على التدفق (Telegram ←→ عقدة):

- تصل رسالة Telegram إلى **Gateway**.
- يشغّل Gateway **الوكيل** ويقرر ما إذا كان سيستدعي أداة عقدة.
- يستدعي Gateway **العقدة** عبر Gateway WebSocket (`node.*` RPC).
- تعيد العقدة النتيجة؛ ثم يرسل Gateway الرد إلى Telegram.

ملاحظات:

- **العُقد لا تشغّل خدمة Gateway.** يجب تشغيل Gateway واحد فقط لكل مضيف ما لم تكن تشغّل عمدًا ملفات تعريف معزولة (راجع [Gateways متعددة](/ar/gateway/multiple-gateways)).
- وضع "node mode" في تطبيق macOS هو مجرد عميل عقدة عبر Gateway WebSocket.

## نفق SSH ‏(CLI + الأدوات)

أنشئ نفقًا محليًا إلى Gateway WS البعيد:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

بعد تشغيل النفق:

- سيصل `openclaw health` و`openclaw status --deep` الآن إلى Gateway البعيد عبر `ws://127.0.0.1:18789`.
- يمكن أيضًا لـ `openclaw gateway status` و`openclaw gateway health` و`openclaw gateway probe` و`openclaw gateway call` استهداف عنوان URL المُمرَّر عبر `--url` عند الحاجة.

ملاحظة: استبدل `18789` بالقيمة المهيأة في `gateway.port` (أو `--port`/`OPENCLAW_GATEWAY_PORT`).
ملاحظة: عند تمرير `--url`، لا تعود CLI إلى بيانات اعتماد الإعدادات أو البيئة.
ضمّن `--token` أو `--password` صراحةً. ويُعد غياب بيانات الاعتماد الصريحة خطأً.

## الإعدادات الافتراضية البعيدة في CLI

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

عندما يكون Gateway مقصورًا على loopback، أبقِ عنوان URL على `ws://127.0.0.1:18789` وافتح نفق SSH أولًا.
وفي نقل نفق SSH في تطبيق macOS، توضع أسماء المضيفات المكتشفة لـ Gateway في
`gateway.remote.sshTarget`؛ بينما يبقى `gateway.remote.url` هو عنوان URL المحلي للنفق.

## أولوية بيانات الاعتماد

يتبع حل بيانات اعتماد Gateway عقدًا مشتركًا واحدًا عبر مسارات call/probe/status ومراقبة موافقة التنفيذ في Discord. ويستخدم node-host العقد الأساسي نفسه مع استثناء واحد في الوضع المحلي (إذ يتجاهل عمدًا `gateway.remote.*`):

- بيانات الاعتماد الصريحة (`--token` أو `--password` أو أداة `gatewayToken`) تتقدم دائمًا في مسارات الاستدعاء التي تقبل مصادقة صريحة.
- أمان تجاوز عنوان URL:
  - لا تعيد تجاوزات URL في CLI (`--url`) استخدام بيانات الاعتماد الضمنية من الإعدادات/البيئة مطلقًا.
  - يمكن لتجاوزات URL من env (`OPENCLAW_GATEWAY_URL`) استخدام بيانات اعتماد env فقط (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- الإعدادات الافتراضية للوضع المحلي:
  - token: ‏`OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (ينطبق fallback البعيد فقط عندما لا تكون قيمة token للمصادقة المحلية مضبوطة)
  - password: ‏`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (ينطبق fallback البعيد فقط عندما لا تكون قيمة password للمصادقة المحلية مضبوطة)
- الإعدادات الافتراضية للوضع البعيد:
  - token: ‏`gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: ‏`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- استثناء node-host في الوضع المحلي: يتم تجاهل `gateway.remote.token` / `gateway.remote.password`.
- تكون فحوصات token في probe/status البعيدة صارمة افتراضيًا: إذ تستخدم `gateway.remote.token` فقط (من دون fallback إلى token المحلي) عند استهداف الوضع البعيد.
- تستخدم تجاوزات env الخاصة بـ Gateway القيم `OPENCLAW_GATEWAY_*` فقط.

## Chat UI عبر SSH

لم يعد WebChat يستخدم منفذ HTTP منفصلًا. تتصل واجهة دردشة SwiftUI مباشرةً بـ Gateway WebSocket.

- مرّر المنفذ `18789` عبر SSH (راجع أعلاه)، ثم صِل العملاء بـ `ws://127.0.0.1:18789`.
- على macOS، فضّل وضع “Remote over SSH” في التطبيق، إذ يدير النفق تلقائيًا.

## تطبيق macOS: ‏"Remote over SSH"

يمكن لتطبيق شريط القوائم في macOS تشغيل الإعداد نفسه من البداية إلى النهاية (فحوصات الحالة عن بُعد، وWebChat، وتمرير Voice Wake).

دليل التشغيل: [الوصول البعيد على macOS](/ar/platforms/mac/remote).

## قواعد الأمان (البعيد/VPN)

النسخة المختصرة: **أبقِ Gateway مقصورًا على loopback** ما لم تكن متأكدًا أنك بحاجة إلى bind.

- يُعد **Loopback + SSH/Tailscale Serve** الخيار الافتراضي الأكثر أمانًا (دون تعريض عام).
- يكون `ws://` النصي الصريح مقصورًا افتراضيًا على loopback. وبالنسبة إلى الشبكات الخاصة الموثوقة،
  اضبط `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` على عملية العميل
  كخيار طوارئ. ولا يوجد ما يكافئه في `openclaw.json`؛ إذ يجب أن يكون هذا في
  بيئة العملية الخاصة بالعميل الذي يجري اتصال WebSocket.
- يجب أن تستخدم **عمليات bind غير التابعة لـ loopback** (`lan`/`tailnet`/`custom`، أو `auto` عند عدم توفر loopback) مصادقة Gateway: ‏token أو password أو reverse proxy واعٍ بالهوية مع `gateway.auth.mode: "trusted-proxy"`.
- يُعد `gateway.remote.token` / `.password` مصادر بيانات اعتماد للعميل. وهي **لا** تضبط مصادقة الخادم بذاتها.
- يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كقيمة fallback فقط عندما لا يكون `gateway.auth.*` مضبوطًا.
- إذا تم ضبط `gateway.auth.token` / `gateway.auth.password` صراحةً عبر SecretRef ولم تُحل، فإن الحل يفشل بشكل مغلق (من دون أن يخفي fallback البعيد المشكلة).
- يثبت `gateway.remote.tlsFingerprint` شهادة TLS البعيدة عند استخدام `wss://`.
- يمكن لـ **Tailscale Serve** مصادقة حركة مرور Control UI/WebSocket عبر ترويسات الهوية
  عندما تكون `gateway.auth.allowTailscale: true`؛ أما نقاط نهاية HTTP API فلا
  تستخدم مصادقة ترويسة Tailscale هذه، بل تتبع وضع مصادقة HTTP العادي في gateway. ويفترض هذا التدفق
  من دون token أن مضيف gateway موثوق. اضبطه على
  `false` إذا كنت تريد مصادقة بالسر المشترك في كل مكان.
- تُستخدم مصادقة **Trusted-proxy** فقط مع إعدادات reverse proxy غير التابعة لـ loopback والواعية بالهوية.
  ولا تستوفي reverse proxies المحلية على المضيف نفسه مع loopback شرط `gateway.auth.mode: "trusted-proxy"`.
- تعامل مع التحكم عبر المتصفح على أنه وصول مشغّل: tailnet فقط + اقتران متعمد للعقد.

شرح متعمق: [الأمان](/ar/gateway/security).

### macOS: نفق SSH دائم عبر LaunchAgent

بالنسبة إلى عملاء macOS الذين يتصلون بـ Gateway بعيد، فإن أسهل إعداد دائم يستخدم إدخال `LocalForward` في إعدادات SSH بالإضافة إلى LaunchAgent للحفاظ على النفق حيًا عبر إعادة التشغيل والتعطل.

#### الخطوة 1: أضف إعدادات SSH

عدّل `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

استبدل `<REMOTE_IP>` و`<REMOTE_USER>` بقيمك.

#### الخطوة 2: انسخ مفتاح SSH (مرة واحدة)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### الخطوة 3: هيّئ Gateway token

خزّن token في الإعدادات حتى تستمر عبر عمليات إعادة التشغيل:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### الخطوة 4: أنشئ LaunchAgent

احفظ ما يلي باسم `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

#### الخطوة 5: حمّل LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

سيبدأ النفق تلقائيًا عند تسجيل الدخول، ويُعاد تشغيله عند التعطل، ويُبقي المنفذ المُمرَّر حيًا.

ملاحظة: إذا كان لديك LaunchAgent قديم باسم `com.openclaw.ssh-tunnel` من إعداد سابق، فقم بإلغاء تحميله وحذفه.

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

| إدخال الإعداد                         | ما الذي يفعله                                                   |
| ------------------------------------ | --------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | يمرر المنفذ المحلي 18789 إلى المنفذ البعيد 18789                |
| `ssh -N`                             | SSH دون تنفيذ أوامر بعيدة (للتمرير عبر المنافذ فقط)            |
| `KeepAlive`                          | يعيد تشغيل النفق تلقائيًا إذا تعطل                              |
| `RunAtLoad`                          | يبدأ النفق عند تحميل LaunchAgent وقت تسجيل الدخول               |

## ذو صلة

- [Tailscale](/ar/gateway/tailscale)
- [المصادقة](/ar/gateway/authentication)
- [إعداد Gateway البعيد](/ar/gateway/remote-gateway-readme)
